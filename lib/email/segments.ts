import { and, eq, exists, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth_schema";
import { email_consent, type BroadcastCohort } from "@/lib/db/schema/email_consent";
import { usersToCourses } from "@/lib/db/schema/users_to_courses";
import { payments_on_users_ebooks } from "@/lib/db/schema/ebook_schema";
import { payments_on_users_program } from "@/lib/db/schema/program_schema";
import { subscription } from "@/lib/db/schema/subscrition_schema";
import { SITE } from "@/lib/seo/site";
import { adminEmails } from "@/lib/auth/admin";
import { getResend, unwrap } from "./resend";
import { throttledMap } from "./throttle";

/**
 * Cohort → recipient resolution, and the sync that mirrors a cohort into a
 * Resend segment.
 *
 * Two facts drive the design:
 *
 *  1. `segments.create()` accepts only `{ name }` — the SDK exposes no filter
 *     rules (verified against resend@6.12.2). Dynamic segments exist only in the
 *     dashboard, so membership has to be pushed from here, explicitly.
 *  2. Cohorts are derived from joins across `usersToCourses`, the two payment
 *     ownership tables and `subscriptions`. Resend cannot see any of that, so
 *     the database stays authoritative and Resend is a mirror we reconcile.
 */

export interface CohortDefinition {
  /** Operator-facing label, shown in the composer. */
  label: string;
  description: string;
}

export const COHORTS: Record<BroadcastCohort, CohortDefinition> = {
  allUsers: {
    label: "Todos los suscriptores",
    description: "Todas las personas que confirmaron recibir novedades, tengan cuenta o no.",
  },
  usersWithCourses: {
    label: "Con cursos",
    description: "Suscriptores confirmados que tienen al menos un curso.",
  },
  usersWithEbookProgram: {
    label: "Con ebook o programa",
    description: "Suscriptores confirmados que compraron un ebook o un programa.",
  },
  usersWithCoaching: {
    label: "Con coaching activo",
    description: "Suscriptores confirmados con una suscripcion de coaching activa.",
  },
  test: {
    label: "Prueba (solo admins)",
    description: "Las direcciones de ADMIN_EMAILS. No pasa por el registro de consentimiento.",
  },
};

/** Resend segment name for a cohort, namespaced so several deployments can
 * share one Resend account without colliding. */
function segmentName(cohort: BroadcastCohort): string {
  return `${SITE.shortName} · ${cohort}`;
}

export interface Recipient {
  email: string;
  /** Feeds Resend's `first_name`, which powers `{{{contact.first_name|hola}}}`. */
  firstName: string | null;
}

/** `"Ada Lovelace"` → `"Ada"`. Resend stores given/family separately. */
function firstNameOf(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

/**
 * The consent gate. Every cohort below is built on top of this predicate, and
 * nothing in this module may query recipients without it.
 */
const isConfirmed = eq(email_consent.status, "confirmed");

/**
 * Correlated `EXISTS (...)` against `email_consent.user_id` — the whole cohort
 * stays one indexed query, with no round trip to collect ids and no `inArray`
 * list that grows with the user base.
 *
 * Built inside functions rather than at module scope on purpose: `db` is a lazy
 * Proxy that resolves `DATABASE_URL` on first property access, and `next build`
 * imports every module with no runtime env, so a top-level `db.select()` would
 * fail the build.
 */
const hasCourse = () =>
  exists(
    db
      .select({ ok: sql`1` })
      .from(usersToCourses)
      .where(eq(usersToCourses.user_id, email_consent.user_id)),
  );

const hasEbook = () =>
  exists(
    db
      .select({ ok: sql`1` })
      .from(payments_on_users_ebooks)
      .where(eq(payments_on_users_ebooks.user_id, email_consent.user_id)),
  );

const hasProgram = () =>
  exists(
    db
      .select({ ok: sql`1` })
      .from(payments_on_users_program)
      .where(eq(payments_on_users_program.user_id, email_consent.user_id)),
  );

const hasActiveCoaching = () =>
  exists(
    db
      .select({ ok: sql`1` })
      .from(subscription)
      .where(and(eq(subscription.userId, email_consent.user_id), eq(subscription.active, true))),
  );

/**
 * Everyone who should receive a broadcast for `cohort`, right now.
 *
 * `test` is the one cohort that does not read `email_consent`: it resolves to
 * `ADMIN_EMAILS`, i.e. addresses belonging to the people operating the site.
 * Every other cohort is gated on confirmed consent, and adding one that is not
 * would defeat the entire point of this module.
 */
export async function cohortRecipients(cohort: BroadcastCohort): Promise<Recipient[]> {
  if (cohort === "test") {
    return adminEmails().map((email) => ({ email, firstName: null }));
  }

  const predicate =
    cohort === "usersWithCourses"
      ? and(isConfirmed, hasCourse())
      : cohort === "usersWithEbookProgram"
        ? and(isConfirmed, or(hasEbook(), hasProgram()))
        : cohort === "usersWithCoaching"
          ? and(isConfirmed, hasActiveCoaching())
          : isConfirmed;

  const rows = await db
    .select({ email: email_consent.email, name: users.name })
    .from(email_consent)
    // LEFT, not INNER: footer subscribers have no account and must still receive
    // the newsletter they signed up for.
    .leftJoin(users, eq(users.id, email_consent.user_id))
    .where(predicate);

  return rows.map((row) => ({ email: row.email, firstName: firstNameOf(row.name) }));
}

/** Recipient count without materialising the addresses — for the composer's
 * live "this will reach N people" readout. */
export async function cohortRecipientCount(cohort: BroadcastCohort): Promise<number> {
  return (await cohortRecipients(cohort)).length;
}

/**
 * Resolve the Resend segment id for a cohort, creating the segment on first use.
 *
 * Looked up by name rather than configured through env so that adding a cohort
 * costs no deployment change, and a fresh Resend account bootstraps itself.
 * Memoised per process; segment ids never change.
 */
const segmentIdCache = new Map<BroadcastCohort, string>();

export async function ensureSegment(cohort: BroadcastCohort): Promise<string> {
  const cached = segmentIdCache.get(cohort);
  if (cached) return cached;

  const resend = getResend();
  const name = segmentName(cohort);

  // Paginate rather than checking only the first page: a miss here does not
  // fail loudly, it creates a *second* segment with the same name and starts
  // mailing half the audience. Bounded at 20 pages × 100.
  let after: string | undefined;
  for (let page = 0; page < 20; page++) {
    const existing = await unwrap(
      resend.segments.list({ limit: 100, ...(after ? { after } : {}) }),
      "segments.list",
    );
    const match = existing.data.find((segment) => segment.name === name);
    if (match) {
      segmentIdCache.set(cohort, match.id);
      return match.id;
    }
    if (!existing.has_more || existing.data.length === 0) break;
    after = existing.data[existing.data.length - 1].id;
  }

  const created = await unwrap(resend.segments.create({ name }), `segments.create(${name})`);
  segmentIdCache.set(cohort, created.id);
  return created.id;
}

/** Every contact currently in a segment, following the cursor to the end. */
async function listSegmentContacts(segmentId: string) {
  const resend = getResend();
  const all: { id: string; email: string }[] = [];
  let after: string | undefined;

  // Bounded so a pagination bug can never spin forever: 100 pages × 100 = 10k.
  for (let page = 0; page < 100; page++) {
    const result = await unwrap(
      resend.contacts.list({ segmentId, limit: 100, ...(after ? { after } : {}) }),
      "contacts.list",
    );
    all.push(...result.data.map((c) => ({ id: c.id, email: c.email.toLowerCase() })));
    if (!result.has_more || result.data.length === 0) break;
    after = result.data[result.data.length - 1].id;
  }

  return all;
}

export interface ReconcileResult {
  cohort: BroadcastCohort;
  segmentId: string;
  /** Recipients the cohort resolves to right now. */
  desired: number;
  added: number;
  removed: number;
  /** Non-zero when a time budget cut the run short; the next run resumes. */
  remaining: number;
}

/**
 * Push a cohort's current membership into its Resend segment.
 *
 * Diff-based rather than "wipe and re-add": removals are what keep an
 * unsubscribed address out of the next send, and re-adding thousands of
 * unchanged contacts at 2 rps would take longer than the function may run.
 *
 * `contacts.segments.add` also creates the contact when it does not exist yet,
 * so this doubles as the backfill for anyone whose confirm-time mirror failed.
 */
export async function reconcileSegment(
  cohort: BroadcastCohort,
  options: { shouldStop?: () => boolean } = {},
): Promise<ReconcileResult> {
  const resend = getResend();
  const segmentId = await ensureSegment(cohort);

  const desired = await cohortRecipients(cohort);
  const desiredByEmail = new Map(desired.map((r) => [r.email.toLowerCase(), r]));

  const current = await listSegmentContacts(segmentId);
  const currentEmails = new Set(current.map((c) => c.email));

  const toAdd = [...desiredByEmail.keys()].filter((email) => !currentEmails.has(email));
  const toRemove = current.filter((c) => !desiredByEmail.has(c.email));

  // Removals first: the cost of leaving someone in one send too long is a
  // complaint, while adding them a run late is invisible.
  const removed = await throttledMap(
    toRemove,
    (contact) =>
      unwrap(
        resend.contacts.segments.remove({ email: contact.email, segmentId }),
        `contacts.segments.remove(${contact.email})`,
      ),
    options,
  );

  const added = await throttledMap(
    toAdd,
    (email) =>
      unwrap(
        resend.contacts.segments.add({ email, segmentId }),
        `contacts.segments.add(${email})`,
      ),
    options,
  );

  return {
    cohort,
    segmentId,
    desired: desired.length,
    added: added.results.length,
    removed: removed.results.length,
    remaining: removed.remaining + added.remaining,
  };
}
