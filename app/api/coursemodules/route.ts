import { getCourseAndModule } from "@/lib/db/actions/courses/course_and_module";
import { getCompletedItemIds, getUserXp } from "@/lib/db/actions/gamification/award_xp";
import { currentUser } from "@/lib/auth/server";
import { NextResponse } from "next/server";

async function handler(req: Request) {
    const { course_id }: { course_id: string } = await req.json();

    const course = await getCourseAndModule(course_id);
    if (course == undefined) {
        throw Error("Course not found");
    }

    // Completion comes from the XP ledger, which records exactly which lessons
    // were finished. The sidebar used to infer it from the cursor's position,
    // which marked every earlier lesson complete the moment someone skipped
    // ahead. Signed-out visitors just get an empty list.
    const user = await currentUser();
    const [completed_item_ids, total_xp] = user
        ? await Promise.all([
            getCompletedItemIds(user.id, course_id),
            getUserXp(user.id),
        ])
        : [[], 0];

    // `getCourseAndModule` returns every enrolled learner's progress rows and
    // certificates. This endpoint takes no auth and only ever needs the
    // caller's own, so drop the rest rather than broadcasting who else bought
    // the course and how far along they are.
    const { course_progress: _all, certifications, ...publicCourse } = course;

    return NextResponse.json({
        ...publicCourse,
        certifications: user
            ? certifications.filter((c) => c.user_id === user.id)
            : [],
        completed_item_ids,
        total_xp,
    });
}

export { handler as GET, handler as POST };
