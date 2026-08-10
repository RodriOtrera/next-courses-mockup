'use server'

import { revalidatePath } from "next/cache"
import { db } from "../.."
import { program_schema } from "../../schema/program_schema"
import { action } from "../safe_action"
import z from 'zod'
import { eq } from "drizzle-orm"

export const deleteProgramAction = action.schema(z.object({
    id: z.string(),
})).action(async ({ parsedInput: { id } }) => {
    await db.delete(program_schema).where(eq(program_schema.id, id))
    revalidatePath("/dashboard/program")
})
