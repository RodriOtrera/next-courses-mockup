"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import z from "zod";
import { action, authAction, ActionError } from "../safe_action";
import {
  confirmConsent,
  getConsentByValidToken,
  grantConsent,
  mintPreferencesToken,
  normalizeEmail,
  requestConsent,
  resumeConsent,
  sendConfirmationEmail,
  sendPreferencesEmail,
  withdrawConsent,
} from "@/lib/email/consent";
import { captureServer, SYSTEM_DISTINCT_ID } from "@/lib/analytics/server";

/**
 * Consent surface for end users.
 *
 * Note what is *not* here: nothing reads or writes another person's consent.
 * The authenticated actions operate on `ctx.user.email` only, and the public
 * ones require possession of an emailed token. A `"use server"` module exports
 * every function as an unauthenticated RPC endpoint, so an `email` parameter on
 * an opt-*out* action would let anyone unsubscribe anyone.
 */

/** Consent evidence: who asked, from where, with what client. */
async function requestContext() {
  const h = await headers();
  return {
    // Vercel sets x-forwarded-for; the first entry is the client.
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

/**
 * Opt in from an authenticated surface (account page, post-signup).
 *
 * Confirmed immediately with no second email: BetterAuth's OTP flow already
 * made this user type a code sent to this exact mailbox, so ownership is
 * proven. The checkbox is the consent.
 */
export const grantEmailConsent = authAction
  .schema(z.object({ source: z.enum(["signup", "account"]) }))
  .action(async ({ parsedInput: { source }, ctx }) => {
    const { ip, userAgent } = await requestContext();

    await grantConsent({
      email: ctx.user.email,
      userId: ctx.user.id,
      source,
      ip,
      userAgent,
    });

    await captureServer("email_consent_granted", ctx.user.id, { source, double_opt_in: false });
    revalidatePath("/productos/micuenta");
    return { status: "confirmed" as const };
  });

/** Opt out from the account page. Always acts on the caller's own address. */
export const revokeEmailConsent = authAction.action(async ({ ctx }) => {
  await withdrawConsent(ctx.user.email);
  await captureServer("email_consent_revoked", ctx.user.id, { source: "account" });
  revalidatePath("/productos/micuenta");
  return { status: "unsubscribed" as const };
});

/**
 * Public opt-in from the footer form.
 *
 * The address is unverified here, so this is the path that genuinely needs the
 * confirmation email: `pending` now, `confirmed` only once the link is clicked.
 *
 * The response is deliberately identical whether the address was new, already
 * subscribed, or rate-limited. Varying it would turn the form into an oracle
 * for "is this person a customer?".
 */
export const subscribeToNewsletter = action
  .schema(z.object({ email: z.string().trim().email().max(254) }))
  .action(async ({ parsedInput: { email } }) => {
    const { ip, userAgent } = await requestContext();
    const normalized = normalizeEmail(email);

    const result = await requestConsent({ email: normalized, source: "footer", ip, userAgent });

    if (result.status === "sent") {
      await sendConfirmationEmail(normalized, result.token);
      // Attributed to the system: there is no account here, and using the email
      // as a distinct id would seed the identity graph with profiles that never
      // stitch to the user who later signs up with that address.
      await captureServer("email_consent_requested", SYSTEM_DISTINCT_ID, { source: "footer" });
    }

    return { ok: true as const };
  });

/**
 * Redeem a confirmation link.
 *
 * Takes the raw token as its only authority, which is the point: the person
 * clicking has proven they can read mail at that address.
 */
export const confirmEmailConsent = action
  .schema(z.object({ token: z.string().min(10).max(200) }))
  .action(async ({ parsedInput: { token } }) => {
    const result = await confirmConsent(token);

    if (!result.ok) {
      throw new ActionError(
        result.reason === "expired"
          ? "El enlace vencio. Pedi uno nuevo desde el pie de pagina."
          : "El enlace no es valido o ya fue usado.",
      );
    }

    await captureServer("email_consent_granted", result.userId ?? SYSTEM_DISTINCT_ID, {
      source: result.source,
      double_opt_in: true,
    });
    return { email: result.email };
  });

/**
 * Email a preferences link to an address.
 *
 * The `/email/preferencias` page cannot simply accept a typed address and act
 * on it — that would let anyone unsubscribe anyone. Instead it mails a token to
 * the address in question, so only whoever reads that mailbox can change it.
 *
 * Responds identically for known and unknown addresses, for the same
 * enumeration reason as `subscribeToNewsletter`.
 */
export const requestEmailPreferencesLink = action
  .schema(z.object({ email: z.string().trim().email().max(254) }))
  .action(async ({ parsedInput: { email } }) => {
    const normalized = normalizeEmail(email);
    const token = await mintPreferencesToken(normalized);
    if (token) await sendPreferencesEmail(normalized, token);
    return { ok: true as const };
  });

/**
 * Token-authenticated preferences change, for the link mailed above. Works
 * without a session — most people reading a newsletter are not logged in, and
 * forcing a login to unsubscribe earns spam complaints.
 */
export const updateEmailPreferencesByToken = action
  .schema(
    z.object({
      token: z.string().min(10).max(200),
      subscribed: z.boolean(),
    }),
  )
  .action(async ({ parsedInput: { token, subscribed } }) => {
    const consent = await getConsentByValidToken(token);
    if (!consent) throw new ActionError("El enlace no es valido o ya vencio.");

    if (subscribed) {
      await resumeConsent(consent.email);
    } else {
      await withdrawConsent(consent.email);
      await captureServer("email_consent_revoked", consent.user_id ?? SYSTEM_DISTINCT_ID, {
        source: "preferences",
      });
    }

    return { status: subscribed ? ("confirmed" as const) : ("unsubscribed" as const) };
  });
