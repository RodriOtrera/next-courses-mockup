'use server';

import { db } from "../..";
import { home_testimonials } from "../../schema/home_testimonials";


export async function getTestimonials() {
    const testimonials = await db.select().from(home_testimonials);
    return testimonials;
}