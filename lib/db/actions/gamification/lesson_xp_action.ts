"use server";

import { z } from "zod";
import { currentUser } from "@/lib/auth/server";
import { action } from "../safe_action";
import { awardLessonXp } from "./award_xp";

/**
 * The only browser-reachable way into the XP engine.
 *
 * `user_id` comes from the session, never from the request body — the client
 * only says *which lesson*, and `awardLessonXp` verifies that lesson really
 * belongs to a course this user is enrolled in.
 */
export const claimLessonXp = action
    .schema(z.object({
        course_id: z.string().min(1),
        module_item_id: z.string().min(1),
    }))
    .action(async ({ parsedInput: { course_id, module_item_id } }) => {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        return await awardLessonXp({ user_id: user.id, course_id, module_item_id });
    });
