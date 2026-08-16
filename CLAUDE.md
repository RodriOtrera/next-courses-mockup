This is a courses platform built with Next.js 16 and React 19. It is a **white-label base**: the same codebase is rebranded and redeployed per client, so no client's name, palette or copy may be hardcoded into it.

## Start here

- **[`docs/ui-design-brief.md`](./docs/ui-design-brief.md)** — the map of every screen, its colour roles, the design-token system, and which components are token-driven versus hardcoded. Read it before changing anything visual.
- **`docs/ui-design-brief.md` §10** — where each section of a generated customer brief lands in this repo.
- [`docs/README.md`](./docs/README.md) — index of the rest (database, API, analytics, PayPal, captions).

## Where a client's brand comes from

The companion builder (`next-course-ultimate`) is where a client configures their site. Its admin console exports a `<slug>-brief.md` holding their palette, fonts, component variants, page content, feature switches and assets. That file is the source of truth for a rebrand — not this document, and not anything read off the current design.

Three things absorb it without touching source:

- `.env.local` — site name, description, canonical URL, locale, currency. All read through `lib/seo/site.ts`.
- `app/globals.css` `:root` — the 19 shadcn HSL tokens plus `--radius`. Changing them restyles every `components/ui/*` primitive for free.
- `public/` — logo, favicon, OG image.

Everything else is currently hardcoded in JSX (~1,000 raw hex literals across ~70 files; see the design brief §6.2 and §7). There is no `config/site.ts` yet, so nav labels, footer, social links and home-page copy still need source edits.

## Components theming

Points worth checking on any rebrand — these carry colour that does not come from the tokens:

**Course pages**
- Course container — rating icon colour, the marked discount, the price colour, and the card background. The rating *glyph itself* is client-selectable (star / heart / flame / thumbs / trophy / sparkle), so don't assume a gold star.
- Module container.
- Icons and the backgrounds behind them.

**Icons**
- Every icon should take its colour from the app's palette. The exception is third-party brand marks (Mercado Pago, PayPal, WhatsApp) — those keep their own colours.
