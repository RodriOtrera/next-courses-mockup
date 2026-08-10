"use server";

import { eq } from "drizzle-orm";
import { db } from "../..";
import { semanas } from "../../schema/semanas";
import { revalidatePath } from "next/cache";


export async function createSemana (formData:  FormData) {
    
    
    
    await db.insert(semanas).values({
         id: crypto.randomUUID()
    })
    revalidatePath('/coachingAdmin')
}     



export async function deleteSemana (formData:  FormData) {
    const id: string = formData.get('id') as string
    
    
    await db.delete(semanas).where(eq(semanas.id, id))
}     


export type Semana = AwaitedReturn<typeof getSemanas>[0];

export async function getSemanas () {
    return await db.query.semanas.findMany({
        with: {
            videos: true
        }
    });
}