'use server'

import { revalidatePath } from "next/cache"
import { db } from "../.."
import { ebook_schema } from "../../schema/ebook_schema"
import { action } from "../safe_action"
import z from 'zod'
import { eq } from "drizzle-orm"

export const deleteEbookAction = action.schema(z.object({
    id: z.string(),
})).action(async ({ parsedInput: { id } }) => {
    await db.delete(ebook_schema).where(eq(ebook_schema.id, id))
    revalidatePath("/dashboard/ebook")
})
