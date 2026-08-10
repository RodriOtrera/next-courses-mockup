import { relations, sql, type InferSelectModel } from "drizzle-orm";
// import { users } from "./auth_schema";
import { boolean, jsonb, integer, pgTable, text , timestamp} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./auth_schema";
import { coachings } from "./coachings";

export const subscription = pgTable('subscriptions', ({
    id: text("id",).notNull().primaryKey(),
    mercadopagoId: integer('mercadopago_id',).notNull(),
    userId: text('user_id',).notNull(),
    paidPrice: text('paid_price',),
    active: boolean('active').default(false),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
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