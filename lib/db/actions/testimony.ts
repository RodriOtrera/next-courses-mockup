"use server";
import { currentUser } from "@/lib/auth/server"

import { action } from "./safe_action";
import z from 'zod';
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "..";
import { testimonials } from "../schema/testimonials";


export const createTestimony = action


    .schema(z.object({
        course_id: z.string(),
        rating: z.number(),
        content: z.string()
    })).action(async ({ parsedInput: { course_id, rating, content } }) => {
        const user = await currentUser();
        if (user == undefined) {
            throw Error('Usario no esta loggeado para dar el testimonio')
        }

        const newTestimony = await db.insert(testimonials).values({
            course_id: course_id,
            user_id: user.id,
            rating: rating,
            id: crypto.randomUUID(),
            content
        }).returning()
        revalidatePath(``)
        console.log(newTestimony);
    })


export async function checkTestimony(course_id: string) {
    const user = await currentUser();
    if (user == undefined) {
        throw Error('User not logged to do the testimony')
    }

    const testimonysFromCourse = await db.select().from(testimonials).where(and(eq(testimonials.course_id, course_id), eq(testimonials.user_id, user.id)))
    return testimonysFromCourse[0];
}