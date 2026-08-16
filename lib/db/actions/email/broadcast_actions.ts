"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import z from "zod";
import { db } from "@/lib/db";
import { adminAction, ActionError } from "../safe_action";
import {
  broadcastCohortSchema,
  email_broadcast,
  type BroadcastCohort,
} from "@/lib/db/schema/email_consent";
import { cohortRecipientCount, ensureSegment, reconcileSegment } from "@/lib/email/segments";
import { getResend, resendFrom, resendReplyTo, unwrap } from "@/lib/email/resend";
import {
  renderBroadcastHtml,
  renderBroadcastPreview,
  renderBroadcastText,
  type BroadcastContent,
} from "@/lib/email/templates/broadcast";
import { captureServer } from "@/lib/analytics/server";

/**
 * Admin-only broadcast composer backend.
 *
 * Every action here is on `adminAction`, so an `ADMIN_EMAILS` membership is
 * checked before anything runs. That is not belt-and-braces: `"use server"`
 * publishes each export as an unauthenticated HTTP endpoint, and the mailer
 * this replaces had no check at all.
 */

const contentSchema = z.object({
  cohort: broadcastCohortSchema,
  subject: z.string().trim().min(1, "Falta el asunto.").max(200),
  previewText: z.string().trim().max(200).optional(),
  title: z.string().trim().min(1, "Falta el titulo.").max(200),
  content: z.string().trim().min(1, "Falta el contenido.").max(20_000),
  buttonTitle: z.string().trim().max(80).optional(),
  buttonUrl: z.string().trim().url().optional(),
  imgUrl: z.string().trim().url().optional(),
});

function toContent(input: z.infer<typeof contentSchema>): BroadcastContent {
  return {
    title: input.title,
    content: input.content,
    buttonTitle: input.buttonTitle,
    buttonUrl: input.buttonUrl,
    imgUrl: input.imgUrl,
  };
}

/** Live recipient count for the composer — "this will reach N people". */
export const getCohortCount = adminAction
  .schema(z.object({ cohort: broadcastCohortSchema }))
  .action(async ({ parsedInput: { cohort } }) => {
    return { cohort, count: await cohortRecipientCount(cohort) };
  });

/**
 * Force a cohort's Resend segment to match the database right now.
 *
 * Exposed as its own button because the hourly cron may not have caught a
 * just-confirmed subscriber, and an operator about to send wants to know the
 * segment is current rather than hoping.
 */
export const syncCohort = adminAction
  .schema(z.object({ cohort: broadcastCohortSchema }))
  .action(async ({ parsedInput: { cohort } }) => {
    return reconcileSegment(cohort);
  });

/**
 * Send the composed email to the admin's own address.
 *
 * Goes through `emails.send`, not the broadcast pipeline, so it touches no
 * segment and no contact — a test must never be able to reach the list.
 */
export const sendTestBroadcast = adminAction
  .schema(contentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const replyTo = resendReplyTo();

    await unwrap(
      getResend().emails.send({
        from: resendFrom(),
        to: ctx.user.email,
        subject: `[PRUEBA] ${parsedInput.subject}`,
        html: renderBroadcastPreview(toContent(parsedInput), parsedInput.previewText),
        text: renderBroadcastText(toContent(parsedInput)),
        ...(replyTo ? { replyTo } : {}),
      }),
      "emails.send(test broadcast)",
    );

    return { sentTo: ctx.user.email };
  });

const sendSchema = contentSchema.extend({
  /**
   * ISO 8601 or Resend's relative syntax ("in 1 hour"). Absent means send now.
   */
  scheduledAt: z.string().trim().max(60).optional(),
  /** `true` leaves the broadcast as a Resend draft instead of dispatching it. */
  draftOnly: z.boolean().default(false),
});

/**
 * Compose, persist and dispatch a broadcast.
 *
 * Deliberately two Resend calls (`create` then `send`) rather than
 * `create({ send: true })`: the local audit row is written in between, so a
 * crash mid-flight leaves a reviewable draft rather than a blast nobody has a
 * record of.
 */
export const sendBroadcast = adminAction
  .schema(sendSchema)
  .action(async ({ parsedInput, ctx }) => {
    const cohort = parsedInput.cohort as BroadcastCohort;

    // Push database → Resend before reading the count, so the segment about to
    // be mailed reflects the consent table rather than the last cron run.
    await reconcileSegment(cohort);
    const segmentId = await ensureSegment(cohort);
    const recipientCount = await cohortRecipientCount(cohort);

    if (recipientCount === 0) {
      throw new ActionError(
        "Ese publico no tiene destinatarios confirmados. Nadie recibiria el correo.",
      );
    }

    const content = toContent(parsedInput);
    const html = renderBroadcastHtml(content, { previewText: parsedInput.previewText });
    const text = renderBroadcastText(content);
    const replyTo = resendReplyTo();

    const rowId = randomUUID();
    let resendBroadcastId: string | undefined;

    try {
      const created = await unwrap(
        getResend().broadcasts.create({
          segmentId,
          from: resendFrom(),
          subject: parsedInput.subject,
          html,
          text,
          name: `${parsedInput.title} · ${cohort}`,
          ...(parsedInput.previewText ? { previewText: parsedInput.previewText } : {}),
          ...(replyTo ? { replyTo } : {}),
        }),
        "broadcasts.create",
      );
      resendBroadcastId = created.id;

      // Persisted before dispatch — this row is the record that the send happened.
      await db.insert(email_broadcast).values({
        id: rowId,
        resend_broadcast_id: created.id,
        cohort,
        subject: parsedInput.subject,
        preview_text: parsedInput.previewText ?? null,
        html,
        recipient_count: recipientCount,
        status: parsedInput.draftOnly ? "draft" : "sending",
        scheduled_at: null,
        created_by: ctx.user.id,
      });

      if (parsedInput.draftOnly) {
        revalidatePath("/dashboard/email");
        return { status: "draft" as const, broadcastId: created.id, recipientCount };
      }

      await unwrap(
        getResend().broadcasts.send(
          created.id,
          parsedInput.scheduledAt ? { scheduledAt: parsedInput.scheduledAt } : undefined,
        ),
        "broadcasts.send",
      );

      const now = new Date();
      await db
        .update(email_broadcast)
        .set({
          status: "sent",
          sent_at: parsedInput.scheduledAt ? null : now,
          scheduled_at: parsedInput.scheduledAt ? now : null,
          updated_at: now,
        })
        .where(eq(email_broadcast.id, rowId));

      await captureServer("broadcast_sent", ctx.user.id, {
        cohort,
        recipient_count: recipientCount,
        scheduled: Boolean(parsedInput.scheduledAt),
      });

      revalidatePath("/dashboard/email");
      return {
        status: "sent" as const,
        broadcastId: created.id,
        recipientCount,
        scheduled: Boolean(parsedInput.scheduledAt),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Record the failure against the row when one exists, so a broadcast that
      // died between create and send is visible rather than a silent gap.
      if (resendBroadcastId) {
        await db
          .update(email_broadcast)
          .set({ status: "failed", error_message: message, updated_at: new Date() })
          .where(eq(email_broadcast.id, rowId));
      }

      await captureServer("broadcast_failed", ctx.user.id, { cohort, reason: message });
      throw new ActionError(`No se pudo enviar: ${message}`);
    }
  });
