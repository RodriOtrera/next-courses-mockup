'use server';

import { db } from "@/lib/db";
import z from 'zod';
import { and, eq } from "drizzle-orm";
import { action } from "../safe_action";
import { payments_on_users_ebooks } from "../../schema/ebook_schema";

export const addEbookAction = action
    .schema(
        z.object(
            {
                user_id: z.string(),
                ebook_id: z.string()
            }
        ),
    )
    .action(async ({ parsedInput: { ebook_id, user_id } }) => {
        // Check if the user already has the ebook
        const userEbooks = await db.select()
            .from(payments_on_users_ebooks)
            .where(
                and(
                    eq(payments_on_users_ebooks.user_id, user_id),
                    eq(payments_on_users_ebooks.ebook_id, ebook_id)
                )
            );

        if (userEbooks.length > 0) {
            throw new Error("User already has this ebook");
        }

        // Create a manual payment entry with a special payment_id for admin additions
        const manualPaymentId = Math.floor(Date.now() / 1000); // Unix timestamp as payment ID

        await db.insert(payments_on_users_ebooks).values({
            ebook_id: ebook_id,
            user_id: user_id,
            payment_id: manualPaymentId
        });
    });
