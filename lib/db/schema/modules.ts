import { relations, sql } from "drizzle-orm";
import { courses } from "./course";
import { createSelectSchema } from "drizzle-zod";
import z from 'zod';
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { modules_items } from "./modules_items";

export const modules = sqliteTable('modules', {
    id: text('id').primaryKey(),
    title: text('text').notNull(),
    course_id: text('course_id').notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),


})

export const modules_relations = relations(modules, ({ one, many }) => ({
    course: one(courses, {
        fields: [modules.course_id],
        references: [courses.id]
    }),
    items: many(modules_items)
}))

const module_select = createSelectSchema(modules);
export type ModuleDB = z.infer<typeof module_select>