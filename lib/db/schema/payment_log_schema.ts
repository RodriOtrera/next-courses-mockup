import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { users } from "./auth_schema";

export const payment_log_schema = pgTable("payment_log", {
    id: text("id").primaryKey(),
    payment_id: text('payment_id'),
    user_id: text('user_id'),
    created_at: timestamp("updated_at").defaultNow(),
    paid_amount: text('paid_amount'),
    // `paid_amount` is text and has to be run through parseAmount() before it
    // can be summed. This holds the same value in minor units as an integer so
    // revenue can be aggregated in SQL. Both are written; nothing reading the
    // text column needs to change.
    amount_cents: integer('amount_cents'),
    product_id: text('product_id'),
    product_name: text('product_name'),
    payment_source: text('payment_source'),  // 'mercadopago' | 'paypal'
    currency: text('currency').default('ARS'),  // 'ARS' | 'USD'
})

export const payment_log_relations = relations(payment_log_schema, ({ one }) => ({
    user: one(users, {
        fields: [payment_log_schema.user_id],
        references: [users.id]
    })
}))