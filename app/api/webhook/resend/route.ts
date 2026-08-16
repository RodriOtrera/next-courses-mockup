import { NextRequest, NextResponse } from "next/server";
import type { WebhookEventPayload } from "resend";
import { getResend } from "@/lib/email/resend";
import { syncConsentFromResend, withdrawConsent } from "@/lib/email/consent";
import { captureServer, SYSTEM_DISTINCT_ID } from "@/lib/analytics/server";

/**
 * Inbound half of the consent mirror.
 *
 * Unsubscribes do not all originate here. Most happen at Resend: a recipient
 * clicks the `{{{RESEND_UNSUBSCRIBE_URL}}}` link in a broadcast footer, or their
 * provider fires a one-click unsubscribe, and Resend flips the contact without
 * ever touching this app. Without this route those people stay `confirmed` in
 * the database and get mailed again on the next send — which is both the legal
 * problem and the fastest route to a spam-folder reputation.
 *
 * Bounces and complaints are handled for the same reason: continuing to mail a
 * dead address, or someone who pressed "report spam", damages deliverability
 * for everyone else on the list.
 *
 * Register at https://resend.com/webhooks pointing to `/api/webhook/resend`,
 * subscribed to `contact.updated`, `contact.deleted`, `email.bounced` and
 * `email.complained`, then put the signing secret in `RESEND_WEBHOOK_SECRET`.
 */

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed. An unverified endpoint that mutates consent is worse than a
    // missing one: anyone could POST an unsubscribe for any address.
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set; rejecting");
    return NextResponse.json({ message: "Webhook not configured" }, { status: 503 });
  }

  // Must be the raw body — the signature covers the exact bytes, so parsing and
  // re-serialising would invalidate it.
  const payload = await req.text();

  // Resend signs with Svix, and the SDK wants the three headers destructured
  // rather than the whole `Headers` object.
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ message: "Missing signature headers" }, { status: 401 });
  }

  let event: WebhookEventPayload;
  try {
    event = getResend().webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
  } catch (err) {
    // Attributed to the system rather than to any address in the payload — that
    // claim is precisely what just failed verification.
    await captureServer("webhook_signature_invalid", SYSTEM_DISTINCT_ID, { rail: "resend" });
    console.error("[resend-webhook] signature verification failed:", err);
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "contact.updated": {
        const changed = await syncConsentFromResend(event.data.email, event.data.unsubscribed);
        if (changed) {
          await captureServer("email_contact_synced", SYSTEM_DISTINCT_ID, {
            reason: event.data.unsubscribed ? "unsubscribed" : "resubscribed",
          });
        }
        break;
      }

      case "contact.deleted": {
        // A contact removed in the Resend dashboard is an unsubscribe as far as
        // this app is concerned: we no longer have anywhere to mail them.
        await withdrawConsent(event.data.email);
        await captureServer("email_contact_synced", SYSTEM_DISTINCT_ID, { reason: "deleted" });
        break;
      }

      case "email.bounced": {
        // Only hard bounces. A transient failure (full mailbox, greylisting)
        // must not cost someone their subscription.
        const recipient = event.data.to?.[0];
        if (recipient && event.data.bounce?.type?.toLowerCase() === "permanent") {
          await withdrawConsent(recipient);
          await captureServer("email_contact_synced", SYSTEM_DISTINCT_ID, { reason: "bounced" });
        }
        break;
      }

      case "email.complained": {
        // Someone pressed "report spam". Honour it immediately and permanently.
        const recipient = event.data.to?.[0];
        if (recipient) {
          await withdrawConsent(recipient);
          await captureServer("email_contact_synced", SYSTEM_DISTINCT_ID, {
            reason: "complained",
          });
        }
        break;
      }

      default:
        // Acknowledge everything else so Resend stops retrying it.
        break;
    }
  } catch (err) {
    console.error("[resend-webhook] processing error:", err);
    // 500 asks Resend to retry, which is safe: every handler above converges on
    // the same state rather than accumulating an effect.
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// POST only. `app/api/webhook/route.ts` exports its handler as GET as well,
// which puts a state-changing endpoint behind a link a crawler can follow.
export { handler as POST };
