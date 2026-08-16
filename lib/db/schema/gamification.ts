import { InferSelectModel, relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from 'zod';
import { users } from "./auth_schema";
import { courses } from "./course";

/**
 * Singleton config row holding what each achievement is worth. Same shape as
 * `card`/`meeting`: one row, fixed id, edited from the dashboard.
 *
 * The level *curve* deliberately lives in code (`lib/gamification/levels.ts`),
 * not here — tuning these three numbers already shifts the whole progression,
 * and a configurable curve on top of configurable rewards makes the outcome
 * impossible to reason about.
 */
export const XP_CONFIG_ID = "default";

/**
 * Used both as the column defaults and as the read-side fallback when the
 * singleton row hasn't been seeded yet, so the two can't drift apart.
 */
export const DEFAULT_XP_CONFIG = {
    lesson_xp: 10,
    module_xp: 50,
    course_xp: 200,
} as const;

export const xp_config = sqliteTable("xp_config", {
    id: text('id').default(XP_CONFIG_ID).primaryKey(),
    lesson_xp: integer('lesson_xp').default(DEFAULT_XP_CONFIG.lesson_xp).notNull(),
    module_xp: integer('module_xp').default(DEFAULT_XP_CONFIG.module_xp).notNull(),
    course_xp: integer('course_xp').default(DEFAULT_XP_CONFIG.course_xp).notNull(),
    updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

export const xpSourceValues = ['lesson', 'module', 'course'] as const;
const xpSource = z.enum(xpSourceValues);
export type XpSource = z.infer<typeof xpSource>;

/**
 * Append-only record of every XP award. Never updated, never deleted.
 *
 * This table does double duty: it is the idempotency mechanism *and* the
 * per-lesson completion record the platform otherwise lacks — `course_progress`
 * only stores a cursor plus a percentage, so it can't answer "has this learner
 * already been paid for this lesson?".
 *
 * `uniqueAward` is what makes the whole design safe. Awards are written with
 * `.onConflictDoNothing()`, so a re-opened lesson, a double-fired effect, or a
 * retried request can never pay twice. That matters more than usual here: the
 * libSQL remote client has no interactive transactions, so a unique index is
 * the only concurrency primitive available.
 */
export const xp_ledger = sqliteTable("xp_ledger", {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    course_id: text('course_id').notNull(),
    source: text('source', { enum: xpSourceValues }).notNull().$type<XpSource>(),
    /** `modules_items.id` | `modules.id` | `courses.id`, depending on `source`. */
    source_id: text('source_id').notNull(),
    /**
     * Snapshot of `xp_config` at the moment of the award. Totals are summed from
     * this column, so raising a reward later never retroactively inflates the
     * learners who earned it under the old value.
     */
    amount: integer('amount').notNull(),
    created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
    award: uniqueIndex('xp_ledger_award_idx').on(t.user_id, t.source, t.source_id),
    byUser: index('xp_ledger_user_idx').on(t.user_id),
    byUserCourse: index('xp_ledger_user_course_idx').on(t.user_id, t.course_id),
}))

export const xp_ledger_relations = relations(xp_ledger, ({ one }) => ({
    user: one(users, {
        fields: [xp_ledger.user_id],
        references: [users.id]
    }),
    course: one(courses, {
        fields: [xp_ledger.course_id],
        references: [courses.id]
    }),
}))

export const xp_config_insert_schema = createInsertSchema(xp_config);
export const xp_ledger_insert_schema = createInsertSchema(xp_ledger);
export const xp_ledger_select_schema = createSelectSchema(xp_ledger);

export type XpConfig = InferSelectModel<typeof xp_config>;
export type XpLedgerEntry = InferSelectModel<typeof xp_ledger>;
