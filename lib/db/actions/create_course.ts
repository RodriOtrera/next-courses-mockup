"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { courses } from "../schema/course";
import { db } from "..";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

async function isSlugTaken(candidate: string): Promise<boolean> {
    const hit = await db.query.courses.findFirst({
        where: eq(courses.slug, candidate),
        columns: { id: true },
    });
    return !!hit;
}

export async function createCourse(formData: FormData) {
    const title = ((formData.get("title") as string | null) ?? "").trim();
    // Previously unvalidated, which let empty titles through and produced a
    // curso / curso-2 / curso-3 soup that's painful to clean up once indexed.
    if (!title) throw new Error("El título del curso es obligatorio");

    const id = crypto.randomUUID();
    const slug = await uniqueSlug(title, isSlugTaken, { fallbackSuffix: id.slice(0, 8) });

    try {
        await db.insert(courses).values({ title, id, slug });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // The unique constraint is the real arbiter — there's no transaction to
        // make the probe-then-write atomic. The id-derived suffix can't collide,
        // so a single retry is sufficient.
        if (!/duplicate key|23505/i.test(message)) throw err;
        await db
            .insert(courses)
            .values({ title, id, slug: `${slugify(title)}-${id.slice(0, 8)}` });
    }

    // Admin routes stay keyed on the UUID — only the public URL uses the slug.
    redirect(`/editarCurso/${id}`);
}
