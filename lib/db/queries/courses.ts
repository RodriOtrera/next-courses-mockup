import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "..";
import { courses } from "../schema/course";
import { UUID_RE } from "@/lib/utils/slug";

/**
 * Course reads for rendering.
 *
 * Deliberately NOT a `"use server"` module. Two reasons:
 *
 * 1. The SWC server-actions transform rejects any export of a `"use server"`
 *    file that isn't an async function, so `export const x = cache(async …)`
 *    — a call expression — fails to compile. React `cache()` is the standard
 *    way to collapse the duplicate read between `generateMetadata` and the
 *    page body, and it can only live outside such a module.
 *
 * 2. Every export of a `"use server"` module is a public, unauthenticated RPC
 *    endpoint invocable with a `Next-Action` header. Read helpers have no
 *    business being an attack surface — that is exactly how `getCoursesAdmin()`
 *    (no auth check, returns unpublished courses) became reachable from the
 *    open internet.
 *
 * `server-only` makes an accidental client import a clear build error rather
 * than a baffling bundler failure.
 */

const withCourseDetail = {
    frequentlyAskedQuestions: true,
    testimonials: { with: { user: true } },
    modules: { with: { items: true } },
    instructors: true,
    certifications: true,
} as const;

type RawCourseDetail = NonNullable<
    Awaited<ReturnType<typeof db.query.courses.findFirst<{ with: typeof withCourseDetail }>>>
>;

/**
 * Mean testimonial rating, or null when there are none.
 *
 * The previous implementation divided by zero and returned NaN. NaN is falsy,
 * so `rating || 4.5` in the hero rendered a fabricated 4.5-star rating for
 * every course without reviews — and `JSON.stringify({ratingValue: NaN})`
 * emits `null`, which invalidates the whole structured-data item. Both failure
 * modes are eliminated by making "no rating" explicit.
 */
function summarizeRatings(testimonials: ReadonlyArray<{ rating: number }>) {
    const reviewCount = testimonials.length;
    if (reviewCount === 0) return { rating: null, reviewCount: 0 };

    const total = testimonials.reduce((sum, t) => sum + t.rating, 0);
    const mean = total / reviewCount;
    return { rating: Number.isFinite(mean) ? mean : null, reviewCount };
}

export type CourseDetail = RawCourseDetail & {
    rating: number | null;
    reviewCount: number;
};

/** Detail read by public URL key. Returns null on miss — never throws for "not found". */
export const getCourseBySlug = cache(
    async (slug: string): Promise<CourseDetail | null> => {
        const course = await db.query.courses.findFirst({
            where: eq(courses.slug, slug),
            with: withCourseDetail,
        });
        if (!course) return null;
        return { ...course, ...summarizeRatings(course.testimonials) };
    },
);

/** Detail read by primary key, for the admin/API paths that still use ids. */
export const getCourseById = cache(
    async (id: string): Promise<CourseDetail | null> => {
        const course = await db.query.courses.findFirst({
            where: eq(courses.id, id),
            with: withCourseDetail,
        });
        if (!course) return null;
        return { ...course, ...summarizeRatings(course.testimonials) };
    },
);

/** Legacy UUID → current slug. Single-column primary-key lookup. */
export const getCourseSlugById = cache(async (id: string): Promise<string | null> => {
    const row = await db.query.courses.findFirst({
        where: eq(courses.id, id),
        columns: { slug: true },
    });
    return row?.slug ?? null;
});

export type CourseRouteResolution =
    | { kind: "slug"; course: CourseDetail }
    | { kind: "legacy-id"; slug: string }
    | { kind: "missing" };

/**
 * Resolve a `/cursos/[slug]` param, which may be either a slug or a legacy UUID.
 *
 * Both forms hit the same route, so the distinction has to be made at runtime.
 * Branching on shape first means the extra lookup only runs for params that
 * actually look like a UUID — slug requests, the overwhelming majority, pay
 * nothing.
 */
export const resolveCourseRoute = cache(
    async (param: string): Promise<CourseRouteResolution> => {
        if (UUID_RE.test(param)) {
            const slug = await getCourseSlugById(param);
            return slug ? { kind: "legacy-id", slug } : { kind: "missing" };
        }

        const course = await getCourseBySlug(param);
        return course ? { kind: "slug", course } : { kind: "missing" };
    },
);

export type CourseSummary = Awaited<ReturnType<typeof listCourses>>[number];

/** Catalogue read. `includeUnpublished` is for authenticated admin surfaces only. */
export const listCourses = cache(async (includeUnpublished = false) => {
    const rows = await db.query.courses.findMany({
        where: includeUnpublished ? undefined : eq(courses.is_public, true),
        with: { testimonials: true, modules: true, instructors: true },
    });

    return rows.map((row) => ({ ...row, ...summarizeRatings(row.testimonials) }));
});

/** Minimal projection for the sitemap. Public courses only. */
export const listPublicCourses = cache(async () => {
    return db.query.courses.findMany({
        where: eq(courses.is_public, true),
        columns: {
            id: true,
            slug: true,
            title: true,
            img_url: true,
            updated_at: true,
        },
    });
});
