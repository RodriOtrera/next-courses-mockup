"use server";

import { db } from "@/lib/db";
import { ModuleEnums, ModuleItemSelect, ModuleZod, modules_items } from "@/lib/db/schema/modules_items";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ModuleNavigationI } from "@/components/module/ModuleNavigation";
import { getCourse } from "../courses/get_courses";
import { course_progress } from "../../schema/course_progress";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { seedCaptionTracks } from "@/lib/mux/caption_pipeline";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function crearModuleItem(form: FormData) {
    const moduleType = form.get("module_type") as ModuleEnums
    const moduleId = form.get('module_id') as string;
    const courseId = form.get('course_id') as string;
    const title = form.get("title") as string;
    if (moduleType == 'pdf') {
        await db.insert(modules_items).values({
            module_id: moduleId,
            id: crypto.randomUUID(),
            title: title,
            type: moduleType,
            position: 0,
            pdf_url: form.get('pdf_url') as string
        })
        revalidatePath(`/editarCurso/${courseId}`);

    }
    if (moduleType == 'video') {
        const muxAssetId = form.get('mux_asset_id') as string | null;
        const muxPlaybackId = form.get('mux_playback_id') as string | null;
        const description = form.get('description') as string | null;
        const captionSource = form.get('caption_source_language') as string | null;
        const captionTargets = (form.get('caption_targets') as string | null)
            ?.split(',')
            .map((code) => code.trim())
            .filter(Boolean) ?? [];

        const itemId = crypto.randomUUID();

        await db.insert(modules_items).values({
            id: itemId,
            module_id: moduleId,
            title: title,
            type: moduleType,
            position: 0,
            video_url: form.get('video_url') as string || null,
            mux_asset_id: muxAssetId || null,
            mux_playback_id: muxPlaybackId || null,
            description: description || null,
            caption_source_language: muxAssetId ? captionSource : null,
            caption_targets: muxAssetId ? captionTargets : null,
        })

        // Seed the caption tracks only for a Mux upload: the subtitles were
        // requested when that upload was created, and these rows are what the
        // pipeline (browser poll or cron sweep) advances from. A YouTube URL
        // has no asset to transcribe.
        if (muxAssetId && captionSource) {
            await seedCaptionTracks({
                moduleItemId: itemId,
                sourceLanguage: captionSource,
                targetLanguages: captionTargets,
            });
        }

        revalidatePath(`/editarCurso/${courseId}`);

    }

    if (moduleType == 'questionario') {
        const questionaryModuleItem = await db.insert(modules_items).values({
            module_id: moduleId,
            id: crypto.randomUUID(),
            title: title,
            type: moduleType,
            position: 0,

        }).returning()
        redirect(`/crearCuestionario?module_id=${questionaryModuleItem[0]?.id}&course_id=${courseId}`)

    }





}


export async function moduleTimeline(courseId: string, module_id: string) {
    const user = await currentUser();
    if (user == null) {
        throw Error('Not logged in')
    };
    const { modules: allModules, course } = await getModulesOfCourse(courseId)
    const course_progress_current = await db.select().from(course_progress).where(
        and(eq(course_progress.course_id, courseId), eq(course_progress.user_id, user.id))
    )
    console.log('Current course progress',course_progress_current);
    let currentModule: ModuleItemSelect | undefined = allModules.find((e) => e.id == module_id);
    if (currentModule == undefined) {
        currentModule = allModules[0]!
    };
    if (currentModule == undefined) {
        throw new Error("Module not found");
    }
    const index = allModules.findIndex((e) => e.id == currentModule!.id);
    const hasNext = allModules.length - 1 > index;
    const hasPrevios = index != 0;


    const timeline: ModuleNavigationI = {
        currentModule: currentModule.id,
        nextModuleId: hasNext ? allModules[index + 1]?.id : undefined,
        previous: hasPrevios ? allModules[index - 1]?.id : undefined,
        exam_id: course.exam_id,
        isLastModule: index == allModules.length - 1,
        course_id: course.id,
        progress:  course_progress_current[0]?.current_progress,
        amountOfModules: allModules.length,
        user_email: user.email,
        user_id: user.id,
        course_title: course.title
    }

    return timeline;
}

export async function getModulesOfCourse(courseId: string) {
    const course = await getCourse(courseId);

    let allModules: ModuleItemSelect[] = [];

    for (const moduleDB of course.modules) {
        allModules = [...allModules, ...moduleDB.items]

    }
    return { modules: allModules, course };
}

export async function getFirstModuleOfCourse(courseId: string) {
    const { modules } = await getModulesOfCourse(courseId);
    return modules[0];
}

