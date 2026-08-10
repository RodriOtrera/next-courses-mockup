import posthog from "posthog-js";
import type { AnalyticsEventMap } from "./events";

/**
 * Browser-side capture, typed against the same event map the server uses.
 *
 * PostHog is initialized in `instrumentation-client.ts`; this is only a typed
 * wrapper over `posthog.capture`. It no-ops when no key is configured so the
 * app runs fine without analytics set up.
 */
export function capture<E extends keyof AnalyticsEventMap>(
  event: E,
  properties: AnalyticsEventMap[E]
): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.warn(`[analytics] failed to capture "${event}":`, error);
  }
}

/**
 * Capture an event that is immediately followed by a full-page navigation.
 *
 * `BuyProductButton` sends the buyer to MercadoPago via `window.location.href`,
 * which tears down the page before a queued request can leave. PostHog's
 * transport falls back to `sendBeacon` for this, which the browser guarantees
 * to deliver even as the document unloads.
 */
export function captureBeforeUnload<E extends keyof AnalyticsEventMap>(
  event: E,
  properties: AnalyticsEventMap[E]
): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.capture(event, properties, {
      transport: "sendBeacon",
      // Skip the batch queue as well — beacon transport alone doesn't help if
      // the event is still sitting in the queue when the document goes away.
      send_instantly: true,
    });
  } catch (error) {
    console.warn(`[analytics] failed to capture "${event}":`, error);
  }
}

/** Link the current browser identity to a signed-in user. */
export function identify(userId: string, email?: string): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.identify(userId, email ? { email } : undefined);
  } catch {
    // ignore
  }
}

/** Detach the browser identity on sign-out so the next user starts clean. */
export function resetIdentity(): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.reset();
  } catch {
    // ignore
  }
}
