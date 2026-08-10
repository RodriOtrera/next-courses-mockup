import { eq } from "drizzle-orm";
import { db } from "..";
import { payments_on_users_ebooks } from "../schema/ebook_schema";
import { payments_on_users_program } from "../schema/program_schema";

export const programs_query = db.query.program_schema.findMany({
    columns: {
        description: true,
        id: true,
        img_url: true,
        price: true,
        title: true,
        pdf_url: false,
        price_usd: true,
    }
}).prepare("programs_query");

export const ebook_query = db.query.ebook_schema.findMany({
    columns: {
        description: true,
        id: true,
        img_url: true,
        price: true,
        title: true,
        card_color: true,
        stats_names: true,
        stats_values: true,
        price_usd: true
    }
}).prepare("ebooks_query")

export const my_ebooks_query = (user_id: string) => db.query.payments_on_users_ebooks.findMany({
    where: eq(payments_on_users_ebooks.user_id, user_id),
    with: {
        ebook: {
            columns: {
                id: true,
                title: true,
                description: true,
                price: true,
                img_url: true,
                pdf_url: true,
                card_color: true,
                stats_values: true,
                stats_names: true
            }
        }
    }
}).prepare("my_ebooks_query")

export const my_programs_query = (user_id: string) =>
    db.query.payments_on_users_program.findMany({
        where: eq(payments_on_users_program.user_id, user_id),
        with: { program: true }
    }).prepare("my_programs_query")