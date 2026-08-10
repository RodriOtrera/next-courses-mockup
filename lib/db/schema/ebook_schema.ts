import { InferSelectModel, relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod"
import { users } from "./auth_schema";
import { jsonb, integer, primaryKey, pgTable, text , timestamp} from "drizzle-orm/pg-core";


export const ebook_schema = pgTable("ebook", {
    id: text('id',).primaryKey().notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    price: integer("price").notNull(),
    price_usd: integer('price_usd').default(0).notNull(),
    img_url: text("img_url").notNull(),
    pdf_url: text("pdf_url").notNull(),
    card_color: text('card_color').notNull(),
    stats_values: jsonb("stats_values").notNull().$type<StatsValuesType>(),
    stats_names: jsonb("stats_names").notNull().$type<StatsNameType>()

})
export const ebookRelations = relations(ebook_schema, ({ many }) => ({
    payments: many(payments_on_users_ebooks)
}))


export const payment_schema_ebook = pgTable("payment_ebook", {
    id: integer("id").primaryKey().notNull(),
    item_title: text('item_title').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    net_amount: integer('net_amount').notNull(),
    payerName: text('payer_name'),
    payer_email: text("payer_email"),

})


export const payment_relation = relations(payment_schema_ebook, ({ many }) => ({
    payments: many(payments_on_users_ebooks),
}))


export const payments_on_users_ebooks = pgTable("payment_on_users_ebooks", {
    ebook_id: text("ebook_id",).notNull(),
    user_id: text('user_id',).notNull(),
    payment_id: integer('payment_id').notNull(),
    // See the note on usersToCourses.created_at — same backfill caveat.
    created_at: timestamp('created_at').defaultNow(),

}, (table) => ({ pk: primaryKey({ columns: [table.ebook_id, table.user_id, table.payment_id] }) }))

export const payments_on_users_ebooks_relations = relations(payments_on_users_ebooks, ({ one }) => ({
    ebook: one(ebook_schema, {
        fields: [payments_on_users_ebooks.ebook_id],
        references: [ebook_schema.id]
    }),
    user: one(users, {
        fields: [payments_on_users_ebooks.user_id],
        references: [users.id]
    }),
    payment: one(payment_schema_ebook, {
        fields: [payments_on_users_ebooks.payment_id],
        references: [payment_schema_ebook.id]
    })
}))



export const ebook_insert = createInsertSchema(ebook_schema);
export const ebook_payment_insert = createInsertSchema(payment_schema_ebook);
export const payment_on_ebooks_insert = createInsertSchema(payments_on_users_ebooks)


const paymentValidatorEbook = createInsertSchema(payment_schema_ebook);
export type PaymentInsertSchema = z.infer<typeof paymentValidatorEbook>
const zod_stats_names = z.object({
    stat1: z.string(),
    stat2: z.string(),
    stat3: z.string()
})
const zod_stats_values = z.object({
    stat1: z.coerce.number(),
    stat2: z.coerce.number(),
    stat3: z.coerce.number()
})

export type StatsNameType = z.infer<typeof zod_stats_names>
export type StatsValuesType = z.infer<typeof zod_stats_values>


export const ebook_insert_schema = createInsertSchema(ebook_schema).omit({ stats_names: true, stats_values: true })
    .extend({
        stats_values: zod_stats_values,
        stats_names: zod_stats_names,
        price: z.coerce.number(),
        price_usd: z.coerce.number(),
    });


export type InsertEbookSchema = z.infer<typeof ebook_insert_schema>
export type SelectEbook = InferSelectModel<typeof ebook_schema>