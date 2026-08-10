import { type InferSelectModel, relations, type InferInsertModel, sql } from "drizzle-orm";
import { semanas } from "./semanas";
import { pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const videos = pgTable("videos", {
    id: text('id').primaryKey(),
    title: text("title").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    videoUrl: text('video_url').notNull(),
    semana_id: text("semana_id",).notNull(),
    description: text('Description',).default("")
})

export const videos_relations = relations(videos, ({ one }) => ({
    semana: one(semanas, {
        fields: [videos.semana_id],
        references: [semanas.id]
    })
}))

export const videoInsert = createInsertSchema(videos)

export type VideoInsert = InferInsertModel<typeof videos>
export type VideoSelect = InferSelectModel<typeof videos>