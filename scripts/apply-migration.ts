/**
 * Apply a generated drizzle SQL migration statement-by-statement.
 *
 * Why this exists rather than `drizzle-kit push`: push is diff-based and
 * prompts interactively before adding a unique constraint to a non-empty table,
 * offering to TRUNCATE it. That prompt cannot be answered safely in a
 * non-interactive shell, and the truncate is never what we want. Applying the
 * reviewed SQL from `drizzle/` directly is deterministic and auditable.
 *
 * The Neon HTTP driver has no transactions, so statements are applied one at a
 * time. Each DDL statement is individually atomic in Postgres, and every
 * migration in this project is written to be re-runnable, so an interrupted run
 * is recovered by simply running it again.
 *
 *   node --experimental-strip-types --env-file=.env scripts/apply-migration.ts <file.sql>
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) {
    console.error("usage: apply-migration.ts <path-to-sql>");
    process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(url);

const statements = readFileSync(file, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim().replace(/;$/, "").trim())
    .filter(Boolean);

console.log(`Applying ${statements.length} statement(s) from ${file}\n`);

let applied = 0;
let skipped = 0;

for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 100);
    try {
        await sql.query(statement);
        applied++;
        console.log(`  ✓ ${preview}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Re-runnability: these mean the statement's effect is already present.
        if (/already exists|duplicate/i.test(message)) {
            skipped++;
            console.log(`  · ${preview}\n      already applied — skipping`);
            continue;
        }
        console.error(`  ✗ ${preview}\n      ${message}`);
        process.exit(1);
    }
}

console.log(`\nDone. ${applied} applied, ${skipped} already present.`);
