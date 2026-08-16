import { relations, sql } from "drizzle-orm";
import { courses } from "./course";

import z from 'zod';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const exams = sqliteTable("exams", {
    id: text('id').primaryKey(),
    course_id: text('course_id').notNull(),
    last_time_done: text('last_time_done'),

})



export const questionary = sqliteTable("questionary", {
    id: text('id').primaryKey(),
    module_item_id: text("module_item_id").notNull()
})

export const questionary_relations = relations(questionary, ({ one, many }) => ({

    questions: many(questions)

}))




export const exams_relations = relations(exams, ({ one, many }) => ({
    course: one(courses, {
        fields: [exams.course_id],
        references: [courses.id]
    }),

    questions: many(questions)
}))


export const questions = sqliteTable("questions", {
    id: text('id').primaryKey(),
    exam_id: text('exam_id'),
    title: text('title').notNull(),
    questionary_id: text("questionary_id"),


})

export const questions_relations = relations(questions, ({ one, many }) => ({
    exam: one(exams, {
        fields: [questions.exam_id],
        references: [exams.id]
    }),
    questionary: one(questionary, {
        fields: [questions.questionary_id],
        references: [questionary.id]
    }),
    options: many(options),


}))


export const options = sqliteTable("options", {
    id: text('id').primaryKey(),
    question_id: text('question_id').notNull(),
    title: text('title').notNull(),
    isCorrect: integer('isCorrect', { mode: 'boolean' }).default(false).notNull()
})

export const options_relations = relations(options, ({ one }) => ({
    question: one(questions, {
        fields: [options.question_id],
        references: [questions.id]
    })
}))

const questionaryInsert = createInsertSchema(questionary);