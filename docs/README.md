# Docs

Project documentation lives here.

- [UI design brief](./ui-design-brief.md) — **start here when rebranding for a client.** Every screen and its colour roles, the design-token system, the platform-setting → shadcn-token translation, the hardcoded-colour debt, and (§10) where each section of a generated customer brief lands in this repo.
- [Database (Turso / libSQL)](./database.md) — setup commands, the migration workflow, and the SQLite-specific gotchas.
- [HTTP API (Hono + axios)](./api.md) — REST layer wrapping server actions, plus the typed axios client used from components.
- [Adding a new resource](./adding-a-resource.md) — step-by-step for wiring a new entity end-to-end.
- [PayPal integration](./paypal.md) — how checkout works against the PayPal Orders v2 REST API.
- [Analytics (PostHog)](./analytics.md) — server-first event tracking, the typed event taxonomy, the redirect/idempotency traps, and the dashboard's read path.
- [Video captions](./video-captions.md) — Mux ASR, translation, and how caption tracks reach the player.
- [Internationalization (next-intl)](./internationalization.md) — the build instruction for the multi-language switch: what a locale segment costs, the `proxy.ts` composition that keeps the auth guard working, and every surface that hardcodes Spanish or `es-AR`.
