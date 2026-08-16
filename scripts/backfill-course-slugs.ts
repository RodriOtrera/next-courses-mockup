/**
 * Assign a URL slug to every course that doesn't have one.
 *
 * This is not a historical one-off: this repo is a white-label base redeployed
 * per client, so "point at a client's existing database and assign slugs" is a
 * step in the deployment runbook. Written to be safely re-runnable.
 *
 * Why a script rather than SQL: SQLite has no accent-folding of its own, so a
 * pure-SQL implementation would be a second copy of the algorithm in
 * `lib/utils/slug.ts` — guaranteed to drift. Reusing slugify() keeps one source
 * of truth.
 *
 * Why not lazy-on-read: the sitemap and the statically-prerendered /courses
 * list need slugs to exist *before* a crawler arrives. Generating them on first
 * page view means the sitemap is empty until a human visits each course, and
 * the build bakes `undefined` into every href.
 *
 *   npm run db:backfill-slugs            # dry run, prints the plan
 *   npm run db:backfill-slugs -- --apply # writes
 */
import { createClient } from "@libsql/client";
import { slugify, uniqueSlug } from "../lib/utils/slug.ts";

const apply = process.argv.includes("--apply");

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

type Row = { id: string; title: string; slug: string | null };

// ORDER BY id is load-bearing: it makes suffix assignment (-2 vs -3)
// deterministic, so staging and production derive identical URLs for the same
// set of courses. Non-deterministic ordering would silently diverge them.
const rows = (await client.execute(
    "SELECT id, title, slug FROM courses ORDER BY id",
)).rows as unknown as Row[];

const taken = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s));
const pending = rows.filter((r) => !r.slug);

console.log(
    `${rows.length} course(s); ${taken.size} already slugged, ${pending.length} to assign.` +
    (apply ? "" : "  [DRY RUN — pass --apply to write]"),
);

if (pending.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
}

const isTaken = async (candidate: string) => {
    if (taken.has(candidate)) return true;
    const hit = await client.execute({
        sql: "SELECT 1 FROM courses WHERE slug = ? LIMIT 1",
        args: [candidate],
    });
    return hit.rows.length > 0;
};

let written = 0;
let raced = 0;

for (const row of pending) {
    // `title` is NOT NULL but createCourse writes `formData.get('title')` with
    // no validation, so "" and "   " are both reachable. slugify() returns
    // "curso" for those and the uniquifier disambiguates.
    const slug = await uniqueSlug(row.title, isTaken, {
        fallbackSuffix: row.id.slice(0, 8),
    });
    taken.add(slug);

    const label = `${row.id}  ${JSON.stringify(row.title)}`;
    if (!apply) {
        console.log(`  would set  ${label}\n             -> ${slug}`);
        continue;
    }

    try {
        // `AND slug IS NULL` is what makes re-runs safe — if a concurrent run
        // already assigned one, we must not clobber what may be a live URL.
        const res = await client.execute({
            sql: "UPDATE courses SET slug = ? WHERE id = ? AND slug IS NULL RETURNING slug",
            args: [slug, row.id],
        });
        if (res.rows.length === 0) {
            raced++;
            taken.delete(slug);
            console.log(`  · ${label}\n    already had a slug — skipped`);
            continue;
        }
        written++;
        console.log(`  ✓ ${label}\n    -> ${slug}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // The unique index is the real arbiter. With no transactions there is a
        // TOCTOU window between the probe and the write; the id-derived suffix
        // cannot collide, so one retry suffices.
        if (/UNIQUE constraint failed|duplicate key|23505/i.test(message)) {
            const fallback = `${slugify(row.title)}-${row.id.slice(0, 8)}`;
            await client.execute({
                sql: "UPDATE courses SET slug = ? WHERE id = ? AND slug IS NULL",
                args: [fallback, row.id],
            });
            taken.add(fallback);
            written++;
            console.log(`  ✓ ${label}\n    -> ${fallback}  (collision fallback)`);
            continue;
        }
        console.error(`  ✗ ${label}\n    ${message}`);
        process.exit(1);
    }
}

if (!apply) {
    console.log("\nDry run complete. Re-run with --apply to write these slugs.");
    process.exit(0);
}

const [{ count }] = (await client.execute(
    "SELECT count(*) AS count FROM courses WHERE slug IS NULL",
)).rows as unknown as [{ count: number }];

console.log(`\n${written} written, ${raced} skipped. ${count} row(s) still without a slug.`);

if (count > 0) {
    console.error("Backfill incomplete — do not apply the NOT NULL migration yet.");
    process.exit(1);
}
