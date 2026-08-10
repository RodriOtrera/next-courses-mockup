import { relations } from "drizzle-orm";
import { courses } from "./course";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from 'zod';
import { pgTable, text } from "drizzle-orm/pg-core";

export const instructors = pgTable('instructors', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    instagram: text('instagram').notNull(),
    qualities: text('qualities').notNull(),
    img_url: text('img_url').notNull(),
    course_id: text('course_id').notNull()

})

export const instructors_relations = relations(instructors, ({ one }) => ({
    course: one(courses, {
        fields: [instructors.course_id],
        references: [courses.id]
    })
}))
const instructor_create = createInsertSchema(instructors);

const instructor_selector = createSelectSchema(instructors);
export type Instructor = z.infer<typeof instructor_selector>
export type InstructorCreate = z.infer<typeof instructor_create>