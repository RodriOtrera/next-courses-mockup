import { NextRequest, NextResponse } from "next/server";
import { reconcileSegment } from "@/lib/email/segments";
import { broadcastCohortValues } from "@/lib/db/schema/email_consent";

/**
 * Keeps the Resend segments matching the consent table.
 *
 * Membership drifts constantly and for reasons Resend cannot see: a learner
 * buys a course and joins `usersWithCourses`, a coaching subscription lapses, a
 * contact mirror failed during a Resend outage. None of that reaches Resend on
 * its own, because `segments.create()` accepts no filter rules — segments are
 * static lists that something has to push into.
 *
 * `sendBroadcast` also reconciles the one cohort it is about to mail, so this
 * sweep is not on the critical path for correctness. It exists so the recipient
 * counts an operator sees before composing are already right, and so a
 * long-failed mirror repairs itself without anyone noticing.
 *
 * Schedule it in `vercel.json`:
 *
 *   { "crons": [{ "path": "/api/cron/email-sync", "schedule": "0 * * * *" }] }
 *
 * Hourly, not per-minute: each run is O(contacts) API calls at 2 requests per
 * second, so a tighter schedule would overlap itself and burn rate limit for no
 * gain.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Leave room to serialise a response before the platform kills the function. */
const TIME_BUDGET_MS = 50_000;

/** `test` resolves to the admin allowlist and needs no segment upkeep. */
const SYNCED_COHORTS = broadcastCohortValues.filter((cohort) => cohort !== "test");

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Mandatory, unlike `/api/cron/captions` which skips its check when unset.
  // This endpoint drives outbound mail; an open one is worth more to an
  // attacker than a caption sweep.
  if (!secret) {
    console.error("[email-sync] CRON_SECRET is not set; rejecting");
    return NextResponse.json({ message: "Cron not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const deadline = Date.now() + TIME_BUDGET_MS;
  const shouldStop = () => Date.now() > deadline;

  const results = [];
  for (const cohort of SYNCED_COHORTS) {
    if (shouldStop()) break;
    try {
      results.push(await reconcileSegment(cohort, { shouldStop }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[email-sync] ${cohort} failed: ${message}`);
      results.push({ cohort, error: message });
    }
  }

  // Always 200: a partial sweep is normal — the budget is expected to cut long
  // runs short, and the next tick resumes from wherever this one stopped.
  // Returning 500 would only produce a retry storm against the same rate limit.
  return NextResponse.json({ ok: true, results });
}

export { handler as GET, handler as POST };
