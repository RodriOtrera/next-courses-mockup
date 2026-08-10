"use server";

import { eq } from "drizzle-orm";
import { db } from "../..";
import { courses } from "../../schema/course";


export async function getCourseAndModule(course_id: string) {
    const course = await db.query.courses.findFirst({
        where: eq(courses.id, course_id),
        with: {
            modules: {
                with: {
                    items: true
                }
            },
            certifications: true,
            course_progress: true
        }
    })
    return course;
}

export type CourseModules = AwaitedReturn<typeof getCourseAndModule>
