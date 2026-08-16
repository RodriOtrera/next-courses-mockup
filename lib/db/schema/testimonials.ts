import { relations } from "drizzle-orm";
import { courses } from "./course";
import { createSelectSchema } from "drizzle-zod";
import z from 'zod';
import { users } from "./auth_schema";
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const testimonials = sqliteTable('testimonials', {
    id: text('id').primaryKey(),
    rating: real('rating').notNull(),
    course_id: text('course_id').notNull(),
    user_id: text('user_id').notNull(),
    content: text("content").default("").notNull()
})

export const testimonials_relation = relations(testimonials, ({ one }) => ({
    user: one(users, {
        fields: [testimonials.user_id],
        references: [users.id]
    }),
    course: one(courses, {
        fields: [testimonials.course_id],
        references: [courses.id]
    })
}))

const selectTestimonial = createSelectSchema(testimonials);
export type TestimonialSelect = z.infer<typeof selectTestimonial>
