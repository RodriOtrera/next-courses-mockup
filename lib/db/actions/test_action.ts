"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "..";
import { modules_items } from "../schema/modules_items";
import { userBoughtThisCourse } from "./courses/get_courses";
import { mux } from "@/lib/mux";
import { currentUser } from "@/lib/auth/server";
import { captureServer } from "@/lib/analytics/server";

export async function actionOnServer(course_id: string, module_id: string, admin: boolean) {
    if (admin) {
        redirect(`/module/${module_id}?course=${course_id}&fromHome=true`);

    }

    const userCourse = await userBoughtThisCourse(course_id);
    if (userCourse) {
        redirect(`/module/${module_id}?course=${course_id}&fromHome=true`)
    }

    // Falling through means the user clicked a lesson they haven't bought, and
    // the UI does nothing at all — no message, no prompt. That silence is the
    // strongest purchase-intent signal in the app and it was never recorded.
    // Only the server knows the click was on locked content, which is why this
    // lives here rather than in the click handler.
    const user = await currentUser();
    if (user?.id) {
        await captureServer("locked_lesson_clicked", user.id, {
            course_id,
            module_item_id: module_id,
        });
    }

    return;


}


export const deleteModuleItem = async (formData: FormData) => {
    const moduleId = formData.get('module_id') as string;

    const [moduleItem] = await db
        .select({ mux_asset_id: modules_items.mux_asset_id })
        .from(modules_items)
        .where(eq(modules_items.id, moduleId));

    if (moduleItem?.mux_asset_id) {
        await mux.video.assets.delete(moduleItem.mux_asset_id);
    }

    await db.delete(modules_items).where(eq(modules_items.id, moduleId));
    revalidatePath(`/editarCurso/${formData.get('course_id') as string}`);
}