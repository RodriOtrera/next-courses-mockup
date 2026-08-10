'use server';
import { revalidatePath } from "next/cache";
import { db } from "../..";
import { home_testimonials, zodHomeTestimonials } from "../../schema/home_testimonials";
import { action } from "../safe_action";


export const createHomeTestimonial = action.schema(zodHomeTestimonials)
    .action(async ({ parsedInput: { user_name, content, user_img_url } }) => {

        await db.insert(home_testimonials)
            .values({
                id: crypto.randomUUID(), user_name, content, user_img_url
            })
        revalidatePath("/testimonios")

        return { success: true }
    })