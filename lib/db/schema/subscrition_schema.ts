import { relations, sql, type InferSelectModel } from "drizzle-orm";
// import { users } from "./auth_schema";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./auth_schema";
import { coachings } from "./coachings";

export const subscription = sqliteTable('subscriptions', ({
    id: text("id",).notNull().primaryKey(),
    mercadopagoId: integer('mercadopago_id',).notNull(),
    userId: text('user_id',).notNull(),
    paidPrice: text('paid_price',),
    active: integer('active', { mode: 'boolean' }).default(false),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).default(sql`(unixepoch())`),
    coaching_id: text('coaching_id'),


}))


export const subscriptionInsertSchema = createInsertSchema(subscription);
export const subscription_relation = relations(subscription, ({ one }) => ({
    user: one(users, {
        fields: [subscription.userId],
        references: [users.id]
    }),
    coaching: one(coachings, { 
        fields: [subscription.coaching_id],
        references: [coachings.id]
    })
}))

export type Subscription = InferSelectModel<typeof subscription>