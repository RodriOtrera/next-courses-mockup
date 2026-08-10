import "server-only";

import { PostHog } from "posthog-node";
import type { AnalyticsEventMap } from "./events";

/**
 * Server-side analytics.
 *
 * This is where the events that actually matter get emitted — purchases,
 * refunds, enrollments, progress. Doing it here rather than in the browser
 * means ad-blockers can't drop them, clients can't forge them, and the client
 * bundle pays nothing.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. Analytics must never break a payment. Every capture is wrapped in
 *     try/catch and swallows its error.
 *  2. Events must survive `redirect()`. Next's `redirect()` works by throwing,
 *     and serverless functions freeze the moment a response is returned, so a
 *     batched event queued before either one is simply lost. We use
 *     `captureImmediate()` (awaited) rather than `capture()` + a later flush,
 *     which removes that whole class of bug at the cost of one HTTP round-trip.
 */

/**
 * Distinct ID for events with no trustworthy user attached — chiefly webhook
 * signature failures, where the only identity on offer comes from the very
 * payload that failed verification. Attributing those to the claimed user would
 * let anyone forge events against an arbitrary account.
 */
export const SYSTEM_DISTINCT_ID = "system:server";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let client: PostHog | null = null;

function getClient(): PostHog | null {
  // No key configured — analytics is simply off and the app runs normally.
  if (!apiKey) return null;

  if (!client) {
    client = new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Nothing should sit in a queue: serverless instances get frozen without
      // warning, and a queued event is a lost event.
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return client;
}

/**
 * Capture a server-side event. Never throws.
 *
 * `distinctId` must be the BetterAuth `user.id` — the same value the browser
 * SDK passes to `identify()` — so anonymous browsing stitches to the purchase.
 */
export async function captureServer<E extends keyof AnalyticsEventMap>(
  event: E,
  distinctId: string,
  properties: AnalyticsEventMap[E]
): Promise<void> {
  const posthog = getClient();
  if (!posthog) return;

  try {
    await posthog.captureImmediate({
      distinctId,
      event,
      properties: { ...properties, $lib: "server" },
    });
  } catch (error) {
    // Deliberately swallowed. A dropped analytics event is an acceptable
    // outcome; a payment webhook returning 500 because PostHog was down is not.
    console.warn(`[analytics] failed to capture "${event}":`, error);
  }
}

/**
 * Flush and close the client. Only needed for long-lived processes — the
 * request paths in this app use `captureServer`, which already awaits delivery.
 */
export async function shutdownAnalytics(): Promise<void> {
  if (!client) return;
  try {
    await client.shutdown(2000);
  } catch {
    // ignore
  }
}
