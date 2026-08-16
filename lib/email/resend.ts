import { Resend } from "resend";
import { SITE } from "@/lib/seo/site";

/**
 * The one Resend client for the whole app — transactional mail, marketing
 * broadcasts, contacts and webhook verification all go through here.
 *
 * Instantiated lazily behind the same shape as `lib/db/index.ts`: reading the
 * key at module scope would throw during `next build`, which imports every
 * module without any runtime env available.
 *
 * Deliberately not `server-only`: `scripts/send-reconsent.ts` runs this under
 * plain node, outside the Next module graph. Every *app* consumer is a server
 * action, route handler or server component, so the key never reaches a client
 * bundle regardless.
 */

let _resend: Resend | undefined;

export function getResend(): Resend {
  if (!_resend) {
    /**
     * `AUTH_RESEND_KEY` is the fallback because that is what `.env` actually
     * sets and what the auth OTP flow has always read, while
     * `.env.local.example` and `docs/api.md` both document `RESEND_API_KEY`.
     * Accepting both ends a mismatch that made anyone following the example
     * file hit a runtime throw on their first sign-in.
     */
    const key = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY is not set. Add it to .env (see .env.local.example). " +
          "The legacy name AUTH_RESEND_KEY is still accepted.",
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

/** Sender address. Must be on a domain verified in the Resend dashboard. */
export function resendFrom(): string {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error(
      'RESEND_FROM is not set. Use a verified domain, e.g. "Academia <hola@tudominio.com>".',
    );
  }
  // A bare address gets the site name attached so inboxes show a brand, not a mailbox.
  return from.includes("<") ? from : `${SITE.name} <${from}>`;
}

/** Optional; when unset Resend replies go to the `from` address. */
export function resendReplyTo(): string | undefined {
  return process.env.RESEND_REPLY_TO?.trim() || undefined;
}

/**
 * Every Resend SDK method resolves to `{ data, error }` and **never rejects**.
 * A plain `await resend.broadcasts.create(...)` therefore looks like it worked
 * even when nothing was sent. Routing all calls through this makes ignoring an
 * error impossible by construction.
 */
export async function unwrap<T>(
  call: Promise<{ data: T | null; error: { message: string; name?: string } | null }>,
  context: string,
): Promise<T> {
  const { data, error } = await call;
  if (error) throw new Error(`Resend ${context} failed: ${error.message}`);
  if (data === null) throw new Error(`Resend ${context} returned no data`);
  return data;
}

/**
 * Same contract as `unwrap`, but yields `null` instead of throwing.
 *
 * For the contact mirror: local consent in our database is the source of truth, and
 * a Resend hiccup must not fail a user's opt-in request. The sync cron
 * reconciles whatever drifted.
 */
export async function unwrapSoft<T>(
  call: Promise<{ data: T | null; error: { message: string; name?: string } | null }>,
  context: string,
): Promise<T | null> {
  try {
    const { data, error } = await call;
    if (error) {
      console.error(`[resend] ${context}: ${error.message}`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[resend] ${context}:`, err);
    return null;
  }
}
