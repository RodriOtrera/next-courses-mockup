'use server'

import { revalidatePath } from "next/cache"
import { db } from "../.."
import { courses } from "../../schema/course"
import { action } from "../safe_action"
import z from 'zod'
import { eq } from "drizzle-orm"

export const deleteCourseAction = action.schema(z.object({
    id: z.string(),
})).action(async ({ parsedInput: { id } }) => {
    await db.delete(courses).where(eq(courses.id, id))
    revalidatePath("/dashboard/cursos")
})
