"use server";
import { eq } from "drizzle-orm";
import { db } from "../..";
import { modules_items } from "../../schema/modules_items";
import { getFirstModuleOfCourse } from "../edit/modules_actions";
import { course_progress } from "../../schema/course_progress";

export async function getModule(moduleId: string, courseId: string, course_progress_id: string) {
    // const user = await currentUser();
    // if (user == null) {
    //     throw Error('User not logged in.')
    // };
    // const userHasCourse = await userBoughtThisCourse(courseId);
    // if (userHasCourse == false) {
    //     throw Error('User didnt bought this course')
    // }

    const moduleFromDb = await db.query.modules_items.findFirst({
        where: eq(modules_items.id, moduleId),
        
    })

    if (moduleFromDb == undefined) {

        const firstModule = await getFirstModuleOfCourse(courseId);
        if (firstModule == undefined) {
            throw Error("No hay ningun modulo para este curso");
        }
        await db.update(course_progress).set({ module_id: firstModule.id }).where(eq(course_progress.id, course_progress_id));
        return firstModule;
    }


    return moduleFromDb;
}