'use server';

import { desc, eq } from "drizzle-orm";
import { db } from "../..";
import { coachings } from "../../schema/coachings";
import { action } from "../safe_action";
import z from 'zod';
import { revalidatePath, revalidateTag } from "next/cache";


export const updateCoaching = action
    .schema(
        z.object({
            coaching_id: z.string(),
            price: z.number(),
            name: z.string(),

            description: z.string(),
            video_link: z.string()
        })
    )
    .action(async ({ parsedInput: { coaching_id, name, price, description, video_link } }) => {

        await db.update(coachings).set({
            name,
            price,
            description,
            video_link
        }).where(eq(coachings.id, coaching_id)).execute();
        revalidatePath(`/coachingAdmin/${coaching_id}`);
        return;

    });