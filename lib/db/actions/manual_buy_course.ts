"use server";

import { db } from "..";
import { course_progress } from "../schema/course_progress";
import { usersToCourses } from "../schema/users_to_courses";
import { getFirstModuleOfCourse } from "./edit/modules_actions";
import { captureServer } from "@/lib/analytics/server";


export async function manualBuyCourse(form: FormData) {
    const course_id = form.get("course_id") as string;
    const user_id = form.get("user_id") as string;

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

    // `source: manual` keeps admin grants out of revenue reporting — these are
    // entitlements, not sales, and lumping them in overstates conversion.
    await captureServer("enrollment_granted", user_id, {
        product_type: "course",
        product_id: course_id,
        source: "manual",
    });

    console.log("Curso comprado! artificialmente")
    return;

}