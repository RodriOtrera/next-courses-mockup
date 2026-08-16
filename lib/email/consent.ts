import { createHash, randomBytes, randomUUID } from "node:crypto";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth_schema";
import {
  CONSENT_TOKEN_TTL_MS,
  email_consent,
  type EmailConsent,
  type EmailConsentSource,
} from "@/lib/db/schema/email_consent";
import { absoluteUrl } from "@/lib/seo/site";
import { getResend, resendFrom, resendReplyTo, unwrap, unwrapSoft } from "./resend";
import { ensureSegment } from "./segments";
import {
  confirmConsentSubject,
  preferencesLinkSubject,
  renderConfirmConsentHtml,
  renderConfirmConsentText,
  renderPreferencesLinkHtml,
  renderPreferencesLinkText,
} from "./templates/confirm_consent";

/**
 * Consent state machine and the Resend contact mirror.
 *
 * The database is the source of truth; Resend is a mirror. That ordering matters:
 * a Resend outage must never lose someone's opt-in or, worse, fail to record
 * their opt-*out*. Every mirror call is therefore best-effort
 * (`unwrapSoft`) and the sync cron repairs whatever drifted.
 *
 * No `server-only` here: `scripts/send-reconsent.ts` runs this under plain node.
 */

/** Addresses are compared and stored lowercased so `A@b.com` and `a@b.com` are
 * one subscriber, which is what the unique index assumes. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Tokens are stored hashed. A leaked backup must not yield working links. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mintToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + CONSENT_TOKEN_TTL_MS),
  };
}

export const CONSENT_TOKEN_TTL_DAYS = Math.round(CONSENT_TOKEN_TTL_MS / 86_400_000);

export function confirmUrlFor(token: string): string {
  return `${absoluteUrl("/email/confirmar")}?token=${encodeURIComponent(token)}`;
}

export function preferencesUrlFor(token: string): string {
  return `${absoluteUrl("/email/preferencias")}?token=${encodeURIComponent(token)}`;
}

export async function getConsentByEmail(email: string): Promise<EmailConsent | undefined> {
  return db.query.email_consent.findFirst({
    where: eq(email_consent.email, normalizeEmail(email)),
  });
}

export async function getConsentByToken(token: string): Promise<EmailConsent | undefined> {
  return db.query.email_consent.findFirst({
    where: eq(email_consent.token_hash, hashToken(token)),
  });
}

/** As above, but rejects a token whose expiry has passed. */
export async function getConsentByValidToken(token: string): Promise<EmailConsent | undefined> {
  const row = await getConsentByToken(token);
  if (!row) return undefined;
  if (row.token_expires_at && row.token_expires_at.getTime() < Date.now()) return undefined;
  return row;
}

/**
 * Issue a "manage your preferences" link for an existing subscriber.
 *
 * Shares the single `token_hash` column with the confirmation flow — one row
 * has at most one outstanding link, whatever its purpose, and minting a new one
 * invalidates the old. Crucially this does **not** touch `status`: someone
 * asking to review their preferences has not withdrawn anything.
 *
 * Returns `null` when the address is unknown, so callers can stay silent rather
 * than confirming who is on the list.
 */
export async function mintPreferencesToken(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const existing = await getConsentByEmail(normalized);
  if (!existing) return null;

  const { token, tokenHash, expiresAt } = mintToken();
  await db
    .update(email_consent)
    .set({ token_hash: tokenHash, token_expires_at: expiresAt, updated_at: new Date() })
    .where(eq(email_consent.id, existing.id));

  return token;
}

export interface ConsentInput {
  email: string;
  userId?: string | null;
  source: EmailConsentSource;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Record an unverified opt-in and return the raw confirmation token.
 *
 * Used where the address is unproven — the public footer form and the
 * re-consent campaign. The caller emails the token; we only ever keep its hash.
 *
 * Re-requesting is safe and mints a fresh token, but an **already-confirmed**
 * subscriber is left alone: downgrading them to `pending` would silently drop
 * them from the next broadcast, which is the opposite of what asking again
 * should do.
 */
export type RequestConsentResult =
  | { status: "sent"; token: string }
  | { status: "already_confirmed" }
  | { status: "throttled" };

/** Minimum gap between confirmation emails to the same address. Without it the
 * public footer form is a button for mailbombing a stranger. */
const RESEND_CONFIRMATION_COOLDOWN_MS = 60_000;

export async function requestConsent(input: ConsentInput): Promise<RequestConsentResult> {
  const email = normalizeEmail(input.email);
  const existing = await getConsentByEmail(email);

  if (existing?.status === "confirmed") {
    return { status: "already_confirmed" };
  }

  if (
    existing?.status === "pending" &&
    existing.token_hash &&
    existing.updated_at &&
    Date.now() - existing.updated_at.getTime() < RESEND_CONFIRMATION_COOLDOWN_MS
  ) {
    return { status: "throttled" };
  }

  const { token, tokenHash, expiresAt } = mintToken();

  await db
    .insert(email_consent)
    .values({
      id: randomUUID(),
      email,
      user_id: input.userId ?? null,
      status: "pending",
      source: input.source,
      token_hash: tokenHash,
      token_expires_at: expiresAt,
      consent_ip: input.ip ?? null,
      consent_user_agent: input.userAgent ?? null,
    })
    // The unique index on `email` is the only concurrency primitive available
    // (the libSQL remote client has no interactive transactions), so
    // simultaneous submissions converge on one row instead of duplicating it.
    .onConflictDoUpdate({
      target: email_consent.email,
      set: {
        status: "pending",
        source: input.source,
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        consent_ip: input.ip ?? null,
        consent_user_agent: input.userAgent ?? null,
        // Never overwrite a known user id with null: the re-consent run knows
        // the account, the footer form does not.
        user_id: sql`coalesce(${input.userId ?? null}, ${email_consent.user_id})`,
        updated_at: new Date(),
      },
    });

  return { status: "sent", token };
}

/**
 * Record a verified opt-in directly, skipping the confirmation email.
 *
 * Only for authenticated surfaces (signup, account page). BetterAuth's email-OTP
 * flow already made the user type a code delivered to that mailbox, so mailbox
 * ownership is proven; the checkbox supplies the consent half. Sending a second
 * "confirm your email" message on top of that would be noise, not diligence.
 */
export async function grantConsent(input: ConsentInput): Promise<void> {
  const email = normalizeEmail(input.email);
  const now = new Date();

  await db
    .insert(email_consent)
    .values({
      id: randomUUID(),
      email,
      user_id: input.userId ?? null,
      status: "confirmed",
      source: input.source,
      confirmed_at: now,
      consent_ip: input.ip ?? null,
      consent_user_agent: input.userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: email_consent.email,
      set: {
        status: "confirmed",
        source: input.source,
        confirmed_at: now,
        unsubscribed_at: null,
        // Any outstanding confirmation link is now moot — burn it.
        token_hash: null,
        token_expires_at: null,
        consent_ip: input.ip ?? null,
        consent_user_agent: input.userAgent ?? null,
        user_id: sql`coalesce(${input.userId ?? null}, ${email_consent.user_id})`,
        updated_at: now,
      },
    });

  await mirrorContact(email, input.userId ?? null);
}

export type ConfirmResult =
  | { ok: true; email: string; userId: string | null; source: EmailConsentSource }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Redeem a confirmation token.
 *
 * Single-use: the token hash is cleared on success, so a link forwarded to
 * someone else, or replayed from a mail archive, does nothing. An expired token
 * is reported distinctly so the page can offer to send a fresh one.
 */
export async function confirmConsent(token: string): Promise<ConfirmResult> {
  const row = await getConsentByToken(token);
  if (!row) return { ok: false, reason: "invalid" };

  if (row.token_expires_at && row.token_expires_at.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const now = new Date();
  await db
    .update(email_consent)
    .set({
      status: "confirmed",
      confirmed_at: now,
      unsubscribed_at: null,
      token_hash: null,
      token_expires_at: null,
      updated_at: now,
    })
    .where(eq(email_consent.id, row.id));

  await mirrorContact(row.email, row.user_id);
  return { ok: true, email: row.email, userId: row.user_id, source: row.source };
}

/**
 * Withdraw consent.
 *
 * Local state flips first and unconditionally. If the Resend update then fails
 * the contact is still excluded from every future send, because cohorts are
 * computed from the database and `reconcileSegment` removes them on the next run.
 */
export async function withdrawConsent(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const now = new Date();

  await db
    .update(email_consent)
    .set({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
    .where(eq(email_consent.email, normalized));

  await unwrapSoft(
    getResend().contacts.update({ email: normalized, unsubscribed: true }),
    `contacts.update(${normalized})`,
  );
}

/**
 * Re-subscribe from the preferences page. Requires a row that already exists —
 * this is for someone reversing their own unsubscribe, not a new opt-in.
 */
export async function resumeConsent(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const now = new Date();

  await db
    .update(email_consent)
    .set({ status: "confirmed", confirmed_at: now, unsubscribed_at: null, updated_at: now })
    .where(eq(email_consent.email, normalized));

  await unwrapSoft(
    getResend().contacts.update({ email: normalized, unsubscribed: false }),
    `contacts.update(${normalized})`,
  );
}

/**
 * Reflect a webhook-reported state change from Resend into the database.
 *
 * The inbound direction of the mirror: someone clicked Resend's hosted
 * unsubscribe link, or bounced, or hit "report spam". Returns whether a row
 * actually changed, so the route can log something meaningful.
 */
export async function syncConsentFromResend(
  email: string,
  unsubscribed: boolean,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const existing = await getConsentByEmail(normalized);
  if (!existing) return false;

  const target = unsubscribed ? "unsubscribed" : "confirmed";
  if (existing.status === target) return false;

  // Only ever resurrect a subscriber that Resend says is subscribed *and* that
  // we had confirmed before. A `pending` row must still pass the confirmation
  // link — otherwise a contact created by hand in the Resend dashboard would
  // manufacture consent that nobody gave.
  if (!unsubscribed && existing.status === "pending") return false;

  const now = new Date();
  await db
    .update(email_consent)
    .set({
      status: target,
      unsubscribed_at: unsubscribed ? now : null,
      confirmed_at: unsubscribed ? existing.confirmed_at : now,
      updated_at: now,
    })
    .where(eq(email_consent.id, existing.id));

  return true;
}

/**
 * Create or update the Resend contact for a confirmed subscriber and remember
 * its id.
 *
 * Best-effort by design — see the module header. `contacts.create` is
 * idempotent on email, so re-running it for an existing contact is harmless.
 */
export async function mirrorContact(email: string, userId: string | null): Promise<void> {
  const normalized = normalizeEmail(email);

  // The base segment is a nicety, not a requirement: `reconcileSegment` will
  // place the contact correctly on its next run either way, so a failure here
  // must not stop the contact itself from being created.
  let segmentId: string | null = null;
  try {
    segmentId = await ensureSegment("allUsers");
  } catch (err) {
    console.error("[resend] ensureSegment(allUsers):", err);
  }

  const firstName = userId ? await firstNameForUser(userId) : null;

  const contact = await unwrapSoft(
    getResend().contacts.create({
      email: normalized,
      unsubscribed: false,
      ...(firstName ? { firstName } : {}),
      ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
    }),
    `contacts.create(${normalized})`,
  );

  if (contact?.id) {
    await db
      .update(email_consent)
      .set({ resend_contact_id: contact.id, updated_at: new Date() })
      .where(eq(email_consent.email, normalized));
  }
}

async function firstNameForUser(userId: string): Promise<string | null> {
  const row = await db.query.users.findFirst({
    where: (users, { eq: equals }) => equals(users.id, userId),
    columns: { name: true },
  });
  const first = row?.name?.trim().split(/\s+/)[0];
  return first || null;
}

/** Send the double opt-in email. Transactional: it must reach non-contacts. */
export async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const content = {
    confirmUrl: confirmUrlFor(token),
    expiresInDays: CONSENT_TOKEN_TTL_DAYS,
  };
  const replyTo = resendReplyTo();

  await unwrap(
    getResend().emails.send({
      from: resendFrom(),
      to: email,
      subject: confirmConsentSubject(),
      html: renderConfirmConsentHtml(content),
      text: renderConfirmConsentText(content),
      ...(replyTo ? { replyTo } : {}),
    }),
    `emails.send(confirm ${email})`,
  );
}

/** Send the "manage your preferences" link. Transactional. */
export async function sendPreferencesEmail(email: string, token: string): Promise<void> {
  const content = {
    manageUrl: preferencesUrlFor(token),
    expiresInDays: CONSENT_TOKEN_TTL_DAYS,
  };
  const replyTo = resendReplyTo();

  await unwrap(
    getResend().emails.send({
      from: resendFrom(),
      to: email,
      subject: preferencesLinkSubject(),
      html: renderPreferencesLinkHtml(content),
      text: renderPreferencesLinkText(content),
      ...(replyTo ? { replyTo } : {}),
    }),
    `emails.send(preferences ${email})`,
  );
}

/**
 * Users who have never been asked — the re-consent campaign's target list.
 *
 * A LEFT JOIN with `IS NULL` rather than `NOT IN (subquery)`: it uses the index
 * on `email_consent.email` and does not degrade as the consent table fills up.
 */
export async function usersWithoutConsent(): Promise<{ id: string; email: string; name: string | null }[]> {
  return db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    // `lower()` on the join key because `user.email` preserves whatever case the
    // learner typed, while consent rows are always stored normalised.
    // SQLite's `lower()` is ASCII-only — unlike Postgres's, it does not fold
    // non-ASCII uppercase. Addresses are ASCII in practice, so this holds.
    .leftJoin(email_consent, eq(email_consent.email, sql`lower(${users.email})`))
    .where(isNull(email_consent.id));
}
