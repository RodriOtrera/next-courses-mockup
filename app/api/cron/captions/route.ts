import { NextRequest, NextResponse } from "next/server";
import { sweepPendingCaptions } from "@/lib/mux/caption_pipeline";

/**
 * Finishes caption work whose browser tab is gone.
 *
 * Subtitles take minutes: Mux transcribes after ingest, then each Robots
 * translation job runs, then the text track it attaches has to become playable.
 * A creator who uploads and navigates away would otherwise strand every one of
 * those half-done. This sweep is what makes the pipeline durable — the browser
 * poll only exists to make it *feel* fast while someone is watching.
 *
 * Both drive the same idempotent `advanceCaptions`, so overlapping with an open
 * tab is harmless.
 *
 * Schedule it in `vercel.json`:
 *
 *   { "crons": [{ "path": "/api/cron/captions", "schedule": "* * * * *" }] }
 *
 * Vercel signs its own cron invocations with `CRON_SECRET`; the same header
 * works from any external scheduler.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sweepPendingCaptions();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // A failed sweep is not worth a retry storm: whatever it missed is still
    // unfinished, and the next tick picks it up.
    console.warn(
      `[captions] sweep failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
