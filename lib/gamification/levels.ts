/**
 * The level curve. Pure arithmetic — no DB, no server imports — so it can run
 * in the browser (the dashboard previews the curve live as the admin types) and
 * on the server (award-time level-up detection) from the same source.
 *
 * Cumulative XP to reach level L:
 *
 *     totalXpForLevel(L) = 25 · L · (L − 1)
 *
 * Equivalently: every level costs 50 XP more than the one before it (L2 costs
 * 50, L3 costs 100, L4 costs 150…). The classic triangular curve — quick early
 * levels, smoothly decelerating, no ceiling — and it inverts in closed form, so
 * `levelFromXp` is O(1) instead of a loop over levels.
 *
 * Calibrated against the default rewards (lesson 10 / module 50 / course 200)
 * and a representative 5-module × 6-lesson course worth ~750 XP:
 *
 *   L2  @    50  — five lessons, i.e. inside the first sitting
 *   L3  @   150  — first module finished
 *   L6  @   750  — one full course
 *   L10 @  2250  — three courses
 *   L20 @  9500  — thirteen courses
 *
 * Changing the reward amounts in the dashboard reshapes how fast learners move
 * along this curve, which is the intended tuning knob. The curve itself stays
 * fixed so the shape of the progression stays predictable.
 */

/** How much more each level costs than the previous one. */
export const XP_LEVEL_STEP = 50;
const HALF_STEP = XP_LEVEL_STEP / 2; // 25

export interface LevelTier {
    /** First level in this tier. */
    minLevel: number;
    name: string;
}

export const LEVEL_TIERS: LevelTier[] = [
    { minLevel: 1, name: "Aprendiz" },
    { minLevel: 5, name: "Estudiante" },
    { minLevel: 10, name: "Practicante" },
    { minLevel: 15, name: "Experto" },
    { minLevel: 20, name: "Maestro" },
];

/** Total XP needed to have reached `level`. Level 1 starts at 0. */
export function totalXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return HALF_STEP * level * (level - 1);
}

/** XP required to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
    return totalXpForLevel(level + 1) - totalXpForLevel(level);
}

export function tierForLevel(level: number): string {
    // Walk backwards to the first tier the level clears.
    for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
        const tier = LEVEL_TIERS[i]!;
        if (level >= tier.minLevel) return tier.name;
    }
    return LEVEL_TIERS[0]!.name;
}

/**
 * Inverse of `totalXpForLevel`: solve 25·L² − 25·L − xp = 0 for L and floor it.
 *
 * `Math.sqrt` is not exact at large perfect squares, which is precisely where
 * level boundaries sit, so the closed form can land one off. The two loops walk
 * it back onto the integer boundary; each runs at most once in practice.
 */
export function levelFromXp(xp: number): number {
    if (!Number.isFinite(xp) || xp <= 0) return 1;

    let level = Math.floor((1 + Math.sqrt(1 + (4 * xp) / HALF_STEP)) / 2);
    if (level < 1) level = 1;

    while (totalXpForLevel(level + 1) <= xp) level++;
    while (level > 1 && totalXpForLevel(level) > xp) level--;

    return level;
}

export interface LevelProgress {
    level: number;
    tier: string;
    totalXp: number;
    /** XP earned since reaching the current level. */
    xpIntoLevel: number;
    /** Size of the current level's band, i.e. what a full bar represents. */
    xpForThisLevel: number;
    /** XP still needed to reach the next level. */
    xpRemaining: number;
    /** 0–100, how far through the current level the learner is. */
    pct: number;
}

/** Everything a progress bar needs, derived from a raw XP total. */
export function levelProgress(totalXp: number): LevelProgress {
    const xp = Number.isFinite(totalXp) && totalXp > 0 ? Math.floor(totalXp) : 0;
    const level = levelFromXp(xp);
    const floor = totalXpForLevel(level);
    const xpForThisLevel = xpToNextLevel(level);
    const xpIntoLevel = xp - floor;

    return {
        level,
        tier: tierForLevel(level),
        totalXp: xp,
        xpIntoLevel,
        xpForThisLevel,
        xpRemaining: Math.max(0, xpForThisLevel - xpIntoLevel),
        pct: xpForThisLevel > 0
            ? Math.min(100, Math.round((xpIntoLevel / xpForThisLevel) * 100))
            : 0,
    };
}

/** The first `count` level thresholds — used by the dashboard curve preview. */
export function levelTable(count: number): { level: number; totalXp: number; tier: string }[] {
    return Array.from({ length: count }, (_, i) => {
        const level = i + 1;
        return { level, totalXp: totalXpForLevel(level), tier: tierForLevel(level) };
    });
}
