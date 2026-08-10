import {  InferSelectModel, sql } from "drizzle-orm";
import { pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const meeting_schema =
    pgTable("meeting", {
        id: text('id').default("noID").primaryKey(),
        link: text('link'),
        updatedAt: timestamp('updatedAt').defaultNow() //ON UPDATE NOW
    })


    export type MeetingSchema = typeof meeting_schema.$inferSelect;

export const meetingInsert = createInsertSchema(meeting_schema);
export type Meeting = InferSelectModel<typeof meeting_schema>;    