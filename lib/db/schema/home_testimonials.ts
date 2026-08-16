import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import z from 'zod';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { InferSelectModel } from "drizzle-orm";

export const home_testimonials = sqliteTable("home_testimonials", {
    id: text("id").primaryKey(),
    user_name: text("user_name").notNull(),
    content: text("content").notNull(),
    user_img_url: text("user_img_url").notNull(),


})


export const zodHomeTestimonials = createInsertSchema(home_testimonials);


export type HomeTestimonial = InferSelectModel<typeof home_testimonials>