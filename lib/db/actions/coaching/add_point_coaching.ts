'use server';

import { revalidatePath } from "next/cache";
import { db } from "../..";
import { coaching_items_2, coachingItemInsert } from "../../schema/coachings";
import { action } from "../safe_action";

export const addPointInCoaching =  action
.schema(coachingItemInsert)
.action(async ({parsedInput}) => {
   await db.insert(coaching_items_2).values(parsedInput).execute();
   revalidatePath(`/coachingAdmin/${parsedInput.coaching_id}`);
   return;
})
