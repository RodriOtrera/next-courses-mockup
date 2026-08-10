'use server';

import { eq } from "drizzle-orm";
import { db } from "../..";
import { subscription } from "../../schema/subscrition_schema";
import { action } from "../safe_action";
import z from 'zod';
import { revalidatePath, revalidateTag } from "next/cache";


export const setPlanId =
    action.schema(z.object({
        subscription_id: z.string(),
        plan_id: z.string()
    })).action(async ({ parsedInput: { subscription_id, plan_id } }) => {
        await db.update(subscription).set({
            coaching_id: plan_id

        }).where(eq(subscription.id, subscription_id))
        revalidatePath('/subscripciones');
    })