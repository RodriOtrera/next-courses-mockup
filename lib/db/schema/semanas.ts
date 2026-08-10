import { type InferInsertModel, relations, sql } from "drizzle-orm";
import { videos } from "./videos";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text , timestamp} from "drizzle-orm/pg-core";

export const semanas = pgTable("semanas", {
    id: text('id').primaryKey(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow() //ON UPDATRE NOW REMEMBERRRRRRRRRR
})


export const semanas_relations = relations(semanas, ({ many }) => ({
    videos: many(videos)
}))

export const semanasInsert = createInsertSchema(semanas);


export type InsertSemana = InferInsertModel<typeof semanas>;