import { type InferInsertModel, relations, sql } from "drizzle-orm";
import { videos } from "./videos";
import { createInsertSchema } from "drizzle-zod";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const semanas = sqliteTable("semanas", {
    id: text('id').primaryKey(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`) //ON UPDATRE NOW REMEMBERRRRRRRRRR
})


export const semanas_relations = relations(semanas, ({ many }) => ({
    videos: many(videos)
}))

export const semanasInsert = createInsertSchema(semanas);


export type InsertSemana = InferInsertModel<typeof semanas>;