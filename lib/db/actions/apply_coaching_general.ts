'use server';

import { eq } from "drizzle-orm";
import { db } from "..";
import { subscription } from "../schema/subscrition_schema";

export async function applyCoachingGeneral () {
    await db.update(subscription).set({coaching_id: 'dd03fb67-35b3-4909-9c80-9ab26415e0ce'}).where(eq(subscription.active, true)).execute();
    console.log('Applied coaching general');	
}