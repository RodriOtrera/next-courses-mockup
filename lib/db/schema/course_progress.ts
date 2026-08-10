import { relations } from "drizzle-orm";
import { courses } from "./course";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from 'zod';
import { users } from "./auth_schema";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const course_progress = pgTable("course_progress", {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    course_id: text('course_id').notNull(),
    module_id: text('module_id').notNull(),
    module_number: integer('module_number').default(0).notNull(),
    isFinished: boolean('isFinished').notNull().default(false),
    current_progress: integer('current_progress'),
    // This row is overwritten in place on every lesson advance, so it holds no
    // history. These two at least bound it: when the learner started the course
    // and when they last moved. Anything longitudinal comes from the event
    // stream, not from here.
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
})

export const course_progress_relations = relations(course_progress, ({ one }) => ({
    user: one(users, {
        fields: [course_progress.user_id],
        references: [users.id]
    }),
    course: one(courses, {
        fields: [course_progress.course_id],
        references: [courses.id]
    })
}))


const course_progress_insert = createSelectSchema(course_progress);
const course_progress_select = createInsertSchema(course_progress)

export type CourseModuleInfo = {
    id: string;
    title: string;
    itemCount: number;
    isCurrent: boolean;
    isCompleted: boolean;
};

export type CourseProgressSelect = z.infer<typeof course_progress_select> & { rating: number, courseTitle: string, moduleTitle: string, exam_id: string | null, certification_id: string | null, courseImgUrl: string | null, courseDuracion: string, totalModules: number, currentModuleIndex: number, moduleBreakdown: CourseModuleInfo[] };