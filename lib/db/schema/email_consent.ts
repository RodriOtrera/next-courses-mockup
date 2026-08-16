import { InferSelectModel, relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { users } from "./auth_schema";

/**
 * Marketing-email consent, and the audit log of every broadcast sent.
 *
 * Before this table the platform had no notion of consent at all: the bulk
 * mailer read every address out of `user` and sent to all of them. Marketing
 * mail now flows through `email_consent` only, and nothing may bypass it.
 *
 * Keyed by **email, not user id**, for two reasons:
 *   1. `user` is BetterAuth-managed — new columns there mean `additionalFields`
 *      plus a regenerated `auth_schema.ts` on every `npm run auth:schema`.
 *   2. The footer newsletter form accepts people who have no account, so a
 *      user-id-keyed row could not represent them. `user_id` is the optional
 *      back-reference, filled in when the subscriber is also a learner.
 */

export const emailConsentStatusValues = ["pending", "confirmed", "unsubscribed"] as const;
export type EmailConsentStatus = (typeof emailConsentStatusValues)[number];

/**
 * Where the opt-in came from. This is consent evidence, not decoration — if a
 * recipient ever disputes, `source` plus `consent_ip`/`consent_user_agent`
 * plus `confirmed_at` is the record that answers it.
 *
 * `signup` and `account` are collected from an authenticated session whose
 * mailbox BetterAuth's email-OTP flow already proved, so they land on
 * `confirmed` directly. `footer` and `reconsent` have no such proof and must
 * pass through `pending` and a confirmation link.
 */
export const emailConsentSourceValues = ["signup", "account", "footer", "reconsent"] as const;
export type EmailConsentSource = (typeof emailConsentSourceValues)[number];

/** How long a confirmation link stays valid. Generous: the re-consent campaign
 * mails a whole user base at once and people read mail on their own schedule. */
export const CONSENT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const email_consent = sqliteTable(
    "email_consent",
    {
        id: text("id").primaryKey(),
        /** Always stored lowercased — see `normalizeEmail` in the consent actions. */
        email: text("email").notNull(),
        /**
         * `set null` rather than `cascade`: deleting an account must not silently
         * erase the proof that this address once asked to be mailed, and the
         * address may still be a legitimate newsletter subscriber.
         */
        user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),
        status: text("status", { enum: emailConsentStatusValues })
            .notNull()
            .default("pending")
            .$type<EmailConsentStatus>(),
        source: text("source", { enum: emailConsentSourceValues }).notNull().$type<EmailConsentSource>(),
        /**
         * SHA-256 of the confirmation token, never the token itself. A leaked
         * database backup must not hand out working confirm links, and since we
         * look rows up *by* this hash it doubles as the index key.
         */
        token_hash: text("token_hash"),
        token_expires_at: integer("token_expires_at", { mode: 'timestamp' }),
        confirmed_at: integer("confirmed_at", { mode: 'timestamp' }),
        unsubscribed_at: integer("unsubscribed_at", { mode: 'timestamp' }),
        /** Consent audit trail. Null for server-initiated rows (the re-consent run). */
        consent_ip: text("consent_ip"),
        consent_user_agent: text("consent_user_agent"),
        /** Mirror of the Resend contact. Null until the mirror succeeds; the sync
         * cron backfills it, so a Resend outage never blocks a user's opt-in. */
        resend_contact_id: text("resend_contact_id"),
        created_at: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
        updated_at: integer("updated_at", { mode: 'timestamp' })
            .default(sql`(unixepoch())`)
            .$onUpdate(() => new Date()),
    },
    (t) => ({
        /**
         * One row per address, and the only concurrency primitive available: the
         * libSQL remote client has no interactive transactions, so every write
         * here is an `.onConflictDoUpdate()` against this index. Two simultaneous
         * opt-ins for the same address converge instead of duplicating.
         */
        emailUnique: uniqueIndex("email_consent_email_idx").on(t.email),
        byUser: index("email_consent_user_idx").on(t.user_id),
        byStatus: index("email_consent_status_idx").on(t.status),
        byToken: index("email_consent_token_idx").on(t.token_hash),
    }),
);

/** Cohorts an admin can target. Preserved verbatim from the mailer this replaces
 * so existing operator habits still work. */
export const broadcastCohortValues = [
    "allUsers",
    "usersWithCourses",
    "usersWithEbookProgram",
    "usersWithCoaching",
    "test",
] as const;
export type BroadcastCohort = (typeof broadcastCohortValues)[number];

export const broadcastStatusValues = ["draft", "sending", "sent", "failed"] as const;
export type BroadcastStatus = (typeof broadcastStatusValues)[number];

/**
 * One row per broadcast an admin composes.
 *
 * Written *before* the send is dispatched, so a crash between Resend's create
 * and send calls leaves an auditable draft rather than an untracked blast. It
 * is also the only place the exact HTML that went out is retained — Resend's
 * dashboard shows the render, but not who on this side pressed the button.
 */
export const email_broadcast = sqliteTable(
    "email_broadcast",
    {
        id: text("id").primaryKey(),
        resend_broadcast_id: text("resend_broadcast_id"),
        cohort: text("cohort", { enum: broadcastCohortValues }).notNull().$type<BroadcastCohort>(),
        subject: text("subject").notNull(),
        preview_text: text("preview_text"),
        html: text("html").notNull(),
        /** Snapshot at send time. Cohorts drift, so recomputing it later would not
         * reproduce who actually received this. */
        recipient_count: integer("recipient_count").notNull().default(0),
        status: text("status", { enum: broadcastStatusValues })
            .notNull()
            .default("draft")
            .$type<BroadcastStatus>(),
        scheduled_at: integer("scheduled_at", { mode: 'timestamp' }),
        sent_at: integer("sent_at", { mode: 'timestamp' }),
        /** `user.id` of the admin who pressed send. */
        created_by: text("created_by").notNull(),
        error_message: text("error_message"),
        created_at: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
        updated_at: integer("updated_at", { mode: 'timestamp' })
            .default(sql`(unixepoch())`)
            .$onUpdate(() => new Date()),
    },
    (t) => ({
        byStatus: index("email_broadcast_status_idx").on(t.status),
        byCreatedAt: index("email_broadcast_created_at_idx").on(t.created_at),
    }),
);

export const email_consent_relations = relations(email_consent, ({ one }) => ({
    user: one(users, {
        fields: [email_consent.user_id],
        references: [users.id],
    }),
}));

export const email_consent_insert_schema = createInsertSchema(email_consent);
export const email_consent_select_schema = createSelectSchema(email_consent);
export const email_broadcast_insert_schema = createInsertSchema(email_broadcast);

export const broadcastCohortSchema = z.enum(broadcastCohortValues);

export type EmailConsent = InferSelectModel<typeof email_consent>;
export type EmailBroadcast = InferSelectModel<typeof email_broadcast>;
