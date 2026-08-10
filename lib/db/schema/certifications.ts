import { relations, sql } from "drizzle-orm";
import { courses } from "./course";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { users } from "./auth_schema";

export const certifications = pgTable("certifications", {
    id: text('id').primaryKey(),
    created_at:  timestamp("createdAt").defaultNow(),
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