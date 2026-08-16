# Database (Turso / libSQL)

Drizzle ORM over Turso. Dev and prod both point at the remote database — there is
no local file.

## First-time setup

Install the CLI:

```powershell
irm https://raw.githubusercontent.com/tursodatabase/turso-cli/main/install.ps1 | iex
```

Create the database and mint a token:

```bash
turso auth login
turso db create <db-name>
turso db show <db-name> --url        # -> DATABASE_URL
turso db tokens create <db-name>     # -> DATABASE_AUTH_TOKEN
```

Put both in `.env` (and in the Vercel project env):

```
DATABASE_URL=libsql://<db-name>-<org>.turso.io
DATABASE_AUTH_TOKEN=<token>
```

Create the tables:

```bash
npm run db:migrate
```

## Everyday commands

```bash
npm run db:generate    # schema changed -> write a new migration to drizzle/
npm run db:migrate     # apply pending migrations
npm run db:studio      # browse the data
```

```bash
turso db shell <db-name>             # interactive SQL
turso db shell <db-name> ".tables"   # one-off
```

Schema changes go **generate → review the SQL → migrate**. Don't use
`npm run db:push` against a real database: it is diff-based and mishandles
dropping and recreating named unique indexes on Turso. Four of those indexes are
the app's only concurrency primitive (`xp_ledger_award_idx`,
`email_consent_email_idx`, `video_tracks_item_language_idx`,
`courses_slug_unique`), so losing one turns "XP is awarded once" into "XP is
awarded twice". Keep `db:push` for throwaway scratch databases only.

## Escape hatches

```bash
npm run db:apply drizzle/some-hand-written.sql          # one transaction
npm run db:apply drizzle/some-hand-written.sql --loose  # per-statement, skips already-applied
npm run db:backfill-slugs                               # dry run
npm run db:backfill-slugs -- --apply                    # writes
```

## Notes

- **Timestamps** are `integer({ mode: 'timestamp' })` — unix **seconds**, mapped
  to JS `Date` by Drizzle. Never use sqlite-core's deprecated `.defaultNow()`:
  it emits milliseconds and would land every default-created row in the year
  58000. Use `.default(sql\`(unixepoch())\`)`.
- **Booleans** are `integer({ mode: 'boolean' })`, **JSON** is
  `text({ mode: 'json' })`. Both keep their TypeScript types.
- **`lib/db/index.ts` builds the client lazily**, on first property access. Don't
  move `createClient` to module scope — `next build` imports every module with no
  runtime env and would fail.
- **Foreign keys** (`onDelete: 'cascade' | 'set null'`) are only enforced while
  `PRAGMA foreign_keys` is on. Turso enables it per connection by default, but it
  is a runtime pragma, not a schema-level guarantee like Postgres's.
- `npm run auth:schema` writes to `auth_schema.generated.ts` (gitignored), not to
  `auth_schema.ts`. Diff it by hand — the live file carries relations and a
  `users` alias the CLI knows nothing about.
- The pre-Turso Postgres migrations are kept for reference in
  `drizzle/_postgres_archive/`.
