import posthog from "posthog-js";

/**
 * Browser analytics init.
 *
 * Next.js runs this after the document loads but before React hydrates, which
 * is early enough to catch the first pageview without needing a provider
 * component in the root layout or the usual `useSearchParams` + Suspense dance.
 * Next warns if this file takes more than 16ms, so it does nothing but `init`.
 *
 * Every feature flag below is set explicitly rather than inherited from
 * PostHog's dated `defaults` snapshot. That snapshot is a moving target: a
 * later SDK bump can switch on session replay or exception capture without any
 * change on our side, which for a checkout flow handling card details is not a
 * surprise worth having.
 */

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Routes whose traffic is the operator's own, not a customer's. Without this
// admin activity inflates every product metric — and there's no role column on
// `user` to filter by after the fact.
const INTERNAL_ROUTES = [
  "/dashboard",
  "/cursosAdmin",
  "/editarCurso",
  "/crearExamen",
];

function isInternalUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const { pathname } = new URL(url, window.location.origin);
    return INTERNAL_ROUTES.some((route) => pathname.startsWith(route));
  } catch {
    return false;
  }
}

if (apiKey) {
  posthog.init(apiKey, {
    // Points at the /rz-ev rewrite in next.config.ts, so ingestion is
    // first-party and survives ad-blockers.
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/rz-ev",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",

    // App Router client-side navigation doesn't reload the page, so pageviews
    // have to come off history changes.
    capture_pageview: "history_change",

    // Off deliberately. Autocapture records every click on every element, which
    // produces a large, noisy, hard-to-query dataset and inflates payload size.
    // The events that matter here are named explicitly at their call sites.
    autocapture: false,

    // Off: not worth the extra CDN-fetched recorder script, and it would record
    // users typing personal details on the checkout pages.
    disable_session_recording: true,
    disable_surveys: true,
    capture_heatmaps: false,
    capture_exceptions: false,

    // Anonymous visitors don't get a person profile until they authenticate,
    // which keeps the billable event volume down.
    person_profiles: "identified_only",

    before_send: (event) => {
      if (!event) return null;
      // Drop admin traffic entirely rather than filtering it in the UI later.
      if (isInternalUrl(event.properties?.$current_url)) return null;
      return event;
    },
  });
}
