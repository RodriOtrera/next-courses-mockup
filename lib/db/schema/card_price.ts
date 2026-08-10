import { InferSelectModel } from "drizzle-orm";
import { integer, real, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const card_schema = pgTable("card", {
    id: text('id').default("noID").primaryKey(),
    price_dollars: real("price_dollars").notNull(),
    price_pesos: integer("price_pesos").notNull(),
    plan_id: text("plan_id").default("2c9380848df1fd37018df77f1e5f0625")
})

export const insert_card_schema = createInsertSchema(card_schema);
export type CardPrice = InferSelectModel<typeof card_schema>;