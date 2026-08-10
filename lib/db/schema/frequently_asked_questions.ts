import { relations } from "drizzle-orm";
import { courses } from "./course";
import z from 'zod';
import { createSelectSchema } from "drizzle-zod";
import { pgTable, text } from "drizzle-orm/pg-core";

export const frequentlyAskedQuestions = pgTable('frequently_asked_questions', {
    id: text('id').primaryKey().notNull(),
    question: text("question").notNull(),
    response: text('response').notNull(),
    course_id: text('course_id').notNull()
})


export const frequently_asked_questions_relations = relations(frequentlyAskedQuestions, ({ one }) => ({
    course: one(courses, {
        fields: [frequentlyAskedQuestions.course_id],
        references: [courses.id]
    })
}))


const zod = createSelectSchema(frequentlyAskedQuestions);

export type FrequentlyAskedQuestion = z.infer<typeof zod>