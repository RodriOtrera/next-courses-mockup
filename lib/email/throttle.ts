/**
 * Sequential runner that keeps a minimum gap between calls.
 *
 * Resend's default limit is 2 requests/second, and contact sync is inherently
 * one request per contact — there is no bulk contacts endpoint. Firing a few
 * hundred `contacts.create` calls with `Promise.all` earns a wall of 429s and a
 * half-synced segment, which is worse than being slow.
 *
 * Deliberately sequential rather than a concurrency pool: at 2 rps a pool buys
 * nothing, and ordered execution makes the partial state after an interruption
 * easy to reason about ("everything before index i succeeded").
 */

/** 2 req/s with a little headroom for clock jitter and network variance. */
export const RESEND_MIN_INTERVAL_MS = 550;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ThrottledMapOptions {
  /** Minimum milliseconds between the *starts* of two consecutive calls. */
  intervalMs?: number;
  /**
   * Stop-work signal, checked between items. The sync cron passes its deadline
   * here so a long reconcile yields before the platform kills the function
   * mid-flight and loses the progress report.
   */
  shouldStop?: () => boolean;
}

export interface ThrottledMapResult<R> {
  results: R[];
  /** Items never attempted because `shouldStop` fired. */
  remaining: number;
}

/**
 * Applies `fn` to each item in order, pausing so that consecutive calls are at
 * least `intervalMs` apart. The delay is measured from the start of the previous
 * call, so a slow request costs nothing extra.
 */
export async function throttledMap<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ThrottledMapOptions = {},
): Promise<ThrottledMapResult<R>> {
  const { intervalMs = RESEND_MIN_INTERVAL_MS, shouldStop } = options;
  const results: R[] = [];
  let previousStart = 0;

  for (let i = 0; i < items.length; i++) {
    if (shouldStop?.()) return { results, remaining: items.length - i };

    const waitFor = previousStart === 0 ? 0 : intervalMs - (Date.now() - previousStart);
    if (waitFor > 0) await sleep(waitFor);

    previousStart = Date.now();
    results.push(await fn(items[i], i));
  }

  return { results, remaining: 0 };
}

/** Splits a list into fixed-size chunks — used for `resend.batch.send` (100 max). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
