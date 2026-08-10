import "server-only";

/**
 * Read side of analytics: a thin client over PostHog's HogQL Query API.
 *
 * `server.ts` writes events; this file reads them back so the admin dashboard
 * can show behaviour (funnel, engagement, friction) next to the revenue figures
 * that come from `payment_log`. It is deliberately separate from the capture
 * client — reading needs a *personal* API key with different scopes and a
 * different host, and it must never become a dependency of a payment path.
 *
 * Two properties matter here:
 *
 *  1. Reads must never break the dashboard. Every failure is returned as a
 *     value, not thrown past the caller, so a PostHog outage degrades one panel
 *     instead of 500-ing the admin home page.
 *  2. Reads must be cheap. The Query API is a real analytical query — hundreds
 *     of milliseconds to seconds — and the dashboard fires several at once on
 *     every load. Results are memoised per query for `TTL_MS`.
 */

/** Ingestion runs on `us.i.posthog.com`; the REST API lives on the app host. */
const DEFAULT_API_HOST = "https://us.posthog.com";

/** How long a query result is reused. Dashboard freshness isn't worth a re-run. */
const TTL_MS = 5 * 60 * 1000;

/** PostHog is fronted by a query queue; past ~15s the tab has already lost. */
const TIMEOUT_MS = 12_000;

interface QueryConfig {
  apiKey: string;
  projectId: string;
  host: string;
}

function readConfig(): QueryConfig | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  // Not configured is a normal state, not an error: the rest of the dashboard
  // works fine without it and the panel renders setup instructions instead.
  if (!apiKey || !projectId) return null;

  const host =
    process.env.POSTHOG_API_HOST ??
    process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ??
    DEFAULT_API_HOST;

  return { apiKey, projectId, host: host.replace(/\/+$/, "") };
}

export function isQueryApiConfigured(): boolean {
  return readConfig() !== null;
}

/** A single result row, keyed by the column names HogQL returned. */
export type HogQLRow = Record<string, unknown>;

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_configured" | "failed"; message: string };

interface CacheEntry {
  at: number;
  rows: HogQLRow[];
}

/**
 * Module-level memo rather than `unstable_cache`. Serverless instances stay warm
 * across the handful of requests an admin makes in a sitting, which is the whole
 * window that matters, and this avoids coupling the panel to Next's cache
 * configuration.
 */
const resultCache = new Map<string, CacheEntry>();

/**
 * Run a HogQL query and return its rows as objects.
 *
 * The query string is written by this codebase only — never interpolate request
 * input into it. Anything variable belongs in `values` as a placeholder.
 */
export async function runHogQL(
  query: string,
  values?: Record<string, unknown>
): Promise<QueryResult<HogQLRow[]>> {
  const config = readConfig();
  if (!config) {
    return {
      ok: false,
      reason: "not_configured",
      message: "POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID are not set.",
    };
  }

  const cacheKey = `${config.projectId}:${query}:${JSON.stringify(values ?? {})}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return { ok: true, data: cached.rows };
  }

  try {
    const response = await fetch(
      `${config.host}/api/projects/${config.projectId}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: { kind: "HogQLQuery", query, values },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // POST responses aren't stored in Next's Data Cache anyway; `resultCache`
        // above is what actually spares PostHog the repeat work.
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        reason: "failed",
        message: `PostHog responded ${response.status}: ${body.slice(0, 300)}`,
      };
    }

    const payload = (await response.json()) as {
      results?: unknown[][];
      columns?: string[];
    };

    const columns = payload.columns ?? [];
    const rows = (payload.results ?? []).map((row) => {
      const record: HogQLRow = {};
      columns.forEach((column, index) => {
        record[column] = row[index];
      });
      return record;
    });

    resultCache.set(cacheKey, { at: Date.now(), rows });
    return { ok: true, data: rows };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? `Query timed out after ${TIMEOUT_MS / 1000}s.`
        : error instanceof Error
          ? error.message
          : String(error);

    console.warn("[analytics] HogQL query failed:", message);
    return { ok: false, reason: "failed", message };
  }
}

/** HogQL returns numeric aggregates as numbers or strings depending on type. */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
