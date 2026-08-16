import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const coachingItems = sqliteTable("coachingItems", {
        id: text('id').primaryKey(),
        created_at:  integer("createdAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),
        content: text('content').notNull(),
})


