/**
 * Apply a hand-written SQL migration.
 *
 * The routine path is `npm run db:migrate` (drizzle-kit, journal-tracked). This
 * script is the escape hatch for SQL drizzle-kit cannot generate, and it exists
 * rather than `drizzle-kit push` because push is diff-based and prompts
 * interactively before adding a unique constraint to a non-empty table, offering
 * to TRUNCATE it. That prompt cannot be answered safely in a non-interactive
 * shell, and the truncate is never what we want.
 *
 * Two modes:
 *
 *   default   `client.migrate()` — one transaction, wrapped in
 *             `PRAGMA foreign_keys=off/on`. Required for SQLite's table-rebuild
 *             pattern (create-new, copy, drop-old, rename), which is how any
 *             column alteration has to be expressed. A bare `PRAGMA` statement
 *             would not survive on its own here: over Turso's HTTP protocol each
 *             `execute()` may land on a different connection.
 *
 *   --loose   statement-by-statement, skipping "already applied" errors. For
 *             re-runnable migrations written with `IF NOT EXISTS` guards, where
 *             an interrupted run is recovered by running it again.
 *
 *   node --experimental-strip-types --env-file=.env scripts/apply-migration.ts <file.sql> [--loose]
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const args = process.argv.slice(2);
const loose = args.includes("--loose");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
    console.error("usage: apply-migration.ts <path-to-sql> [--loose]");
    process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

const statements = readFileSync(file, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim().replace(/;$/, "").trim())
    .filter(Boolean);

console.log(
    `Applying ${statements.length} statement(s) from ${file}` +
    (loose ? "  [--loose: per-statement, skipping already-applied]" : "") +
    "\n",
);

if (!loose) {
    try {
        await client.migrate(statements);
        for (const statement of statements) {
            console.log(`  ✓ ${statement.replace(/\s+/g, " ").slice(0, 100)}`);
        }
        console.log(`\nDone. ${statements.length} statement(s) applied in one transaction.`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n✗ Migration rolled back — nothing was applied.\n  ${message}`);
        console.error("  If this migration is written to be re-runnable, retry with --loose.");
        process.exit(1);
    }
    process.exit(0);
}

let applied = 0;
let skipped = 0;

for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 100);
    try {
        await client.execute(statement);
        applied++;
        console.log(`  ✓ ${preview}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Re-runnability: these mean the statement's effect is already present.
        // SQLite has no `ADD COLUMN IF NOT EXISTS`, so "duplicate column name"
        // is the normal outcome of re-applying an ALTER TABLE.
        if (/already exists|duplicate column name|duplicate/i.test(message)) {
            skipped++;
            console.log(`  · ${preview}\n      already applied — skipping`);
            continue;
        }
        console.error(`  ✗ ${preview}\n      ${message}`);
        process.exit(1);
    }
}

console.log(`\nDone. ${applied} applied, ${skipped} already present.`);
