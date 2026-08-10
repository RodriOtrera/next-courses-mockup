"use server";
import { currentUser } from "@/lib/auth/server";

import { eq } from "drizzle-orm";
import { MetadataPreference, PreferenceInputType, createPreferenceResponse } from "../create_preference";
import { redirect } from "next/navigation";
import { db } from "../..";
import { courses } from "../../schema/course";
import { captureServer } from "@/lib/analytics/server";


export async function buyCourse(formData: FormData) {
    const course_id: string = formData.get("course_id") as string;
    const user = await currentUser();
    if (user == null) {
        redirect("/login");
    };
    const course = (await db.select().from(courses).where(eq(courses.id, course_id)))[0]
    if (!course) {
        throw new Error('Course not found');
    }

    const metadata: MetadataPreference = {
        user_email: user.email,
        user_id: user.id,
        product_id: course.id,
        product_type: "course",
        product_title: course.title
    };
    const preferenceInput: PreferenceInputType = {
        metadata: metadata,
        descripcion: course.title,
        item_id: course.id,
        price: course.price,
        title: course.title,
    }

    const response = await createPreferenceResponse(preferenceInput);

    // Courses buy through this form action rather than BuyProductButton, so
    // without this the primary product's checkout intent goes unrecorded.
    // Must precede the redirect: `redirect()` throws, and once the buyer is on
    // MercadoPago's domain an abandoned checkout is invisible to us.
    await captureServer("checkout_started", user.id, {
        product_type: "course",
        product_id: course.id,
        product_name: course.title,
        rail: "mercadopago",
        currency: "ARS",
        price: course.price,
    });

    redirect(response.init_point!)

}