"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema/testimonials";

export async function deleteTestimonial(formData: FormData) {
    const testimonialId = formData.get("testimonial_id") as string;
    const courseId = formData.get("course_id") as string;
    await db.delete(testimonials).where(eq(testimonials.id, testimonialId));
    revalidatePath(`/editarCurso/${courseId}`);
}

export async function updateTestimonial(formData: FormData) {
    const testimonialId = formData.get("testimonial_id") as string;
    const courseId = formData.get("course_id") as string;
    const content = formData.get("content") as string;
    const rating = parseFloat(formData.get("rating") as string);
    await db
        .update(testimonials)
        .set({ content, rating })
        .where(eq(testimonials.id, testimonialId));
    revalidatePath(`/editarCurso/${courseId}`);
}
