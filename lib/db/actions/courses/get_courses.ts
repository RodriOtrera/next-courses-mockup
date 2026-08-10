"use server";
import { userCourses } from "../courses_progress_actions";
import {
    getCourseById,
    listCourses,
    type CourseDetail,
} from "@/lib/db/queries/courses";

/**
 * Server-action façade over `lib/db/queries/courses.ts`.
 *
 * The real reads — and the only implementation of the rating maths — live in
 * the query module, which is `server-only` rather than `"use server"` so it can
 * use React `cache()`. This file stays because seven client components import
 * the `Course` / `CourseGet` types from it, and because the `"use server"`
 * directive is what currently keeps `db` out of the client bundle for those
 * imports. Prefer importing from `@/lib/db/queries/courses` in new code.
 */

export type Course = Awaited<ReturnType<typeof listCourses>>[number];
export type CourseGet = CourseDetail;
export type TestimonialSelectWithCourse = CourseGet["testimonials"][number];

export const getCourses = async () => listCourses();

export const getCoursesAdmin = async () => listCourses(true);

/**
 * @deprecated Throws on miss, which renders as HTTP 500 in a Server Component —
 * Google reads that as "temporarily broken" and keeps re-crawling the URL.
 * Public pages should use `getCourseBySlug`/`resolveCourseRoute` and `notFound()`.
 * Retained for the API routes that already catch this to produce a 404.
 */
export const getCourse = async (course_id: string): Promise<CourseGet> => {
    const course = await getCourseById(course_id);
    if (!course) throw Error("Course not found");
    return course;
};

export const userBoughtThisCourse = async (course_id: string): Promise<boolean> => {
    try {
        const courses = await userCourses();
        return !!courses.find((c) => c.id == course_id);
    } catch {
        return false;
    }
};
