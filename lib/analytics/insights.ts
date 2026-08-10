import "server-only";

import {
  isQueryApiConfigured,
  runHogQL,
  toNumber,
  toText,
  type HogQLRow,
} from "./query";

/**
 * The queries behind the dashboard's PostHog panel.
 *
 * Scope note: this panel reports *behaviour* — traffic, funnel, engagement,
 * friction. Revenue stays on `DashboardStats` / `DashboardCharts`, which read
 * `payment_log`. Two systems reporting money would eventually disagree (an
 * ad-blocked or dropped event is invisible here but still a row in the ledger),
 * and the ledger is the one that has to be right. Purchase *counts* appear here
 * only as the closing step of the funnel, where the ratio is the point.
 */

/** Reporting window. Long enough to have shape, short enough to stay current. */
export const WINDOW_DAYS = 30;

/** Inlined into SQL, so it must be an integer this file controls — never input. */
const WINDOW = Math.trunc(WINDOW_DAYS);

const SINCE = `timestamp >= now() - INTERVAL ${WINDOW} DAY`;

export interface EventStat {
  event: string;
  total: number;
  people: number;
}

export interface DailyPoint {
  label: string;
  pageviews: number;
  views: number;
  checkouts: number;
  purchases: number;
}

export interface ProductRow {
  product: string;
  type: string;
  views: number;
  checkouts: number;
  purchases: number;
}

export interface RailRow {
  rail: string;
  started: number;
  completed: number;
}

export interface FunnelStep {
  label: string;
  people: number;
  events: number;
}

export interface FrictionRow {
  label: string;
  total: number;
  severity: "warn" | "error";
}

export interface DashboardInsights {
  windowDays: number;
  totals: Record<string, EventStat>;
  funnel: FunnelStep[];
  daily: DailyPoint[];
  products: ProductRow[];
  rails: RailRow[];
  friction: FrictionRow[];
  /** True when PostHog answered but has no events in the window yet. */
  empty: boolean;
}

export type InsightsResult =
  | { ok: true; data: DashboardInsights }
  | { ok: false; reason: "not_configured" | "failed"; message: string };

/** Every event the panel reads. Kept explicit so the scan stays bounded. */
const TRACKED_EVENTS = [
  "$pageview",
  "product_viewed",
  "checkout_started",
  "purchase_completed",
  "refund_processed",
  "buy_blocked_not_signed_in",
  "paypal_sdk_load_failed",
  "capture_mismatch",
  "webhook_signature_invalid",
  "webhook_rejected",
  "otp_requested",
  "otp_verified",
  "otp_failed",
  "enrollment_granted",
  "lesson_completed",
  "course_completed",
  "certificate_issued",
  "locked_lesson_clicked",
  "video_play",
  "video_completed",
  "xp_awarded",
  "level_up",
] as const;

const TRACKED_LIST = TRACKED_EVENTS.map((event) => `'${event}'`).join(", ");

const FUNNEL_EVENTS = "'product_viewed', 'checkout_started', 'purchase_completed'";

const TOTALS_QUERY = `
  SELECT event, count() AS total, count(DISTINCT person_id) AS people
  FROM events
  WHERE ${SINCE} AND event IN (${TRACKED_LIST})
  GROUP BY event
`;

const DAILY_QUERY = `
  SELECT
    toDate(timestamp) AS day,
    countIf(event = '$pageview') AS pageviews,
    countIf(event = 'product_viewed') AS views,
    countIf(event = 'checkout_started') AS checkouts,
    countIf(event = 'purchase_completed') AS purchases
  FROM events
  WHERE ${SINCE} AND event IN ('$pageview', ${FUNNEL_EVENTS})
  GROUP BY day
  ORDER BY day
`;

/**
 * One row per product across all three funnel events, so the table shows where
 * each product loses people rather than just how often it was opened.
 */
const PRODUCTS_QUERY = `
  SELECT
    coalesce(
      nullIf(toString(properties.product_name), ''),
      toString(properties.product_id)
    ) AS product,
    toString(properties.product_type) AS type,
    countIf(event = 'product_viewed') AS views,
    countIf(event = 'checkout_started') AS checkouts,
    countIf(event = 'purchase_completed') AS purchases
  FROM events
  WHERE ${SINCE}
    AND event IN (${FUNNEL_EVENTS})
    AND toString(properties.product_id) != ''
  GROUP BY product, type
  ORDER BY views DESC, purchases DESC
  LIMIT 8
`;

/** MercadoPago and PayPal fail in different ways; a blended rate hides both. */
const RAILS_QUERY = `
  SELECT
    toString(properties.rail) AS rail,
    countIf(event = 'checkout_started') AS started,
    countIf(event = 'purchase_completed') AS completed
  FROM events
  WHERE ${SINCE}
    AND event IN ('checkout_started', 'purchase_completed')
    AND toString(properties.rail) != ''
  GROUP BY rail
  ORDER BY started DESC
`;

function indexTotals(rows: HogQLRow[]): Record<string, EventStat> {
  const totals: Record<string, EventStat> = {};
  for (const row of rows) {
    const event = toText(row.event);
    if (!event) continue;
    totals[event] = {
      event,
      total: toNumber(row.total),
      people: toNumber(row.people),
    };
  }
  return totals;
}

function statOf(
  totals: Record<string, EventStat>,
  event: string
): EventStat {
  return totals[event] ?? { event, total: 0, people: 0 };
}

/**
 * Pad the series so every day in the window has a point. Without this, recharts
 * spaces the days it received evenly and a week-long gap reads as steady
 * traffic instead of the outage or holiday it was.
 */
function buildDailySeries(rows: HogQLRow[]): DailyPoint[] {
  const byDay = new Map<string, HogQLRow>();
  for (const row of rows) {
    const day = toText(row.day).slice(0, 10);
    if (day) byDay.set(day, row);
  }

  const series: DailyPoint[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (WINDOW - 1));

  for (let i = 0; i < WINDOW; i++) {
    const key = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");
    const row = byDay.get(key);

    series.push({
      label: cursor.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
      pageviews: row ? toNumber(row.pageviews) : 0,
      views: row ? toNumber(row.views) : 0,
      checkouts: row ? toNumber(row.checkouts) : 0,
      purchases: row ? toNumber(row.purchases) : 0,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

/** Failure events worth an operator's attention, worst class first. */
const FRICTION_LABELS: Array<{
  event: string;
  label: string;
  severity: "warn" | "error";
}> = [
  { event: "capture_mismatch", label: "Montos que no coinciden", severity: "error" },
  { event: "webhook_signature_invalid", label: "Webhooks sin firma válida", severity: "error" },
  { event: "webhook_rejected", label: "Webhooks rechazados", severity: "error" },
  { event: "paypal_sdk_load_failed", label: "PayPal no cargó", severity: "error" },
  { event: "buy_blocked_not_signed_in", label: "Compra bloqueada (sin sesión)", severity: "warn" },
  { event: "otp_failed", label: "Códigos OTP fallidos", severity: "warn" },
  { event: "locked_lesson_clicked", label: "Clics en lecciones bloqueadas", severity: "warn" },
];

export function isInsightsConfigured(): boolean {
  return isQueryApiConfigured();
}

/**
 * Fetch everything the panel needs. Four queries run in parallel; if any fails
 * the whole panel reports the failure rather than rendering a half-truth that
 * looks like a collapse in traffic.
 */
export async function getDashboardInsights(): Promise<InsightsResult> {
  const [totalsResult, dailyResult, productsResult, railsResult] =
    await Promise.all([
      runHogQL(TOTALS_QUERY),
      runHogQL(DAILY_QUERY),
      runHogQL(PRODUCTS_QUERY),
      runHogQL(RAILS_QUERY),
    ]);

  const failed = [totalsResult, dailyResult, productsResult, railsResult].find(
    (result) => !result.ok
  );
  if (failed && !failed.ok) {
    return { ok: false, reason: failed.reason, message: failed.message };
  }
  if (!totalsResult.ok || !dailyResult.ok || !productsResult.ok || !railsResult.ok) {
    return { ok: false, reason: "failed", message: "Unexpected query state." };
  }

  const totals = indexTotals(totalsResult.data);

  const viewed = statOf(totals, "product_viewed");
  const started = statOf(totals, "checkout_started");
  const completed = statOf(totals, "purchase_completed");

  const funnel: FunnelStep[] = [
    { label: "Vieron un producto", people: viewed.people, events: viewed.total },
    { label: "Iniciaron el checkout", people: started.people, events: started.total },
    { label: "Compraron", people: completed.people, events: completed.total },
  ];

  const products: ProductRow[] = productsResult.data.map((row) => ({
    product: toText(row.product) || "Sin nombre",
    type: toText(row.type),
    views: toNumber(row.views),
    checkouts: toNumber(row.checkouts),
    purchases: toNumber(row.purchases),
  }));

  const rails: RailRow[] = railsResult.data.map((row) => ({
    rail: toText(row.rail),
    started: toNumber(row.started),
    completed: toNumber(row.completed),
  }));

  const friction: FrictionRow[] = FRICTION_LABELS.map(
    ({ event, label, severity }) => ({
      label,
      severity,
      total: statOf(totals, event).total,
    })
  ).filter((row) => row.total > 0);

  const empty = Object.values(totals).every((stat) => stat.total === 0);

  return {
    ok: true,
    data: {
      windowDays: WINDOW_DAYS,
      totals,
      funnel,
      daily: buildDailySeries(dailyResult.data),
      products,
      rails,
      friction,
      empty: empty || Object.keys(totals).length === 0,
    },
  };
}
