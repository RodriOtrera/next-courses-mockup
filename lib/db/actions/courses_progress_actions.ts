"use server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "..";
import { CourseModuleInfo, CourseProgressSelect, course_progress } from "../schema/course_progress";
import { ModuleNavigationI } from "@/components/module/ModuleNavigation";
import { getModulesOfCourse } from "./edit/modules_actions";
import { users } from "../schema/auth_schema";
import { sendCourseProgressEmail } from "@/lib/email/transactional";
import { getCourseAndModule } from "./courses/course_and_module";
import { auth } from "@/lib/auth";
import { captureServer } from "@/lib/analytics/server";
import { awardCourseXp } from "./gamification/award_xp";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// export async function updateCourseProgress(courseId: string, newModuleId: string) {
//     const user = await currentUser();
//     if (user == null) {
//         throw Error('Not logged in')
//     };

//     const { modules: allModules, course } = await getModulesOfCourse(courseId)

//     const courseProgress = await db.select().from(course_progress).where(eq(course_progress.user_id, user.id))
//     const selectedCourseProgress = courseProgress.find((e) => e.course_id == courseId);

//     console.log(selectedCourseProgress);

// }

export async function setNextModuleProgress(navigationTimeline: ModuleNavigationI) {


    const course_id = navigationTimeline.course_id;
    const next_module_id = navigationTimeline.nextModuleId;
    const current_module_id = navigationTimeline.currentModule;
    const max_progress = navigationTimeline.progress;
    const amountOfModules = navigationTimeline.amountOfModules;
    console.log('Max progress', max_progress);

    const course_and_modules = await getCourseAndModule(course_id);
    let currentProgress = 0;
    let arriveProgress = 0;

    if (course_and_modules == undefined) {
        throw Error('Course and modules not found');


    }

    const allModulesItems = course_and_modules.modules.flatMap((e) => e.items);
    const indexOfModule = allModulesItems.findIndex(
        (e) => e.id == current_module_id
    );

    currentProgress = ((indexOfModule + 1) / allModulesItems.length) * 100;
    console.log('Current Progress', currentProgress);
    arriveProgress = ((indexOfModule + 2) / allModulesItems.length) * 100;
    console.log('Arrive Progress', arriveProgress);

    if ((max_progress != null && max_progress < arriveProgress && max_progress < 25) && arriveProgress >= 25 && arriveProgress < 50) {
        console.log('Should send email for progress at 25%')
        await sendCourseProgressEmail({
            to: navigationTimeline.user_email,
            courseTitle: navigationTimeline.course_title,
            milestone: 25,
        })
        await captureServer("progress_milestone_reached", navigationTimeline.user_id, {
            course_id,
            milestone: 25,
        });

    }

    if ((max_progress != null && max_progress < arriveProgress && max_progress < 50) && arriveProgress >= 50 && arriveProgress < 75) {
        console.log('Should send email for progress at 50%')
        await sendCourseProgressEmail({
            to: navigationTimeline.user_email,
            courseTitle: navigationTimeline.course_title,
            milestone: 50,
        })
        await captureServer("progress_milestone_reached", navigationTimeline.user_id, {
            course_id,
            milestone: 50,
        });
    }
    if ((max_progress != null && max_progress < arriveProgress && max_progress < 75) && arriveProgress >= 75) {
        await sendCourseProgressEmail({
            to: navigationTimeline.user_email,
            courseTitle: navigationTimeline.course_title,
            milestone: 75,
        })
        console.log('Should send email for progress at 75%')
        await captureServer("progress_milestone_reached", navigationTimeline.user_id, {
            course_id,
            milestone: 75,
        });
    }



    await db
        .update(course_progress)
        .set({
            module_id: navigationTimeline.nextModuleId, current_progress:

                max_progress == null || max_progress < arriveProgress ? arriveProgress : max_progress,
            updated_at: new Date()

        })
        .where(
            and(eq(course_progress.course_id, navigationTimeline.course_id),
                eq(course_progress.user_id, navigationTimeline.user_id))

        );

    // Must precede the redirect below: `redirect()` works by throwing, so
    // anything after it never runs.
    await captureServer("lesson_completed", navigationTimeline.user_id, {
        course_id,
        module_item_id: current_module_id,
        progress: Math.round(arriveProgress),
    });

    redirect(
        `/module/${navigationTimeline.nextModuleId}?course=${navigationTimeline.course_id}`
    );
}

export async function setExamModuleProgress(navigationTimeline: ModuleNavigationI) {
    await db
        .update(course_progress)
        .set({ isFinished: true, updated_at: new Date() })
        .where(
            // The user_id predicate is load-bearing: without it this marks the
            // course finished for every user enrolled in it, not just this one.
            and(eq(course_progress.course_id, navigationTimeline.course_id),
                eq(course_progress.user_id, navigationTimeline.user_id))
        );

    // Both of these must precede the redirect — `redirect()` throws, so
    // nothing after it runs. Idempotent: if the lesson cascade already paid the
    // course bonus (courses without an exam), this is a no-op.
    await awardCourseXp({
        user_id: navigationTimeline.user_id,
        course_id: navigationTimeline.course_id,
    });

    await captureServer("course_completed", navigationTimeline.user_id, {
        course_id: navigationTimeline.course_id,
    });

    redirect(
        `/darExamen?exam_id=${navigationTimeline.exam_id}&course_id=${navigationTimeline.course_id}`
    );
}



export type CourseProgressSelection = AwaitedReturn<typeof getUserCourseProgress>[0]
export async function getUserCourseProgress(user_id: string): Promise<CourseProgressSelect[]> {

    // const courses = await userCourses();
    const progress = await db.select().from(course_progress).where(eq(course_progress.user_id, user_id))

    let progressWithRating: CourseProgressSelect[] = [];

    for (const courseProgress of progress) {
        const { modules, course } = await getModulesOfCourse(courseProgress.course_id);
        const indexOfModule = modules.findIndex((e) => e.id == courseProgress.module_id);
        const progressRating = courseProgress.isFinished ? 1 : indexOfModule / modules.length;
        const certification = course.certifications.find((c) => c.user_id == user_id);

        // Find which parent module the current item belongs to
        let currentParentModuleId: string | null = null;
        for (const mod of course.modules) {
            if (mod.items.some((item) => item.id === courseProgress.module_id)) {
                currentParentModuleId = mod.id;
                break;
            }
        }

        const currentParentIndex = course.modules.findIndex((m) => m.id === currentParentModuleId);

        const moduleBreakdown: CourseModuleInfo[] = course.modules.map((mod, i) => ({
            id: mod.id,
            title: mod.title,
            itemCount: mod.items.length,
            isCurrent: mod.id === currentParentModuleId,
            isCompleted: courseProgress.isFinished || i < currentParentIndex,
        }));

        progressWithRating.push({
            ...courseProgress,
            rating: progressRating,
            courseTitle: course.title,
            moduleTitle: modules[indexOfModule] ? modules[indexOfModule]!.title : "",
            exam_id: course.exam_id,
            certification_id: !certification ? null : certification.id,
            courseImgUrl: course.img_url ?? null,
            courseDuracion: course.duracion,
            totalModules: course.modules.length,
            currentModuleIndex: currentParentIndex >= 0 ? currentParentIndex : 0,
            moduleBreakdown,
        });
    }


    return progressWithRating;
}


export async function userCourses() {
    const user = await currentUser();
    if (user == null) {
        throw Error('Not logged in')
    };
    const userDB = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
            users_to_courses: {
                with: {
                    course: {
                        with: {
                            modules: true,

                        }
                    }
                }
            }
        }
    })
    if (userDB == undefined) {
        throw Error('User not found in DB')
    };
    const coursesFromUser = userDB.users_to_courses.map((e) => e.course);

    return coursesFromUser;
}
