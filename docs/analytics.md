# Analytics (PostHog)

Product analytics runs on PostHog Cloud. The design is **server-first**: the
events that matter — purchases, refunds, enrollments, progress — are emitted
from the server, where they cost nothing in the client bundle, can't be dropped
by an ad-blocker, and can't be forged by a browser. The browser SDK handles only
pageviews and pre-redirect intent.

There are two halves, and they use different credentials:

- **Write** — `posthog-js` in the browser and `posthog-node` on the server, both
  authenticated with the *project* API key.
- **Read** — the `/dashboard` behaviour panel, which queries events back out
  through PostHog's HogQL Query API using a *personal* API key.

## Setup

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...              # project API key; blank disables analytics
NEXT_PUBLIC_POSTHOG_HOST=/rz-ev              # first-party proxy path (see below)
NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
POSTHOG_HOST=https://us.i.posthog.com        # server SDK talks to PostHog directly

POSTHOG_PERSONAL_API_KEY=phx_...             # personal key, scope `query:read`
POSTHOG_PROJECT_ID=12345                     # project settings > project ID
POSTHOG_API_HOST=                            # only off US cloud; see below
```

With `NEXT_PUBLIC_POSTHOG_KEY` unset, both SDKs no-op and the app runs normally.
With the two read variables unset, the dashboard panel renders setup
instructions and everything else on the page is unaffected. Nothing needs to
change to develop without analytics.

The personal API key is **not** the project key. Create it under
*settings → personal API keys*, scope it to `query:read` on the one project, and
keep it server-side — it can read every project the account can reach. Note that
the REST API lives on the app host (`us.posthog.com`), not the ingestion host
(`us.i.posthog.com`); `POSTHOG_API_HOST` only needs setting on EU cloud or
self-hosted.

## Files

| File | Role |
|---|---|
| `lib/analytics/events.ts` | The event taxonomy — every name and payload as a typed union |
| `lib/analytics/server.ts` | `captureServer()`, the server emitter |
| `lib/analytics/client.ts` | `capture()`, `captureBeforeUnload()`, `identify()`, `resetIdentity()` |
| `lib/analytics/query.ts` | `runHogQL()` — the read client, with its TTL cache and failure handling |
| `lib/analytics/insights.ts` | The four dashboard queries and the shapes they return |
| `instrumentation-client.ts` | Browser SDK init (root of the repo) |
| `components/analytics/AnalyticsIdentity.tsx` | Links browser identity to the signed-in user |
| `components/analytics/TrackProductView.tsx` | Fires `product_viewed` from server-rendered pages |
| `components/dashboard/PostHogInsightsLoader.tsx` | Server component: fetches, handles the empty/unconfigured/failed states |
| `components/dashboard/PostHogInsights.tsx` | The panel itself — tiles, traffic chart, funnel, products, friction |

## Adding an event

1. Add the name and its payload to `AnalyticsEventMap` in `lib/analytics/events.ts`.
2. Emit it with `captureServer(name, userId, props)` on the server or
   `capture(name, props)` on the client.

Both are typed against that map, so a typo in the name or a missing property is
a compile error. Don't call `posthog.capture` directly — a taxonomy that drifts
into `purchase_complete` / `purchaseCompleted` variants silently splits a funnel
into three that each look broken.

## Three things that will bite you

**`redirect()` throws.** Next implements it by throwing, and serverless
instances freeze as soon as a response is returned. An event queued before
either one is simply lost. `captureServer` uses `captureImmediate()` and awaits
delivery for exactly this reason — but you must still place the call *before*
the `redirect()`, not after. See `lib/db/actions/courses_progress_actions.ts`.

**MercadoPago checkout leaves the site.** Once the buyer is on MercadoPago's
domain, an abandonment is invisible to us forever. `checkout_started` must fire
before the redirect — via `captureBeforeUnload` (sendBeacon) on the client, or
`captureServer` in the server action. Courses go through
`lib/db/actions/courses/buy_course.ts`; ebooks and programs go through
`BuyProductButton.tsx`. Both are instrumented; a new product type needs the same
treatment.

**PayPal fulfillment runs twice.** The synchronous capture and the webhook both
call `fulfillPaypalPurchase`, which is idempotent on `paypal_<orderId>`.
`purchase_completed` is emitted only on the non-idempotent path
(`alreadyFulfilled === false`), so the sale is booked once. Preserve that guard.

## Deliberate choices

- **Autocapture, session replay, surveys, heatmaps and exception capture are
  all off**, set explicitly rather than via PostHog's dated `defaults` snapshot.
  That snapshot is a moving target — a later SDK bump can switch replay on
  without a code change, which on pages where users type personal details is not
  a surprise worth having. Core posthog-js is ~52KB gzip; replay and surveys are
  lazy-fetched from PostHog's CDN and stay unfetched while disabled.
- **Ingestion is proxied** through `/rz-ev` (rewrites in `next.config.ts`). The
  path is intentionally opaque — blocklists match on `/analytics`, `/track` and
  `/posthog`. Renaming it to something readable defeats the purpose.
  `skipTrailingSlashRedirect: true` is required alongside it.
- **`distinctId` is always the BetterAuth `user.id`**, matching the browser's
  `identify()`, so anonymous browsing stitches to the eventual purchase.
- **Admin traffic is dropped** in `before_send` by URL prefix. There is no role
  column on `user`, so it can't be filtered after the fact. If a role column is
  ever added, switch to filtering on that.
- **`product_viewed` fires client-side**, even though the pages are server
  components. Most product-page traffic is anonymous and a server capture would
  have no distinct ID for it — it would quietly measure only logged-in browsing.
  In grids (ebooks, programs) the tracker is mounted *inside* `DialogContent`,
  which Radix unmounts while closed, so it reports opens rather than
  impressions.

## Reading the results

The headline funnel is:

```
product_viewed → checkout_started → purchase_completed
```

### The dashboard panel

`/dashboard` renders a **Comportamiento** section under the revenue charts,
covering the last 30 days (`WINDOW_DAYS` in `lib/analytics/insights.ts`):

| Block | Reads |
|---|---|
| Tiles | `$pageview` (total and unique people), `lesson_completed`, `video_play`, `course_completed` |
| Tráfico diario | Daily `$pageview` vs `product_viewed` |
| Embudo de compra | The three funnel events by unique person, plus per-rail checkout → purchase conversion |
| Productos más vistos | The funnel events grouped by `product_name` / `product_type` |
| Fricción | `capture_mismatch`, `webhook_signature_invalid`, `webhook_rejected`, `paypal_sdk_load_failed`, `buy_blocked_not_signed_in`, `otp_failed`, `locked_lesson_clicked` |

Four HogQL queries run in parallel behind a `Suspense` boundary, so the panel
streams in after the revenue tiles rather than delaying them.

### Why revenue isn't in the panel

`payment_log` stays the source of truth for money, and PostHog stays the source
of truth for behaviour. Two systems reporting revenue will eventually disagree —
a dropped or ad-blocked event is invisible in PostHog but still a row in the
ledger — and the ledger is the one that has to be right. Purchase *counts* do
appear in the panel, as the closing step of the funnel, where the ratio between
steps is the point rather than the absolute figure.

Ledger revenue is split by currency: ARS and USD are separate figures, because
summing them produces a meaningless number.

### Things to know about the read path

- **Results are cached for 5 minutes** in a module-level map in `query.ts`, not
  in Next's Data Cache — POST fetches aren't stored there anyway. Warm serverless
  instances cover the window an admin actually spends on the page. An operator
  who needs live numbers should use the PostHog UI.
- **Failures are values, not exceptions.** `runHogQL` returns
  `{ ok: false, reason, message }` and the panel renders the message. A PostHog
  outage costs you one section, never the page. Queries abort after 12s.
- **The panel under-reports relative to reality**, and should be read that way.
  Ad-blockers drop browser events, and `before_send` deliberately discards all
  traffic to `/dashboard`, `/cursosAdmin`, `/editarCurso` and `/crearExamen`.
- **Query strings are written in `insights.ts` and nowhere else.** No request
  input is interpolated into HogQL; the only variable, the day window, is an
  integer constant this file owns. Keep it that way — anything dynamic belongs in
  `runHogQL`'s `values` placeholder argument.
- **Adding a metric** means adding the event to `TRACKED_EVENTS` (for the totals
  query) or writing a new query next to the other four, then surfacing it in
  `PostHogInsights.tsx`. Events not listed there aren't scanned at all.
