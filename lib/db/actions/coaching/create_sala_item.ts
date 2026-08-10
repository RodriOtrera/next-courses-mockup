'use server';

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "../..";
import { coaching_items_2, salaItemInsert, salasItems, salasTemas, salaTemaInsert } from "../../schema/coachings";
import { action } from "../safe_action";
import z from 'zod';
import { eq } from "drizzle-orm";


export const createSalaTema = action.schema(salaTemaInsert).action(async ({parsedInput}) => {
    const salaTema = await db.insert(salasTemas).values(parsedInput);
    revalidatePath(`/salas/${parsedInput.sala_id}`);
    return salaTema;
})

export const createSalaItem = action.schema(salaItemInsert.and(z.object({sala_id: z.string()}))).action(async ({ 
    parsedInput,
}) => {
    const salaItem = await db.insert(salasItems).values(parsedInput);
    revalidatePath(`/salas/${parsedInput.sala_id}`);
    return salaItem;
});

export const deleteTema = action.schema(z.object({id: z.string(), sala_id: z.string()})).action(async ({parsedInput}) => {
    await db.delete(salasTemas).where(eq(salasTemas.id, parsedInput.id)); 
    revalidatePath(`/salas/${parsedInput.sala_id}`);
    
})

export const deleteItemCoaching = action.schema(z.object({id: z.string(), sala_id: z.string()})).action(async ({parsedInput}) => {
    await db.delete(salasItems).where(eq(salasItems.id, parsedInput.id)); 
    revalidatePath(`/salas/${parsedInput.sala_id}`);
    
})

export const deletePointButton = action.schema(z.object({id: z.string(), coaching_id: z.string()})).action(async ({parsedInput}) => {
    await db.delete(coaching_items_2).where(eq(coaching_items_2.id, parsedInput.id)); 
    revalidatePath(`/coachingAdmin/${parsedInput.coaching_id}`);
    
})