import { relations, sql } from "drizzle-orm";
import { courses } from "./course";
import { createInsertSchema } from "drizzle-zod";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth_schema";

export const certifications = sqliteTable("certifications", {
    id: text('id').primaryKey(),
    created_at:  integer("createdAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),
    user_id: text("user_id").notNull(),
    course_id: text('course_id').notNull()
})

export const certifications_relation = relations(certifications, ({ one }) => ({
    course: one(courses, {
        fields: [certifications.course_id],
        references: [courses.id]
    }),
    user: one(users, {
        fields: [certifications.user_id],
        references: [users.id]
    }),

}))

export const certificationInsertZod = createInsertSchema(certifications)