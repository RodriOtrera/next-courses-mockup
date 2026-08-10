"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema/course";
import { Instructor, InstructorCreate, instructors } from "@/lib/db/schema/instructors";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { action } from "../safe_action";
import { currentUser } from "@/lib/auth/server";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

export async function createInstructor(form: FormData) {
    const newInstructor: InstructorCreate = {
        id: crypto.randomUUID(),
        course_id: form.get("course_id") as string,
        img_url: form.get('img_url') as string,
        instagram: form.get("instagram") as string,
        name: form.get('name') as string,
        qualities: form.get("qualities") as string,
    }
    console.log(newInstructor);
    await db.insert(instructors).values(newInstructor);
    revalidatePath(`/editarCurso/${form.get("course_id") as string}`);

    console.log('instructor created')
}

/**
 * Public paths that depend on a course, revalidated after any mutation.
 *
 * The slug is resolved server-side from the id rather than accepted as an
 * argument: the client shouldn't be trusted to name a cache key. Before this,
 * `revalidatePath('/cursos/${courseId}')` pointed at a UUID path that no longer
 * exists as a route, so it silently revalidated nothing.
 */
async function revalidateCourse(courseId: string) {
    const row = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        columns: { slug: true },
    });

    revalidatePath(`/editarCurso/${courseId}`);
    if (row?.slug) revalidatePath(`/cursos/${row.slug}`);
    // The catalogue is statically prerendered, so without this a newly
    // published course never appears in the list.
    revalidatePath("/courses");
    revalidatePath("/productos");
    revalidatePath("/sitemap.xml");
}

export const updateCourseImage = action
    .schema(z.object({
        courseId: z.string().min(1),
        imgUrl: z.string().url(),
    }))
    .action(async ({ parsedInput: { courseId, imgUrl } }) => {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        await db
            .update(courses)
            .set({ img_url: imgUrl, updated_at: new Date() })
            .where(eq(courses.id, courseId));
        await revalidateCourse(courseId);

        return { success: true };
    });

export const updateData = action
    .schema(z.object({
        courseId: z.string().min(1),
        price: z.coerce.number().int().min(0),
        price_usd: z.coerce.number().int().min(0),
        duracion: z.string(),
        benefits: z.string(),
        descripcion: z.string(),
        isPublic: z.boolean(),
    }))
    .action(async ({ parsedInput: { courseId, price, price_usd, duracion, benefits, descripcion, isPublic } }) => {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        await db.update(courses).set({
            is_public: isPublic,
            price_usd,
            price,
            beneficios: benefits,
            descripcion,
            duracion,
            updated_at: new Date(),
            // One-way latch: once published, the URL may be indexed, shared or
            // embedded in an ad, so the slug is frozen from here on. Deliberately
            // never cleared — gating on current `is_public` instead would let
            // unpublish → edit → republish silently break an indexed URL.
            ...(isPublic ? { slug_locked: true } : {}),
        }).where(eq(courses.id, courseId));
        await revalidateCourse(courseId);

        return { success: true };
    });

/**
 * Rename a course's public URL. Refused once the course has been published —
 * see the `slug_locked` note above.
 */
export const updateCourseSlug = action
    .schema(z.object({
        courseId: z.string().min(1),
        slug: z.string().min(1),
    }))
    .action(async ({ parsedInput: { courseId, slug } }) => {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        const current = await db.query.courses.findFirst({
            where: eq(courses.id, courseId),
            columns: { slug: true, slug_locked: true, title: true },
        });
        if (!current) throw new Error("Curso no encontrado");
        if (current.slug_locked) {
            throw new Error(
                "La URL no puede cambiarse: el curso ya fue publicado y el enlace podría estar indexado.",
            );
        }

        // Never trust the raw field — an unsanitized value would put
        // `/cursos/Mi Curso!!` in the sitemap.
        const desired = slugify(slug) || slugify(current.title);
        const next = await uniqueSlug(desired, async (candidate) => {
            if (candidate === current.slug) return false;
            const hit = await db.query.courses.findFirst({
                where: eq(courses.slug, candidate),
                columns: { id: true },
            });
            return !!hit;
        }, { fallbackSuffix: courseId.slice(0, 8) });

        await db
            .update(courses)
            .set({ slug: next, updated_at: new Date() })
            .where(eq(courses.id, courseId));
        await revalidateCourse(courseId);

        return { success: true, slug: next };
    });