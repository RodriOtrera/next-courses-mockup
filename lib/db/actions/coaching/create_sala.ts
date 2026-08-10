'use server'

import { revalidatePath } from "next/cache"
import { db } from "../.."
import { salaInsert, salas } from "../../schema/coachings"
import { action } from "../safe_action"
import { X } from "lucide-react"
import z from 'zod';
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export const create_sala = action.schema(salaInsert).action(async ({
    parsedInput: { coaching_id, img_url, name },
}) => {

    const sala = await db.insert(salas).values({
        coaching_id,
        img_url,
        name,
        id: crypto.randomUUID()
    })
    revalidatePath(`/coachingAdmin/${coaching_id}`)
    return sala
})

export const delete_sala = action.schema(z.object({
    id: z.string(),
    coaching_id: z.string()
})).action(async ({ parsedInput: { id, coaching_id } }) => {
    await db.delete(salas).where(eq(salas.id, id))
    redirect(`/coachingAdmin/${coaching_id}`);
})
