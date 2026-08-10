'use server';

import { db } from "@/lib/db";
import z from 'zod';

import { and, eq } from "drizzle-orm";
import { action } from "../safe_action";
import { usersToCourses } from "../../schema/users_to_courses";
import { getFirstModuleOfCourse } from "../edit/modules_actions";
import { course_progress } from "../../schema/course_progress";



export const addCourseAction = action
    .schema(
        z.object(
            {
                user_id: z.string(),
                course_id: z.string()
            }
        ),

    )
    .action(async ({ parsedInput: { course_id, user_id } }) => {

        // Check if the user already has the course
        const userCourses = await db.select().from(usersToCourses).where(and(eq(usersToCourses.user_id, user_id), eq(usersToCourses.course_id, course_id)));

        ;
        if (userCourses.length > 0) {
            throw new Error("User already has this course");
        }
        await db.insert(usersToCourses).values({ course_id: course_id, user_id: user_id });
        const firstModule = await getFirstModuleOfCourse(course_id);

        await db.insert(course_progress).values({
            id: crypto.randomUUID(),
            isFinished: false,
            module_number: 0,
            user_id: user_id,
            course_id: course_id,
            module_id: firstModule!.id
        })

    })
