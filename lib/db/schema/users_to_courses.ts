
import { relations } from "drizzle-orm";
import { users } from "./auth_schema";
import { courses } from "./course";
import { primaryKey, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersToCourses = pgTable('usersToCourses', {
    user_id: text('user_id').notNull(),
    course_id: text('course_id').notNull(),
    // Without this there is no way to know when anyone enrolled, which makes
    // time-to-activation and cohort retention unanswerable. Rows that existed
    // before this column was added are backfilled to the migration timestamp,
    // so treat any enrollment dated at/near that moment as unknown, not real.
    created_at: timestamp('created_at').defaultNow()
}, (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.course_id] })
}))

export const usersToCourses_relations = relations(usersToCourses, ({ one }) => ({
    user: one(users, {
        fields: [usersToCourses.user_id],
        references: [users.id]
    }),
    course: one(courses, {
        fields: [usersToCourses.course_id],
        references: [courses.id]
    })
}))