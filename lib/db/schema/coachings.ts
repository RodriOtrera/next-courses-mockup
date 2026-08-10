import { InferSelectModel, relations, sql } from "drizzle-orm";
import { jsonb, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { subscription } from "./subscrition_schema";
import { createInsertSchema } from "drizzle-zod";

export const coachings = pgTable('coachings', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    order: integer('order').notNull(),
    price: integer('price').default(0).notNull(),
    price_usd: integer('price_usd').default(0).notNull(),
    plan_id: text('plan_id'),
    description: text('description').notNull().default(''),
    video_link: text('video_link').notNull().default(''),
})

export const coachingRelation = relations(coachings, ({ many }) => ({
    salas: many(salas),
    items: many(coaching_items_2),
    subscriptions: many(subscription)
}))


export const coaching_items_2 = pgTable('coaching_items', {
    id: text('id').primaryKey(),
    text: text('text').notNull(),
    coaching_id: text('coaching_id').notNull(),
})

export const coaching_items_2_relations = relations(coaching_items_2, ({ one }) => ({
    coaching: one(coachings, {
        fields: [coaching_items_2.coaching_id],
        references: [coachings.id]
    })
}))





export const salas = pgTable('salas', {
    id: text('id').primaryKey(),
    created_at: timestamp('created_at').defaultNow(),
    img_url: text('img_url').notNull(),
    name: text('name').notNull(),
    coaching_id: text('coaching_id').notNull(),
})

export const salasRelation = relations(salas, ({ one, many }) => ({
    coaching: one(coachings, {
        fields: [salas.coaching_id],
        references: [coachings.id]
    }),
    temas: many(salasTemas)
}))

export const salasTemas = pgTable('salas_temas', {
    id: text('id').primaryKey(),
    created_at: timestamp('created_at').defaultNow(),
    name: text('name').notNull(),
    sala_id: text('sala_id').notNull(),
})

export const salasTemasRelation = relations(salasTemas, ({ one, many }) => ({
    sala: one(salas, { fields: [salasTemas.sala_id], references: [salas.id] }),
    items: many(salasItems)

}))

export const salasItems = pgTable('salas_items', {
    id: text('id').primaryKey(),
    created_at: timestamp('created_at').defaultNow(),
    name: text('name').notNull(),
    link: text('link').notNull(),
    type: text('type', { enum: ['video', 'pdf'] }).notNull(),
    tema_id: text('sala_id').notNull(),
    description: text('description').notNull().default(''),
})

export const salasItemsRelation = relations(salasItems, ({ one }) => ({
    sala: one(salasTemas, {
        fields: [salasItems.tema_id],
        references: [salasTemas.id]
    })
}))

export const salaInsert = createInsertSchema(salas)
export const salaTemaInsert = createInsertSchema(salasTemas)
export const salaItemInsert = createInsertSchema(salasItems)
export const coachingItemInsert = createInsertSchema(coaching_items_2)
export type SelectCoachingItem = InferSelectModel<typeof salasItems>;