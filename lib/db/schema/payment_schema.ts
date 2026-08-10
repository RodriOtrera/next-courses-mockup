import { relations, sql } from "drizzle-orm"
import { courses } from "./course"
import { createInsertSchema } from "drizzle-zod"
import z from 'zod';
import { integer, pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { users } from "./auth_schema";

export const payment_schema = pgTable("payment_schema", {
    id: integer("id").primaryKey(),
    item_title: text('item_title').notNull(),
    created_at: timestamp("createdAt").defaultNow(),
    net_amount: integer('net_amount').notNull(),
    payerName: text('payer_name'),
    payer_email: text("payer_email"),
    course_id: text('course_id').notNull(),
    user_id: text('user_id').notNull()

})

export const payment_schema_relation = relations(payment_schema, ({ one }) => ({
    course: one(courses, {
        fields: [payment_schema.course_id],
        references: [courses.id]
    }),
    user: one(users, {
        fields: [payment_schema.user_id],
        references: [users.id]
    }),

}),)


const insertSchema = createInsertSchema(payment_schema);
export type InsertPayment = z.infer<typeof insertSchema>;