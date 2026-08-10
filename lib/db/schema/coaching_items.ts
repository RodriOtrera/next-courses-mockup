import { sql } from "drizzle-orm";
import { pgTable, text , timestamp} from "drizzle-orm/pg-core";

export const coachingItems = pgTable("coachingItems", {
        id: text('id').primaryKey(),
        created_at:  timestamp("createdAt").defaultNow(),
        content: text('content').notNull(),
})


