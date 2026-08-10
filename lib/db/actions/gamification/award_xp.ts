/**
 * Deliberately NOT a `"use server"` module. These functions take `user_id` as a
 * parameter, and in a `"use server"` file every export becomes a network-callable
 * endpoint — which would let anyone grant XP to any account. The only
 * browser-reachable entry point is `lesson_xp_action.ts`, which resolves the
 * user from the session instead of trusting the caller.
 */
import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { xp_ledger, type XpSource } from "@/lib/db/schema/gamification";
import { usersToCourses } from "@/lib/db/schema/users_to_courses";
import { course_progress } from "@/lib/db/schema/course_progress";
import { captureServer } from "@/lib/analytics/server";
import { levelFromXp } from "@/lib/gamification/levels";
import { getCourseAndModule } from "../courses/course_and_module";
import { getXpConfig } from "./xp_config_actions";

export interface XpAward {
    source: XpSource;
    source_id: string;
    amount: number;
}

export interface XpAwardResult {
    awards: XpAward[];
    totalXp: number;
    levelBefore: number;
    levelAfter: number;
    /** Stable key for the awards in this batch — lets the UI dedupe its toast. */
    batchId: string | null;
}

const NO_AWARD = (totalXp: number): XpAwardResult => {
    const level = levelFromXp(totalXp);
    return { awards: [], totalXp, levelBefore: level, levelAfter: level, batchId: null };
};

/** Lifetime XP across every course. Summed from the ledger — never denormalised. */
export async function getUserXp(user_id: string): Promise<number> {
    const rows = await db
        .select({ total: sql<string>`coalesce(sum(${xp_ledger.amount}), 0)` })
        .from(xp_ledger)
        .where(eq(xp_ledger.user_id, user_id));

    // Postgres SUM() comes back as a bigint, which the driver hands over as a
    // string — Number() here, not before.
    return Number(rows[0]?.total ?? 0);
}

/** Lesson ids this learner has been awarded XP for, i.e. genuinely completed. */
export async function getCompletedItemIds(user_id: string, course_id: string): Promise<string[]> {
    const rows = await db
        .select({ source_id: xp_ledger.source_id })
        .from(xp_ledger)
        .where(and(
            eq(xp_ledger.user_id, user_id),
            eq(xp_ledger.course_id, course_id),
            eq(xp_ledger.source, "lesson"),
        ));

    return rows.map((r) => r.source_id);
}

const awardKey = (source: XpSource, source_id: string) => `${source}:${source_id}`;

/**
 * Awards XP for completing a lesson, then cascades: a module bonus once every
 * lesson in that module is done, and the course bonus once every lesson in the
 * course is done.
 *
 * Every insert is `onConflictDoNothing()` against the ledger's unique index, so
 * this is safe to call repeatedly for the same lesson — which it will be, since
 * the trigger is opening the page. It is also self-healing: cascade checks run
 * even when the lesson itself was already paid for, so a module bonus missed
 * because of an earlier failure gets picked up on the next visit.
 *
 * `course_id` and `module_item_id` arrive from the browser and are verified
 * against the database before anything is written.
 */
export async function awardLessonXp({
    user_id,
    course_id,
    module_item_id,
}: {
    user_id: string;
    course_id: string;
    module_item_id: string;
}): Promise<XpAwardResult> {
    const course = await getCourseAndModule(course_id);
    if (!course) return NO_AWARD(await getUserXp(user_id));

    // The item must really belong to this course — otherwise a crafted request
    // could claim a lesson from a course the user never bought.
    const parentModule = course.modules.find((m) =>
        m.items.some((item) => item.id === module_item_id)
    );
    if (!parentModule) return NO_AWARD(await getUserXp(user_id));

    const enrollment = await db
        .select({ user_id: usersToCourses.user_id })
        .from(usersToCourses)
        .where(and(
            eq(usersToCourses.user_id, user_id),
            eq(usersToCourses.course_id, course_id),
        ))
        .limit(1);
    if (enrollment.length === 0) return NO_AWARD(await getUserXp(user_id));

    const [config, ledgerRows, totalBefore] = await Promise.all([
        getXpConfig(),
        db.select().from(xp_ledger).where(and(
            eq(xp_ledger.user_id, user_id),
            eq(xp_ledger.course_id, course_id),
        )),
        getUserXp(user_id),
    ]);

    const alreadyAwarded = new Set(ledgerRows.map((r) => awardKey(r.source, r.source_id)));
    const pending: XpAward[] = [];

    if (!alreadyAwarded.has(awardKey("lesson", module_item_id))) {
        pending.push({ source: "lesson", source_id: module_item_id, amount: config.lesson_xp });
        alreadyAwarded.add(awardKey("lesson", module_item_id));
    }

    // Module bonus: every lesson in the parent module now accounted for.
    const moduleComplete = parentModule.items.every((item) =>
        alreadyAwarded.has(awardKey("lesson", item.id))
    );
    if (moduleComplete && !alreadyAwarded.has(awardKey("module", parentModule.id))) {
        pending.push({ source: "module", source_id: parentModule.id, amount: config.module_xp });
        alreadyAwarded.add(awardKey("module", parentModule.id));
    }

    // Course bonus, but only for courses with no final exam. Where an exam
    // exists it is the real finish line, and `awardCourseXp` fires from there.
    const allItems = course.modules.flatMap((m) => m.items);
    const courseComplete = allItems.length > 0 && allItems.every((item) =>
        alreadyAwarded.has(awardKey("lesson", item.id))
    );
    if (
        courseComplete &&
        !course.exam_id &&
        !alreadyAwarded.has(awardKey("course", course_id))
    ) {
        pending.push({ source: "course", source_id: course_id, amount: config.course_xp });
    }

    if (pending.length === 0) return NO_AWARD(totalBefore);

    const inserted = await db
        .insert(xp_ledger)
        .values(pending.map((award) => ({
            id: crypto.randomUUID(),
            user_id,
            course_id,
            source: award.source,
            source_id: award.source_id,
            amount: award.amount,
        })))
        .onConflictDoNothing()
        .returning();

    // Lost the race against a concurrent request — that request reports the awards.
    if (inserted.length === 0) return NO_AWARD(totalBefore);

    const awards: XpAward[] = inserted.map((row) => ({
        source: row.source,
        source_id: row.source_id,
        amount: row.amount,
    }));

    const gained = awards.reduce((sum, a) => sum + a.amount, 0);
    const totalXp = totalBefore + gained;
    const levelBefore = levelFromXp(totalBefore);
    const levelAfter = levelFromXp(totalXp);

    await syncCourseProgress({ user_id, course, module_item_id });
    await reportAwards({ user_id, course_id, awards, totalXp, levelBefore, levelAfter });

    return { awards, totalXp, levelBefore, levelAfter, batchId: inserted[0]!.id };
}

/**
 * Awards the course-completion bonus on its own. Called from the exam and
 * certificate paths; idempotent against the lesson cascade above, so whichever
 * fires first wins and the rest are no-ops.
 */
export async function awardCourseXp({
    user_id,
    course_id,
}: {
    user_id: string;
    course_id: string;
}): Promise<XpAwardResult> {
    const [config, totalBefore] = await Promise.all([getXpConfig(), getUserXp(user_id)]);

    const inserted = await db
        .insert(xp_ledger)
        .values({
            id: crypto.randomUUID(),
            user_id,
            course_id,
            source: "course",
            source_id: course_id,
            amount: config.course_xp,
        })
        .onConflictDoNothing()
        .returning();

    if (inserted.length === 0) return NO_AWARD(totalBefore);

    const awards: XpAward[] = [{ source: "course", source_id: course_id, amount: inserted[0]!.amount }];
    const totalXp = totalBefore + inserted[0]!.amount;
    const levelBefore = levelFromXp(totalBefore);
    const levelAfter = levelFromXp(totalXp);

    await reportAwards({ user_id, course_id, awards, totalXp, levelBefore, levelAfter });

    return { awards, totalXp, levelBefore, levelAfter, batchId: inserted[0]!.id };
}

/**
 * Keeps `course_progress` in step with the ledger.
 *
 * The percentage is now derived from how many lessons were actually completed
 * rather than from the position of the cursor, which is the first time it
 * reflects reality. The cursor itself only ever moves forward, so going back to
 * mop up a skipped lesson doesn't rewind the learner's place.
 *
 * Deliberately does not send the 25/50/75% milestone emails — that lives in
 * `setNextModuleProgress` and duplicating it here would double-send.
 */
async function syncCourseProgress({
    user_id,
    course,
    module_item_id,
}: {
    user_id: string;
    course: NonNullable<Awaited<ReturnType<typeof getCourseAndModule>>>;
    module_item_id: string;
}) {
    const allItems = course.modules.flatMap((m) => m.items);
    if (allItems.length === 0) return;

    const completedIds = await getCompletedItemIds(user_id, course.id);
    const percent = Math.round((completedIds.length / allItems.length) * 100);

    const existing = course.course_progress?.find((cp) => cp.user_id === user_id);
    if (!existing) return;

    const currentIndex = allItems.findIndex((i) => i.id === existing.module_id);
    const awardedIndex = allItems.findIndex((i) => i.id === module_item_id);
    const cursor = awardedIndex > currentIndex ? module_item_id : existing.module_id;

    await db
        .update(course_progress)
        .set({
            module_id: cursor,
            current_progress: Math.max(existing.current_progress ?? 0, percent),
            updated_at: new Date(),
        })
        .where(and(
            eq(course_progress.course_id, course.id),
            eq(course_progress.user_id, user_id),
        ));
}

async function reportAwards({
    user_id,
    course_id,
    awards,
    totalXp,
    levelBefore,
    levelAfter,
}: {
    user_id: string;
    course_id: string;
    awards: XpAward[];
    totalXp: number;
    levelBefore: number;
    levelAfter: number;
}) {
    for (const award of awards) {
        await captureServer("xp_awarded", user_id, {
            source: award.source,
            amount: award.amount,
            total_xp: totalXp,
            level: levelAfter,
            course_id,
        });
    }

    if (levelAfter > levelBefore) {
        await captureServer("level_up", user_id, {
            from: levelBefore,
            to: levelAfter,
            total_xp: totalXp,
        });
    }
}
