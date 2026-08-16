/**
 * Admin authorization by email allowlist.
 *
 * The `user` table has no `role` column and BetterAuth runs without the
 * `admin()` plugin, so before this module the app's only notion of "admin" was
 * "has a session" — which made every dashboard action, including the mail
 * blast, reachable by any signed-in learner.
 *
 * An env allowlist is deliberately the whole mechanism: it needs no migration
 * and no change to `lib/auth/index.ts`, and the two call sites are easy to swap
 * for a real role check later without touching any caller.
 *
 * Kept as pure functions with no imports — not even `server-only` — so it can
 * be pulled in from `scripts/`, which runs outside the Next module graph and
 * would throw on the `server-only` shim. Nothing here reads a session; callers
 * pair it with `currentUser()` themselves.
 */

/**
 * Parsed once per process. `ADMIN_EMAILS` is a comma-separated list; entries are
 * lowercased and trimmed so `Foo@Bar.com , baz@qux.com` behaves as expected.
 */
let _allowlist: Set<string> | undefined;

function allowlist(): Set<string> {
  if (!_allowlist) {
    _allowlist = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    );
  }
  return _allowlist;
}

/**
 * Fails closed. An unset or empty `ADMIN_EMAILS` grants nobody access rather
 * than everybody — a misconfigured deploy must not be able to mail the list.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return allowlist().has(email.trim().toLowerCase());
}

/** The allowlist itself — the recipients of the "test" broadcast cohort. */
export function adminEmails(): string[] {
  return [...allowlist()];
}
