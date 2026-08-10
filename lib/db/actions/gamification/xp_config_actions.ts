"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { DEFAULT_XP_CONFIG, XP_CONFIG_ID, xp_config, type XpConfig } from "@/lib/db/schema/gamification";
import { currentUser } from "@/lib/auth/server";
import { action } from "../safe_action";

/**
 * Reads the singleton reward config.
 *
 * Falls back to `DEFAULT_XP_CONFIG` instead of throwing when the row is absent,
 * so the whole feature works the moment the migration lands — before anyone has
 * seeded or opened the dashboard.
 */
export async function getXpConfig(): Promise<XpConfig> {
    const rows = await db.select().from(xp_config).where(eq(xp_config.id, XP_CONFIG_ID)).limit(1);
    const existing = rows[0];
    if (existing) return existing;

    return {
        id: XP_CONFIG_ID,
        ...DEFAULT_XP_CONFIG,
        updated_at: null,
    };
}

export const updateXpConfig = action
    .schema(z.object({
        // 0 is allowed on purpose — it's the way to switch a reward off.
        lesson_xp: z.coerce.number().int().min(0).max(100000),
        module_xp: z.coerce.number().int().min(0).max(100000),
        course_xp: z.coerce.number().int().min(0).max(100000),
    }))
    .action(async ({ parsedInput: { lesson_xp, module_xp, course_xp } }) => {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        // Upsert rather than update: the singleton row may never have been
        // seeded, and a silent no-op update would look like a saved change.
        await db
            .insert(xp_config)
            .values({ id: XP_CONFIG_ID, lesson_xp, module_xp, course_xp, updated_at: new Date() })
            .onConflictDoUpdate({
                target: xp_config.id,
                set: { lesson_xp, module_xp, course_xp, updated_at: new Date() },
            });

        revalidatePath("/dashboard/gamificacion");

        return { success: true };
    });
