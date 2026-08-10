import type { MetadataRoute } from "next";
import { listPublicCourses } from "@/lib/db/queries/courses";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * `sitemap.ts` is a Route Handler that Next caches by default unless it uses a
 * request-time API or dynamic config. Without this the whole file is evaluated
 * once at build and the sitemap never reflects a newly published course.
 *
 * An hour is the steady-state ceiling; the publish/delete actions also call
 * `revalidatePath('/sitemap.xml')` so changes show up immediately. Deliberately
 * not `force-dynamic` — that would hit the database on every crawler request.
 */
export const revalidate = 3600;

const STATIC_ROUTES: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
}> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/courses", changeFrequency: "daily", priority: 0.9 },
    { path: "/productos", changeFrequency: "weekly", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: absoluteUrl(route.path),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    let courseEntries: MetadataRoute.Sitemap = [];
    try {
        const courses = await listPublicCourses();
        courseEntries = courses.map((course) => ({
            url: absoluteUrl(`/cursos/${course.slug}`),
            // Only emitted when we actually know it. Google discounts sitemaps
            // whose lastmod it learns not to trust, so `new Date()` here would
            // be worse than omitting the field.
            ...(course.updated_at ? { lastModified: course.updated_at } : {}),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch (error) {
        // This route is cached, so a throw at build time fails the build. A
        // sitemap temporarily missing its courses is recoverable; a broken
        // deploy is not.
        console.error("[sitemap] course query failed, serving static routes only", error);
    }

    return [...staticEntries, ...courseEntries];
}
