import { type InferSelectModel, relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import z from "zod"
import { users } from "./auth_schema";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const program_schema = sqliteTable("programs", {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    price: integer("price").notNull(),
    price_usd: integer('price_usd').default(0).notNull(),
    img_url: text("img_url").notNull(),
    pdf_url: text("pdf_url").notNull(),
})
export const programRelations = relations(program_schema, ({ many }) => ({
    payments: many(payments_on_users_program)
}))


export const payment_schema_program = sqliteTable("payment_program", {
    id: integer('payment_id').primaryKey().notNull(),
    item_title: text('item_title').notNull(),
    created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    net_amount: integer('net_amount').notNull(),
    payerName: text('payer_name'),
    payer_email: text("payer_email"),

})

export const payment_relation_program = relations(payment_schema_program, ({ many }) => ({
    payments: many(payments_on_users_program),
}))


export const payments_on_users_program = sqliteTable("payment_on_users_program", {
    program_id: text("program_id").notNull(),
    user_id: text('user_id').notNull(),
    payment_id: integer('payment_id').notNull(),
    // See the note on usersToCourses.created_at — same backfill caveat.
    created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),

}, (table) => ({ pk: primaryKey({ columns: [table.program_id, table.user_id, table.payment_id] }) }))

export const payments_on_users_program_relations = relations(payments_on_users_program, ({ one }) => ({
    program: one(program_schema, {
        fields: [payments_on_users_program.program_id],
        references: [program_schema.id]
    }),
    user: one(users, {
        fields: [payments_on_users_program.user_id],
        references: [users.id]
    }),
    payment: one(payment_schema_program, {
        fields: [payments_on_users_program.payment_id],
        references: [payment_schema_program.id]
    })
}))


export const programInsert = createInsertSchema(program_schema);

export const payment_schema_program_insert = createInsertSchema(payment_schema_program);
export const payments_on_users_program_insert = createInsertSchema(payments_on_users_program);





export const insertProgramSchema = createInsertSchema(program_schema).extend({
    price: z.coerce.number(),
    price_usd: z.coerce.number(),
});
export type InsertProgram = z.infer<typeof insertProgramSchema>
export type SelectProgram = InferSelectModel<typeof program_schema>
const paymentValidatorProgram = createInsertSchema(payment_schema_program);
export type PaymentInsertSchema = z.infer<typeof paymentValidatorProgram>