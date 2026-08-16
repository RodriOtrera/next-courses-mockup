"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth_schema";
import { email_consent } from "@/lib/db/schema/email_consent";
import z from "zod";
import { adminAction, ActionError } from "../safe_action";
import {
  CONSENT_TOKEN_TTL_DAYS,
  confirmUrlFor,
  requestConsent,
  usersWithoutConsent,
} from "@/lib/email/consent";
import { getResend, resendFrom, resendReplyTo, unwrap } from "@/lib/email/resend";
import { chunk } from "@/lib/email/throttle";
import {
  confirmConsentSubject,
  renderConfirmConsentHtml,
  renderConfirmConsentText,
} from "@/lib/email/templates/confirm_consent";
import { captureServer } from "@/lib/analytics/server";

/**
 * One-time re-consent campaign.
 *
 * Existing accounts predate the consent table, so on day one every cohort
 * resolves to zero recipients. This asks each of them, once, whether they want
 * marketing mail — nobody is grandfathered in.
 *
 * Implemented as an admin action rather than a `scripts/` CLI on purpose:
 * `node --experimental-strip-types` cannot resolve this project's `@/*`
 * tsconfig paths, so a script would have to duplicate the consent state
 * machine and the templates, or pull in a path-resolving loader. Running it
 * here reuses the real implementation and inherits the `ADMIN_EMAILS` gate.
 *
 * Batched because it is O(users) mail: the operator clicks until `remaining`
 * reaches zero, and each run is bounded well inside the serverless limit.
 */

/** Resend's batch endpoint accepts at most 100 messages per request. */
const BATCH_SIZE = 100;

/** Users touched per invocation. Two batch calls, comfortably inside 60s. */
const MAX_PER_RUN = 200;

/** Counts for the dashboard panel — the dry run. */
export const getReconsentStatus = adminAction.action(async () => {
  const [[totalUsers], [confirmed], [pending], [unsubscribed]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(email_consent).where(eq(email_consent.status, "confirmed")),
    db.select({ value: count() }).from(email_consent).where(eq(email_consent.status, "pending")),
    db
      .select({ value: count() })
      .from(email_consent)
      .where(eq(email_consent.status, "unsubscribed")),
  ]);

  const pendingAsk = await usersWithoutConsent();

  return {
    totalUsers: totalUsers?.value ?? 0,
    confirmed: confirmed?.value ?? 0,
    pending: pending?.value ?? 0,
    unsubscribed: unsubscribed?.value ?? 0,
    /** Users who have never been asked — what a run would email. */
    neverAsked: pendingAsk.length,
  };
});

/**
 * Ask the next slice of never-asked users to confirm.
 *
 * Idempotent: `usersWithoutConsent()` only returns users with no consent row at
 * all, and every user emailed here gets one. Re-running therefore continues
 * rather than re-mailing, and a run that dies halfway leaves the already-mailed
 * users out of the next selection.
 */
export const sendReconsentBatch = adminAction
  .schema(z.object({ limit: z.number().int().min(1).max(MAX_PER_RUN).default(MAX_PER_RUN) }))
  .action(async ({ parsedInput: { limit }, ctx }) => {
    const targets = (await usersWithoutConsent()).slice(0, limit);
    if (targets.length === 0) {
      return { sent: 0, failed: 0, remaining: 0 };
    }

    // Mint a pending row + token per user first. Doing this before any send
    // means a mail that goes out always has a redeemable link behind it; the
    // reverse order can email a token that was never stored.
    const prepared: { email: string; token: string }[] = [];
    for (const target of targets) {
      const result = await requestConsent({
        email: target.email,
        userId: target.id,
        source: "reconsent",
      });
      if (result.status === "sent") {
        prepared.push({ email: target.email, token: result.token });
      }
    }

    const from = resendFrom();
    const replyTo = resendReplyTo();
    const subject = confirmConsentSubject();

    let sent = 0;
    let failed = 0;

    for (const group of chunk(prepared, BATCH_SIZE)) {
      const payload = group.map(({ email, token }) => {
        const content = {
          confirmUrl: confirmUrlFor(token),
          expiresInDays: CONSENT_TOKEN_TTL_DAYS,
        };
        return {
          from,
          to: email,
          subject,
          html: renderConfirmConsentHtml(content),
          text: renderConfirmConsentText(content),
          ...(replyTo ? { replyTo } : {}),
        };
      });

      try {
        const result = await unwrap(getResend().batch.send(payload), "batch.send(reconsent)");
        sent += result.data.length;
      } catch (err) {
        // Their consent rows stay `pending` with no confirmation delivered.
        // They are no longer "never asked", so the next run skips them — the
        // recovery is the operator resending from the Resend dashboard or the
        // user subscribing again from the footer.
        failed += group.length;
        console.error("[reconsent] batch failed:", err);
      }
    }

    await captureServer("email_consent_requested", ctx.user.id, { source: "reconsent" });

    const remaining = Math.max(0, (await usersWithoutConsent()).length);
    if (sent === 0 && failed > 0) {
      throw new ActionError("Fallaron todos los envios. Revisa la configuracion de Resend.");
    }

    return { sent, failed, remaining };
  });
