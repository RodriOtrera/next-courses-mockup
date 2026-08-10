/**
 * URL slug generation for course pages.
 *
 * Pure — no DB import — so the backfill script, server actions and (if ever
 * needed) a client-side preview can all share one implementation. The DB is
 * deliberately not the source of truth for this algorithm: a PL/pgSQL twin
 * would need the `unaccent` extension and would drift the first time anyone
 * tweaked the rules here.
 */

export const SLUG_MAX_LENGTH = 60;

export const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Slugs that would collide with a sibling route if one is ever added under /cursos. */
const RESERVED = new Set([
    "new", "nuevo", "admin", "api", "sitemap", "robots", "index",
]);

/**
 * Characters NFD cannot decompose, mapped before normalization.
 * Spanish needs almost none of these, but `&` is worth it: "Fuerza & Movilidad"
 * reads better as `fuerza-y-movilidad` than `fuerza-movilidad`.
 */
const PRE_MAP: Array<[RegExp, string]> = [
    [/&/g, " y "],
    [/\+/g, " mas "],
    [/%/g, " por ciento "],
    [/ß/g, "ss"],
    [/æ/gi, "ae"],
    [/œ/gi, "oe"],
    [/ø/gi, "o"],
    [/đ/gi, "d"],
    [/ł/gi, "l"],
];

/**
 * Fold arbitrary title text into a URL-safe slug.
 *
 * Accent folding is done by NFD-decomposing and stripping the combining marks,
 * which covers every accent Spanish uses (á→a, é→e, ü→u) including ñ→n.
 *
 * Known, accepted lossiness: ñ→n means "año" and "ano" produce the same base
 * slug. WordPress, Django and every mainstream slugifier behave identically and
 * Spanish SEO tooling expects it. `uniqueSlug` degrades the collision to `-2`
 * rather than corrupting anything, so this is safe rather than merely tolerated.
 */
export function slugify(input: string): string {
    let s = String(input ?? "").trim();

    for (const [pattern, replacement] of PRE_MAP) s = s.replace(pattern, replacement);

    // Apostrophes vanish with no separator, so "d'oro" is `doro`, not `d-oro`.
    s = s.replace(/['’`]/g, "");

    s = s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks (U+0300..U+036F)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // runs collapse to a single hyphen
        .replace(/^-+|-+$/g, "");

    // Truncate on a word boundary rather than mid-word.
    if (s.length > SLUG_MAX_LENGTH) {
        s = s.slice(0, SLUG_MAX_LENGTH).replace(/-[^-]*$/, "").replace(/-+$/g, "");
    }

    // An empty slug would resolve to `/cursos/`, which is a different route shape.
    if (s === "") return "curso";

    // A title like "e9265935 b623 41c6 adb7 a48403646c01" would otherwise slugify
    // into something the legacy-UUID redirect detector misreads as an old id.
    if (UUID_RE.test(s)) return `curso-${s}`;

    if (RESERVED.has(s)) return `${s}-curso`;

    return s;
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
}

/**
 * Find a slug for `title` that `isTaken` reports as free.
 *
 * Numeric suffixes rather than random ones: `entrenamiento-calistenia-2` keeps
 * every keyword, whereas `entrenamiento-calistenia-a3f9k1` reads as machine
 * output and burns URL real estate.
 *
 * This probe loop is best-effort only. The `courses_slug_unique` constraint is
 * the actual arbiter — the Neon HTTP driver has no transactions, so there is a
 * genuine TOCTOU window between "is it taken?" and the write. Callers must
 * catch Postgres 23505 and retry with an id-derived suffix, which cannot collide.
 */
export async function uniqueSlug(
    title: string,
    isTaken: (candidate: string) => Promise<boolean>,
    opts: { fallbackSuffix?: string; maxProbes?: number } = {},
): Promise<string> {
    const base = slugify(title);
    if (!(await isTaken(base))) return base;

    const maxProbes = opts.maxProbes ?? 50;
    for (let i = 2; i <= maxProbes; i++) {
        const candidate = `${base}-${i}`;
        if (!(await isTaken(candidate))) return candidate;
    }

    return `${base}-${opts.fallbackSuffix ?? randomSuffix()}`;
}
