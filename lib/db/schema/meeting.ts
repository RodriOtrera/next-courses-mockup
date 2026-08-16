import {  InferSelectModel, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

export const meeting_schema =
    sqliteTable("meeting", {
        id: text('id').default("noID").primaryKey(),
        link: text('link'),
        updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(unixepoch())`) //ON UPDATE NOW
    })


    export type MeetingSchema = typeof meeting_schema.$inferSelect;

export const meetingInsert = createInsertSchema(meeting_schema);
export type Meeting = InferSelectModel<typeof meeting_schema>;    