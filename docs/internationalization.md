# Internationalization (next-intl)

Nothing in this repo is internationalized today. This document is the build
instruction for the switch: what to change, in what order, and which of it is a
trap, **if a client opts into more than one language**. Like every other feature
switch in the brief (§6), it is a build instruction and not a runtime flag —
turning it on is source work, not an env var.

## Is this the switch you want?

Two different client asks sound identical over a call, and they are a day's work
apart.

| The client says | What they mean | What to do |
| --- | --- | --- |
| "My site should be in English, not Spanish." | One language, theirs. Nobody switches anything. | **Appendix A.** Externalize the copy, set one locale, done. No routing, no `proxy.ts` change, no navigation migration. |
| "My site should be available in English **and** Spanish." | Two or more languages served at once, a switcher in the navbar, both indexed. | **This document.** A locale segment, localized pathnames, hreflang, and ~80 call sites that move. |

The second is the real i18n project. Establish which one you have before
touching anything, because the first does not need 90% of what follows.

---

## TL;DR

1. Confirm versions — `next-intl@^4.13`, and decide the Next 16.2.4 → 16.3 bump
   (§1).
2. Pick the locale set and reconcile it with `CAPTION_LANGUAGES` (§3).
3. Wire the plugin, `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`,
   `global.ts` (§4).
4. Compose next-intl's handler into the existing `proxy.ts` **without** losing the
   BetterAuth guard (§5). This is the hard part.
5. Move the app tree under `app/[locale]/`, leaving `api/`, `sitemap.ts` and
   `robots.ts` behind (§6).
6. Sweep the copy with `useExtracted` (§7).
7. Replace every hardcoded `"es-AR"` and every bare `.toLocaleString()` with the
   request formatter (§8) — two of those are a hydration bug you have today.
8. Turn 16 static `metadata` exports into `generateMetadata`, add hreflang, make
   the sitemap and robots locale-aware (§9).
9. Migrate 41 `next/link` imports and 42 navigation calls, then add the lint rule
   that stops them coming back (§10).
10. Thread a locale through the email layer and fix the analytics route filter
    (§11, §12).

---

## 1. Prerequisites, and why to distrust the internet here

`next-intl@4.13.7` supports this stack — its `peerDependencies` cover
`next@^16` and `react@^19`, against the repo's `next@16.2.4` / `react@19.2.4`.

### Why this library

Stated briefly, because it is the kind of decision that gets revisited:

- **next-intl** is the only option with first-class Next 16 support — `proxy.ts`,
  `next/root-params`, async `params` — and it is released weekly. ICU
  `plural`/`select` matters for a white-label base whose copy bends per client,
  the `AppConfig` augmentation gives compile-time key safety across ~70 files
  being refactored at once, and messages can stay server-side so a client's copy
  never inflates the browser bundle.
- **`next-international`** should be excluded on maintenance grounds — last
  published October 2024, so it predates Next 15, Next 16, `proxy.ts` and async
  `params` entirely.
- **`next-i18next`** is a Pages Router binding. For the App Router you would use
  `react-i18next` directly and hand-roll an instance per request, which works but
  is boilerplate-heavy and tends to push messages into the client bundle.
- **Paraglide JS** has the best bundle-size story (messages compile to
  tree-shakable functions) and is actively maintained, but its dedicated Next
  adapter is **deprecated** in favour of using the generic package, so `[locale]`
  routing, `generateStaticParams`, negotiation and hreflang all become DIY. Worth
  revisiting only if client bundle size ever becomes the binding constraint.
- **Next's own App Router i18n** is a manual recipe, not a feature — the
  `i18n` key in `next.config.js` is Pages-Router-only. No ICU, no pluralization,
  no localized pathnames, no hreflang, no key safety.

One honest note: next-intl's own BetterAuth starter template resolves the locale
from a **user setting rather than the URL**, i.e. the non-routing mode in
Appendix A. That is a real signal about which mode is less trouble alongside auth.
The body of this document still recommends routing, because search visibility per
language is usually the point of the exercise — but if a client wants
multi-language *without* caring about indexing each one, Appendix A is the cheaper
and safer build.

Two APIs were deprecated in the **two weeks before this document was written**,
which means essentially every next-intl tutorial, blog post and Stack Overflow
answer you will find is now wrong in the same two places:

| Deprecated | In | Use instead |
| --- | --- | --- |
| `getRequestConfig(async ({requestLocale}) => …)` | 4.13.6 | `async ({locale}) => …` |
| `setRequestLocale()` in every page, for static rendering | 4.13.5 | `next/root-params` |

The second one deletes a whole class of boilerplate: the old ceremony where every
page and `generateMetadata` had to call `setRequestLocale(locale)` or lose static
rendering is gone.

**The one version decision.** `next/root-params` needs **Next 16.3+**; this repo
is on **16.2.4**. Either:

- **Bump to 16.3+** (recommended). next-intl 4.13.3 was released explicitly as
  "Next.js 16.3 compatibility preparation", so this is the combination upstream
  is testing. It also unlocks the deprecation replacements above rather than
  leaving you on two APIs that are already on the way out.
- **Stay on 16.2.4** and write `i18n/request.ts` without the `rootParams`
  fallback, validating the incoming `locale` with `hasLocale()` instead. This
  works — the `locale` argument comes from the proxy, and `rootParams` is only
  the fallback for requests that never passed through it.

Also note, from the Next 16 rename: **Proxy runs on the Node.js runtime and its
`runtime` cannot be configured.** Setting it throws.

---

## 2. What the platform assumes today

Single-locale, by construction, in one place:

```ts
// lib/seo/site.ts
export const SITE = {
    lang:       process.env.NEXT_PUBLIC_SITE_LANG        || "es",     // <html lang>, JSON-LD inLanguage
    locale:     process.env.NEXT_PUBLIC_SITE_LOCALE      || "es_AR",  // OpenGraph form
    intlLocale: process.env.NEXT_PUBLIC_SITE_INTL_LOCALE || "es-AR",  // Intl.NumberFormat form
    currency:   process.env.NEXT_PUBLIC_SITE_CURRENCY    || "ARS",
    // …
} as const;

export const priceFormatter = new Intl.NumberFormat(SITE.intlLocale, { … });
```

`SITE` is `as const` at **module scope**, and `priceFormatter` is a **singleton
bound to one locale at import time**. That is the thing that has to give: a
module-level constant cannot vary per request, so every consumer of
`SITE.lang` / `SITE.intlLocale` / `priceFormatter` is a site that has to move to
a request-scoped API.

The env block stays useful — it just changes meaning. `NEXT_PUBLIC_SITE_LANG`
becomes the **default** locale rather than the only one. See Appendix B.

---

## 3. Choosing the locale set

**There is already a language list in this repo.** `lib/mux/caption_languages.ts`
holds `CAPTION_LANGUAGES = ["es", "en", "pt"]` for subtitle transcription and
translation, plus `languageDisplayName(code, locale = "es")`. Do not add a second
list. Either make the next-intl `locales` the source and derive the caption list
from it, or keep them separate but assert they agree — two language enums that
drift is how you end up offering Portuguese subtitles on a site with no
Portuguese UI.

While you are there: `languageDisplayName`'s `locale = "es"` default is a
hardcoded reader locale. It should take the active locale from `useLocale()` /
`getLocale()`, and the `LANGUAGE_FALLBACK` table under it becomes dead weight
once `Intl.DisplayNames` is being asked for the right locale.

**Four axes, not one.** The env block already separates them and the doc comment
already warns they are not interchangeable, but it is worth restating because
i18n makes the confusion expensive:

| Axis | Example | Varies by locale? |
| --- | --- | --- |
| Locale tag | `es-AR`, `en`, `pt-BR` | Yes — this is what next-intl routes on |
| OpenGraph locale | `es_AR` (underscore) | Yes, derived |
| Currency | `ARS`, `USD`, `BRL` | **No.** Currency is a property of the *market*, not the reader |
| Time zone | `America/Argentina/Buenos_Aires` | No — one per deployment |

A reader switching to English does not want prices converted to dollars. Locale
changes how `25000` is *rendered*; it does not change what is charged. The
platform already proves the point — `components/payment_logs/PaymentLogs.tsx`
shows ARS and USD totals side by side.

---

## 4. Wiring

### `next.config.ts`

Wrap, do not replace. `rewrites()` (the PostHog `/rz-ev` proxy) and
`skipTrailingSlashRedirect` must survive — the ingestion path depends on both.

```ts
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = { /* unchanged */ };

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

### `i18n/routing.ts`

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/courses": { es: "/cursos", en: "/courses", pt: "/cursos" },
    "/courses/[slug]": {
      es: "/cursos/[slug]",
      en: "/courses/[slug]",
      pt: "/cursos/[slug]",
    },
    // …
  },
});
```

**`localePrefix: "as-needed"`** is the important choice. It leaves the default
locale unprefixed, so a client who already has live URLs and inbound links keeps
them when the switch is turned on. `"always"` would turn every existing URL into
a redirect — that is a migration, not an opt-in.

**`pathnames` is the answer to this repo's route naming.** The routes are already
bilingual and inconsistent: `/cursos/[slug]`, `/productos`, `/certificados`,
`/crearExamen`, `/cursosAdmin`, `/editarCurso` next to `/courses`, `/module`,
`/login`, `/signup`. `pathnames` lets the internal path stay one canonical name
while each locale gets its own public URL, which is the only way to fix the
naming without breaking every link at the same time.

Note there are **two** course routes: `/courses` is the catalogue and
`/cursos/[slug]` is the detail page. They are not translations of each other.
Read `app/(home)/` before writing the map.

`alternateLinks` defaults to **true**, so the proxy emits hreflang `Link`
headers for you. That is *in addition to* `alternates.languages` in the document
head (§9), not a replacement — crawlers read both.

Skip `domains`. It exists for serving locales from different hostnames; this base
is one deployment per client, so it is the wrong tool.

### `i18n/navigation.ts`

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

These five are the locale-aware replacements. `useSearchParams`, `useParams` and
`notFound` are **not** here — they keep coming from `next/navigation`.

### `i18n/request.ts`

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
    // One per deployment, not per reader. Pinning it is what stops server and
    // client rendering a date differently — see §8.
    timeZone: process.env.NEXT_PUBLIC_SITE_TIMEZONE ?? "America/Argentina/Buenos_Aires",
  };
});
```

On Next 16.3+ add the `next/root-params` fallback for requests that never went
through the proxy; on 16.2.4 the `hasLocale` guard above is the whole story.

### `global.ts` — type safety

```ts
import { routing } from "@/i18n/routing";
import messages from "./messages/es.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
```

This makes every locale value and message key checked at compile time. With
`experimental.createMessagesDeclaration` in the plugin plus
`"allowArbitraryExtensions": true` in `tsconfig.json`, message *arguments* get
typed too — so a message with `{count}` cannot be called without it.

---

## 5. `proxy.ts` — the hard part

**Next.js 16 renamed `middleware.ts` to `proxy.ts`** and the export from
`middleware` to `proxy`. This repo is already migrated; next-intl's own docs are
too ("`proxy.ts` was called `middleware.ts` up until Next.js 16"). But most
third-party writing about next-intl still says `middleware.ts`, and a
`middleware.ts` you create from a tutorial **will silently never run**.

Here is what the file does today:

```ts
export function proxy(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
  const { pathname } = req.nextUrl;

  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (sessionCookie && (pathname === "/login" || pathname === "/signup" || pathname === "/verify-otp")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/verify-otp"],
};
```

**Four things in it break, and three of the four break silently.**

1. `pathname.startsWith("/dashboard")` never matches `/en/dashboard`. The
   dashboard stops being auth-gated for every non-default locale.
2. `pathname === "/login"` never matches `/en/login`. Signed-in users stop being
   bounced away from the auth pages.
3. The redirect *targets* (`/login`, `/dashboard`) drop the reader's locale, so
   an English visitor is thrown onto the Spanish login page.
4. `return NextResponse.next()` **discards next-intl's work**. This is the one
   that fails loudly-ish and confusingly: locale negotiation, the rewrite into
   `[locale]`, the cookie and the hreflang headers all live on the response
   next-intl builds. Return `next()` and you get "unable to find locale" errors
   with a config that looks correct.

The shape that works is **not** "strip the locale prefix and test the rest".
That looks right and breaks as soon as you use the localized `pathnames` from §4,
because `/es/panel` has to be recognized as the *internal* `/dashboard` and a
naive split gives you `/panel`. Instead, use next-intl's own documented
technique: **let the i18n handler run first, then read the locale and the
internal pathname back out of the rewrite it produced.** That survives both
`localePrefix: 'as-needed'` and localized pathnames.

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ONLY_PATHS = new Set(["/login", "/signup", "/verify-otp"]);

export function proxy(req: NextRequest) {
  // 1. next-intl negotiates the locale, sets NEXT_LOCALE, emits hreflang.
  const i18n = handleI18n(req);

  // 2. Not-ok means it issued its own redirect (e.g. `/` -> `/en`). Let it go;
  //    the guard runs on the follow-up request.
  if (!i18n.ok) return i18n;

  // 3. Recover the locale and the INTERNAL, unlocalized pathname.
  const resolved = new URL(
    i18n.headers.get("x-middleware-rewrite") ?? req.url,
    req.url,
  );
  const [, locale, ...rest] = resolved.pathname.split("/");
  const path = "/" + rest.join("/");

  // 4. The original rules, now locale-agnostic.
  const signedIn = Boolean(getSessionCookie(req));
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  if (!signedIn && isProtected) {
    return keepCookies(redirectTo(req, locale, "/login"), i18n);
  }
  if (signedIn && AUTH_ONLY_PATHS.has(path)) {
    return keepCookies(redirectTo(req, locale, "/dashboard"), i18n);
  }

  return i18n;
}

function redirectTo(req: NextRequest, locale: string, path: string) {
  return NextResponse.redirect(new URL(`/${locale}${path}`, req.url));
}

/** Without this, the NEXT_LOCALE cookie next-intl just set is thrown away. */
function keepCookies(redirect: NextResponse, from: NextResponse) {
  for (const cookie of from.headers.getSetCookie()) {
    redirect.headers.append("set-cookie", cookie);
  }
  return redirect;
}

export const config = {
  matcher: "/((?!api|rz-ev|_next|_vercel|.*\\..*).*)",
};
```

Adapt, do not paste. Three things about it are worth knowing before you rely on
them:

- **`redirectTo` assumes an always-prefixed target.** Under `'as-needed'` the
  default locale wants a bare `/login`, and under localized `pathnames` it wants
  the *external* path. The clean answer is `getPathname({href, locale})` from
  `@/i18n/navigation` — but `createNavigation` transitively imports
  `next/navigation`, and whether that is safe inside the proxy bundle is **not
  documented either way**. Test it; if it misbehaves, build the string by hand.
- **`getSessionCookie` only checks that a cookie exists — it does not validate
  it.** BetterAuth says so explicitly, and Next says the same about relying on the
  proxy for server functions. This was already true before i18n; it stays true.
  Real authorization lives in layouts, pages and actions.
- Since the proxy is on the Node runtime now, `auth.api.getSession()` would work
  here. Do not do it: with the wide matcher below that is a database round trip on
  every page view.

Verify by hand: signed-out on `/en/dashboard`, signed-in on `/en/login`, a bare
`/dashboard` on the default locale, and `/` with an `Accept-Language: en` header.

**The matcher widened, and that has a cost.** It went from four paths to
everything-except-assets, because next-intl has to see every page request to
negotiate a locale. Consequences:

- **`rz-ev` must be excluded, and it is not in next-intl's stock matcher.** The
  proxy runs *before* `next.config.ts` rewrites in Next's execution order, so it
  sees the raw path. `/rz-ev/static/array.js` happens to be saved by the
  `.*\..*` clause, but PostHog's ingestion endpoints have no dot in them — they
  would be locale-prefixed to `/es/rz-ev/e/`, the rewrite would never match, and
  analytics would go quiet.
- `sitemap.xml` and `robots.txt` fall out via `.*\..*`.
- The proxy now runs on every page request, on the Node runtime, where it
  previously ran on four routes. Watch cold-start and latency; one reported case
  hit meaningful hosting CPU cost at only a couple of thousand weekly visits.
- Matcher values must be static literals — they are analyzed at build time.
- Excluding a path also excludes **server actions posted to it**, since a server
  function is a POST to its own route.
- `_next/data` runs the proxy even when the matcher excludes it. Next documents
  this as deliberate.

### Two Next 16 proxy bugs to know about

Both have "rename it back to `middleware.ts`" as the workaround, and
`middleware.ts` is deprecated-but-functional — it is also the **only** way to get
the edge runtime, since `proxy` is Node-only and its `runtime` cannot be set.

- **vercel/next.js#85243** — proxy does not run on Windows 11 under
  `next start`. This repo is developed on Windows 11, so expect to hit it locally
  before you hit anything real. Test the auth guard with `next dev` and on a
  deployed preview, not only `next start`.
- **vercel/next.js#86122** — `proxy.ts` does not execute in production behind
  Cloudflare's proxy, where `middleware.ts` did. Check this before shipping to a
  client whose domain sits behind Cloudflare.

Do not ship both `middleware.ts` and `proxy.ts`. Next's docs do not state the
precedence; the reports say `proxy.ts` wins and the leftover `middleware.ts` is
ignored **with no build error** — which is the worst possible failure mode for an
auth guard.

---

## 6. Moving the tree

| Moves under `app/[locale]/` | Stays at `app/` | Why |
| --- | --- | --- |
| `(home)/`, `(dashboard)/` | `api/` (10 route handlers) | Webhooks and crons cannot be locale-prefixed |
| `login/`, `signup/`, `verify-otp/` | `sitemap.ts`, `robots.ts` | They enumerate locales; they do not live in one |
| `email/` | `favicon.ico`, `globals.css` | Not routes |

`app/[locale]/layout.tsx` becomes the layout that renders `<html lang={locale}>`
and wraps children in `NextIntlClientProvider`. next-intl's example app deletes
the root `app/layout.tsx` entirely and lets `[locale]/layout.tsx` be the root, and
reads the locale with `await getLocale()` rather than from `params`:

```tsx
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={/* … */}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`LayoutProps<'/[locale]'>` is a global type Next 16 generates for you. Note there
is **no `setRequestLocale` call** — with `next/root-params` (§1) static rendering
comes for free; on 16.2.4 without it you are back to calling `setRequestLocale` in
every layout and page, which is the strongest single argument for the version bump.

Two placement facts:

- **The provider belongs at the top.** `QueryProvider` is mounted in
  `app/(home)/layout.tsx` only, so it covers neither the dashboard nor the auth
  pages — do not copy its placement.
- **Do not pass `messages` to the provider.** Since v4, `locale`, `messages`,
  `now`, `timeZone` and `formats` are inherited automatically when it is rendered
  from a Server Component. `onError` and `getMessageFallback` are the exceptions —
  they are not serializable, so setting them needs a nested `"use client"`
  provider.

### Error and not-found routes

Four things need attention, and three of them are new files:

- **`app/[locale]/not-found.tsx`** replaces `app/not-found.tsx` and
  `app/(home)/not-found.tsx`. It only renders when something calls `notFound()`
  *from inside a route* — it does not catch unknown URLs.
- **`app/[locale]/[...rest]/page.tsx`** that calls `notFound()` is what catches
  unknown URLs under a locale. Without it, a bad path under `/en/` does not reach
  your localized 404.
- **`app/global-not-found.tsx`** catches requests that never matched the proxy at
  all (`/something.txt`). It has no locale, so keep it neutral.
- **`app/error.tsx`** is a client component, and when the error is in the layout
  itself it is *outside* the provider's tree. It needs its own
  `NextIntlClientProvider` with an explicit `locale` and a narrowed message set
  (`messages={pick(messages, 'Error')}`), or it stays locale-neutral. There is
  also no `global-error.tsx` in this repo; add one, because a crash in the locale
  provider lands exactly there.

---

## 7. Sweeping the copy

Roughly **60–70 files** carry translatable copy, out of ~276 `.tsx` files. The
free ones: `components/ui/*` (23 shadcn primitives, essentially no copy),
`components/spartan/*` (7 pure SVGs), `components/analytics/*`.

### Use `useExtracted`

`useExtracted` is next-intl's extraction API: write the literal inline, and an
SWC/Turbopack loader pulls it into the catalogs at `dev`/`build` time, generating
the key itself.

```tsx
import { useExtracted } from "next-intl";

const t = useExtracted();
return <h1>{t("Comprar ahora")}</h1>;
```

compiles to `useTranslations` with a minified key (`t("dPSc42")`), and
`messages/es.json` gains the entry. Save the file and the other locales get an
empty slot for it automatically.

```ts
// next.config.ts
const withNextIntl = createNextIntlPlugin({
  experimental: {
    extract: true,
    srcPath: "./",            // no `src/` dir in this repo
    messages: {
      path: "./messages",
      format: "po",
      sourceLocale: "es",
      locales: "infer",
    },
  },
});
```

**Why this one for this codebase**, specifically:

- The copy is already written, in Spanish, in place. `useExtracted` means the
  migration is "add a hook call and wrap the string" — one file at a time, no
  parallel key-naming exercise across 60 files.
- It needs **Next 16+** for the Turbopack loader. This repo is the intended
  target rather than a stretch.
- `format: "po"` keeps the source file reference and the translator description
  as comments in the catalog. That context is what makes translating 60 files'
  worth of strings tractable, by a person or a machine.
- The async form for server components is `getExtracted()` from
  `next-intl/server`.

**It is experimental** (since 4.5; stabilisation tracked in
amannn/next-intl#2087), so expect the API to move. And it constrains you:

- No `t.raw`, and no `t(someVariable)` — messages must be statically analyzable.
- Cannot pass `t` into another function, or re-export `useExtracted`.
- `messages.precompile: true` compiles ICU at build time and shrinks the runtime;
  also incompatible with `t.raw`.

### How much of this reaches the browser

**86 of 137 `components/**` files are `"use client"`** — 63%. By default
`NextIntlClientProvider` serializes **every** message into the streaming markup,
which means the whole catalog lands in the HTML of every page and counts against
TBT. At this repo's client-component ratio that is not a rounding error.

Four options, best first:

1. **Translate in a Server Component and pass strings down as props or
   children.** Costs nothing and is the reason `getTranslations` exists.
2. **Move the state that forced `"use client"` to the server** — search params,
   cookies, a server action — so the component stops needing messages at all.
3. **Narrow per subtree**: `<NextIntlClientProvider messages={pick(messages, 'Cart')}>`.
4. Ship everything, knowingly.

`messages={null}` opts a subtree out entirely. Note that nested providers inherit
from ancestors but props are **atomic** — a nested `messages` replaces rather than
merges, so you merge by hand.

Related: keep `i18n/request.ts` and its message imports out of `proxy.ts`'s import
graph, or the catalogs end up in the proxy bundle too.

**The stable fallback** is plain `useTranslations` with hand-authored namespaces
in `messages/es.json` mirroring the route tree, plus the `AppConfig` augmentation
from §4. Use it for anything where a stable, human-readable key matters more than
migration speed — `lib/email/templates/*`, and anything a generated customer
brief refers to by name. Both APIs read the same catalogs, so mixing them is
fine.

### Copy that is not in JSX

Several files are already message catalogs in all but name, and convert cleanly:

| File | What is in it |
| --- | --- |
| `lib/email/templates/otp.ts` | `COPY: Record<OtpPurpose, PurposeCopy>` — 4 purposes × 4 fields = 16 strings. The model for how the rest should look. |
| `lib/email/templates/course_progress.ts` | `ENCOURAGEMENT: Record<CourseMilestone, string>` |
| `lib/gamification/levels.ts` | `LEVEL_TIERS` — `Aprendiz`, `Estudiante`, `Practicante`, `Experto`, `Maestro` |
| `lib/email/segments.ts` | segment labels |
| `app/(home)/_components/Footer.tsx` | `socialLinks` and `navLinks` arrays, inline in the component |

### Two things to fix rather than translate

`app/(home)/courses/page.tsx:29-32` pluralizes by hand:

```tsx
{n === 1 ? "curso" : "cursos"} {n === 1 ? "disponible" : "disponibles"}
```

That is what ICU plurals are for, and hand-written ternaries do not survive
contact with a language that has more than two plural forms:

```
{count, plural, one {# curso disponible} other {# cursos disponibles}}
```

And `components/TextGenerateEffetx.tsx`, `components/Typewritter.tsx` and
`app/(home)/_components/FlipWords.tsx` animate text **character by character**.
That is fine for Latin scripts and wrong for CJK and RTL. Flag it if a client
picks a non-Latin locale; while you are there, `app/layout.tsx` loads Geist with
`subsets: ["latin"]`, which would need widening too.

---

## 8. Formatting

There are **34** `Intl.*` / `.toLocaleString` call sites. Work them in this
order, because the first group is a bug you have today.

### First: the four with no locale at all

```
app/(home)/_components/StatsStrip.tsx:45              display.toLocaleString()
components/ui/AnimatedCounter.tsx:63                  displayValue.toLocaleString()
app/(dashboard)/dashboard/ebook/EbookDashboardCard.tsx:45    price.toLocaleString()
app/(dashboard)/dashboard/program/ProgramDashboardCard.tsx:40 price.toLocaleString()
```

A bare `.toLocaleString()` uses **the runtime's** default locale — Node's on the
server, the browser's on the client. When those disagree, the server renders
`25.000` and the client renders `25,000`, and you get a hydration mismatch that
depends on the visitor's OS settings. **This is live in the codebase right now,
independent of i18n.** `useFormatter` fixes it as a side effect, because the
locale stops being ambient.

### Then: the ~20 hardcoded `"es-AR"`

Concentrated in the dashboard and gamification surfaces — `XpConfigForm.tsx`
(six), `DashboardCharts.tsx` (four), `PaymentLogContainer.tsx`, `XpMeter.tsx`,
`XpToast.tsx`, `BroadcastComposer.tsx`, `PostHogInsights.tsx`,
`lib/analytics/insights.ts:220`, `components/course/CourseContainer.tsx:7`.
Each becomes:

```tsx
const format = useFormatter();          // client
const format = await getFormatter();    // server
format.number(value);
format.dateTime(date, { month: "short" });
```

### Then: money

`app/(home)/_components/PriceTag.tsx:1,7` and
`app/(home)/_components/BuyProductButton.tsx:10` build
`new Intl.NumberFormat("en-US", { currency: "ARS" })` — **US grouping on
Argentine pesos**, which is wrong today and has nothing to do with i18n.
Meanwhile `lib/seo/site.ts:71`'s `priceFormatter` gets it right but is a
module-scope singleton bound to one locale at import.

Resolve all three the same way: one currency helper that takes the request locale
and the deployment's currency, exposed through `formats` in `i18n/request.ts` so
`format.number(price, "currency")` is the only call site pattern. Remember §3 —
the currency does not change when the reader switches language.

Also `app/(home)/cursos/[slug]/page.tsx` passes `currency="ARS"` to
`<TrackProductView>` as a literal; that should read the deployment's currency.

### Time zone

Pin `timeZone` in `i18n/request.ts` (§4). Without it, server and client resolve
dates in different zones and you are back to a hydration mismatch. Use `now` in
the same config if anything renders relative times, so "2 hours ago" is computed
against one instant rather than two.

---

## 9. SEO

### Metadata

**16 static `metadata` exports** and one `generateMetadata`
(`app/(home)/cursos/[slug]/page.tsx:40`). A static `metadata` object cannot read
the request locale, so all 16 become `async generateMetadata`:

```tsx
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getPathname({ href: "/courses", locale }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ href: "/courses", locale: l })]),
      ),
    },
  };
}
```

`params` is a Promise in Next 16 — sync access is fully removed, not merely
deprecated. Note that `lib/types/utility_types.ts`'s `PageParams` types it as
non-Promise while pages already `await props.params`; that pre-existing mismatch
will surface here. In Next 16 `opengraph-image` receives both `params` **and `id`**
as Promises, and `sitemap`'s `id` is a Promise too.

`getPathname` is **synchronous** and returns a string. next-intl's own sitemap
example writes `await getPathname(...)`, which is harmless but misleading — do not
copy the `await`.

Eight of those pages get their metadata from
`lib/seo/private-metadata.ts#noindexMetadata(title)`, each passing a raw Spanish
literal (`"Mi cuenta"`, `"Lección"`, `"Certificado"`, `"Crear examen"`, …). The
helper should take a message key, or the callers should resolve the string first.

`app/layout.tsx` also has `openGraph.locale: SITE.locale` and a
`title.template` — both need the request locale.

### hreflang comes from two places, not one

This is worth being precise about, because it is easy to do half of it and think
you are done.

- **The proxy emits hreflang as a response header.** With `alternateLinks: true`
  (the default) next-intl adds a `link:` header listing every locale's URL plus
  `x-default`, incorporating `domains`, `pathnames` and `basePath`. You get this
  for free and it is the part most people miss exists.
- **`alternates.languages` puts `<link rel="alternate">` tags in the document
  head**, which is what most SEO tooling actually checks. That is the
  `generateMetadata` work above, and **it appears nowhere in this codebase
  today** — net-new, not a migration.

Turn `alternateLinks` off only if some pages exist in a subset of locales, since
the header is generated blindly for all of them. It is disabled automatically
under `localePrefix: 'never'`.

Two related notes: next-intl has **no official code sample** for
`alternates.languages` in `generateMetadata` or for a locale-aware `robots.ts`, so
the patterns here are assembled rather than quoted — verify them against real
crawler output. And `app/manifest.ts`, if you ever add one, lives outside
`[locale]` and must pick a representative locale explicitly.

### `app/sitemap.ts`

Today it hardcodes `/`, `/courses`, `/productos` and then `/cursos/${slug}` per
published course, with no `alternates`. It needs one entry per locale per route,
each carrying `alternates.languages`, with the URLs built through `getPathname`
rather than string concatenation — otherwise the localized `pathnames` from §4
and the sitemap disagree, and the sitemap wins in the crawler's eyes.

Keep `revalidate = 3600` and keep the try/catch around `listPublicCourses()`: the
comment there is right that a throw fails the build.

### `app/robots.ts`

```ts
disallow: ["/api/", "/rz-ev/", "/login", "/signup", "/verify-otp"],
```

Those three literals stop matching the moment the routes become `/en/login`.
Generate the list across locales, or use patterns. The file's leading comment
explains why `noindex` and `Disallow` are split by purpose — that reasoning still
holds, so do not "fix" this by moving pages into `Disallow`.

### `lib/seo/jsonld.ts`

Three things:

- `inLanguage: SITE.lang` at lines 35 and 196 — request locale.
- `buildCourseGraph` hardcodes breadcrumb labels
  `{ name: "Inicio", path: "/" }` and `{ name: "Cursos", path: "/courses" }`
  (lines 223–224). Both the label and the path need localizing.
- **`parseWorkload()` (line 129) only matches Spanish duration words** —
  `semanas?|horas?|hs?|d[ií]as?|meses|mes|a[nñ]os?`. An operator who types
  `"8 weeks"` gets `null`, and `courseWorkload` silently vanishes from the
  structured data. Widen the pattern per locale, or parse the number and take the
  unit from a message.

Related: `lib/utils/slug.ts` folds to ASCII via NFD. Fine for Latin scripts;
CJK titles fold to nothing and fall back to `"curso"`, so every course would
collide on one slug.

---

## 10. Navigation

The migration surface, measured:

| What | Count | Becomes |
| --- | --- | --- |
| Files importing `next/link` | 41 | `Link` from `@/i18n/navigation` |
| `redirect` call sites | 21 | `redirect` from `@/i18n/navigation` |
| `useRouter` | 15 | `useRouter` from `@/i18n/navigation` |
| `usePathname` | 5 | `usePathname` from `@/i18n/navigation` |
| `permanentRedirect` | 1 | locale-aware equivalent |

**The 21 `redirect` call sites are more work than a swapped import.**
next-intl's `redirect` **requires** a locale: `redirect({href: '/login', locale})`.
Every one of those sites therefore has to *obtain* a locale — `await getLocale()`
in a server component or action, `useLocale()` in a client one. About half of them
live in `lib/db/actions/**`, which is exactly where a locale is least readily to
hand. Budget for it. (TypeScript also cannot narrow after `redirect`; write
`return redirect({...})` if you need it to.)

The five `usePathname` call sites all compare paths **exactly** to drive
active-nav state — `app/(home)/_components/NavbarItems.tsx:21`,
`NavbarNavigationMenu.tsx:37`, `app/(home)/productos/ProductsSidebar.tsx:56`,
`components/course/PreviewSidebar.tsx:49`,
`components/dashboard/LateralBarNavigation.tsx:21`. next-intl's `usePathname`
returns the path **without** the locale prefix, which is exactly what these
comparisons want. Note that `usePathname` and `useRouter` from
`@/i18n/navigation` **throw in Server Components** — `Link`, `redirect` and
`getPathname` work in both.

**Add the lint rule.** A 41-file migration that anyone can undo with one
autocompleted import is not finished. Ban `next/link` and the five moved names
from `next/navigation` via `no-restricted-imports` in `eslint.config.mjs`,
pointing at `@/i18n/navigation`. Leave `useSearchParams`, `useParams` and
`notFound` allowed.

**`revalidatePath` — 61 call sites across 32 files**, mostly `lib/db/actions/**`.
Each takes a literal path (`lib/db/actions/edit/course_edit_actions.ts:42-48`
revalidates
`/editarCurso/${id}`, `/cursos/${slug}`, `/courses`, `/productos`,
`/sitemap.xml`).

Localized `pathnames` make this genuinely subtle: a **statically generated** page
is revalidated by its *internal* path (`/en/courses/x`), a **runtime-generated**
one by its *external* localized path (`/es/cursos/x`). Getting it wrong does not
throw — it silently serves stale pages in every locale but one, which is a slow
and confusing bug. Two mitigations, in order of preference: switch these to
`revalidateTag`, which sidesteps the distinction entirely; or write exactly one
path helper and use it at all 60 sites.

**Dead targets first.** `/coaching`, `/micuenta`, `/payment/success`,
`/payment/error`, `/pago/completado` and several others are linked but have no
page (design brief §9.3). Fix or delete them before localizing links to routes
that do not exist.

---

## 11. Outside the request

Email templates, crons and webhooks have no request context, so `useTranslations`
and `getTranslations` are the wrong tools. Use the core API, which needs nothing
global:

```ts
import { createTranslator, createFormatter } from "use-intl/core";

const t = createTranslator({ locale, messages });
const format = createFormatter({ locale });
```

Note the import path is **`use-intl/core`**, not `next-intl`.

### The email layer

Five templates in `lib/email/templates/`, all plain TS returning HTML strings.

- `shared.ts#layout()` emits `<html lang="${SITE.lang}">` — the locale has to be
  threaded down to it.
- `broadcast.ts` bakes a Spanish fallback into a Resend merge tag
  (`{{{contact.first_name|Hola}}}`) and links `absoluteUrl("/email/preferencias")`
  — a locale-less URL in every broadcast ever sent.
- Every `absoluteUrl()` call in this layer produces a locale-less link. The
  function takes no locale; give it one, or route email links through
  `getPathname`.

### The OTP problem — decide this deliberately

`lib/auth/index.ts` calls `otpSubject` / `renderOtpHtml` / `renderOtpText` from
inside BetterAuth's `sendVerificationOTP`. That hook receives the email and the
OTP type. **It has no locale.**

The sign-in code is the first thing every single user receives from the platform.
Left alone, it stays Spanish for an English user who has not yet got an account
to store a preference on. The options, in increasing order of correctness:

1. Send in the default locale. Cheapest; wrong for exactly the users you added
   i18n for.
2. Persist a locale on the user row and read it in the hook. Works from the
   second email onward — the first still has nothing to read.
3. Capture the locale at the point the OTP is *requested* (the login and signup
   pages know it) and carry it through. Correct from the first email, and the
   most plumbing.

Pick one explicitly and write it down. This is the single most visible piece of
non-UI copy in the product.

### Payments

- `PaypalInterface.tsx:33` builds the SDK URL with `&currency=USD&components=buttons`
  and **no `&locale=`**, so the PayPal buttons render in the browser's locale
  rather than the site's.
- `lib/db/actions/create_preference.ts` sets Mercado Pago `back_urls` to
  `absoluteUrl('/payment/success')` and `/payment/error` — both locale-less, and
  **neither route exists** in `app/`.

---

## 12. Analytics — the silent one

`instrumentation-client.ts:23`:

```ts
const INTERNAL_ROUTES = ["/dashboard", "/cursosAdmin", "/editarCurso", "/crearExamen"];
// …
return INTERNAL_ROUTES.some((route) => pathname.startsWith(route));
```

This feeds `before_send`, which drops the operator's own traffic so admin
activity does not inflate product metrics. `/en/dashboard` does not start with
`/dashboard`, so **the filter stops working and nothing anywhere reports an
error**. Admin traffic quietly pollutes every funnel from the deploy onward, and
the file's own comment explains why it cannot be cleaned up afterwards: there is
no role column on `user` to filter by retroactively.

Strip the locale prefix before the `startsWith` test. Put it near the top of the
work order — it is two lines and it is the one item here whose failure mode is
permanently lost data.

---

## 13. What stays single-language

**Operator-authored content is not translated, and this document does not make it
translatable.** There is no `locale` column anywhere in the Drizzle schema:

`courses` (`title`, `descripcion`, `beneficios`, `duracion`), `modules`,
`modules_items`, `frequently_asked_questions` (`question`, `response`),
`testimonials`, `home_testimonials`, `instructors` (`qualities`),
`ebook_schema`, `program_schema`, `coachings`.

So a client who turns this switch on gets **translated chrome around
single-language content**: the navbar, buttons, headings, emails, dates and
prices follow the reader's locale; the course titles and descriptions stay in
whatever language the operator typed them in.

That is a coherent product for most clients, and it must be said out loud rather
than discovered. If a client needs the catalogue itself translated, that is a
separate project needing, at minimum: a translation table per content entity
(`course_translations(course_id, locale, title, descripcion, …)` with
`UNIQUE(course_id, locale)`), a read path that falls back to the default locale
per field, per-locale slugs, and per-locale tabs in the `/dashboard` editors.
Budget it separately.

Video subtitles are the exception — they already have real per-language support
via Mux (`docs/video-captions.md`), which is why §3 insists on reconciling the
locale list with `CAPTION_LANGUAGES` rather than adding a second one.

---

## 14. Locale switcher

**Negotiation order**, prefix mode: locale in the pathname → the `NEXT_LOCALE`
cookie → the `accept-language` header → `defaultLocale`. Matching uses
`@formatjs/intl-localematcher`'s *best fit* rather than RFC 4647 lookup, so
`accept-language: en-GB` resolves to `en-US` instead of falling through to the
default. Set `localeDetection: false` to ignore both the cookie and the header and
route purely on the URL.

The cookie's defaults are worth knowing: name `NEXT_LOCALE`, `sameSite: 'lax'`,
**no `maxAge`** — so it is a session cookie that dies with the browser, which is a
deliberately GDPR-friendly default — and no `httpOnly`, because the client has to
read it. Override with `localeCookie: {name, maxAge}`, or `false` to disable.
Since 4.13.3 it is only written for document requests, not prefetches.

The switcher itself is `useRouter` + `usePathname` from `@/i18n/navigation`:

```tsx
router.replace(pathname, { locale: "de" });              // without `pathnames`
router.replace({ pathname, params }, { locale: "de" });  // with `pathnames`
```

Prefer `useRouter` over `<Link locale="de">` for the switcher. A `Link` carrying
`locale` always emits a prefixed href even under `'as-needed'`, so the cookie gets
updated first, and it is **never prefetched** — prefetching would overwrite the
cookie before the reader clicked. `useRouter` updates the cookie client-side and
avoids the double hop.

Two things to get right in the UI: render each language's name **in that
language** (a reader looking for Portuguese scans for "Português", not
"Portugués"), and give the control a translated accessible label.
`lib/mux/caption_languages.ts#languageDisplayName` already does the
`Intl.DisplayNames` part — reuse it once its `"es"` default is fixed (§3).

---

## 15. Order of work

Riskiest and cheapest-to-verify first:

1. `instrumentation-client.ts` locale-stripping (§12) — two lines, unrecoverable
   if forgotten.
2. Version decision and the `next-intl` install (§1).
3. `i18n/*` + `global.ts` + the plugin (§4).
4. `proxy.ts` composition (§5). Verify all three auth paths by hand before
   moving on; everything downstream assumes this works.
5. The tree move and the providers (§6). Get the app booting in two locales with
   *zero* strings translated.
6. Formatting (§8) — starting with the four hydration bugs, which are worth
   fixing whether or not the rest ships.
7. Navigation migration + the lint rule (§10).
8. SEO (§9).
9. Copy sweep (§7). Last, because it is the largest and the least likely to be
   structurally wrong.
10. Email layer and the OTP decision (§11).

Steps 1 and 6 are worth doing on their own even if the client never opts in.

---

## Appendix A — one locale, no routing

For "my site should be in English": there is no locale segment, no
`proxy.ts` change, no navigation migration, and no hreflang. You get
next-intl purely as a copy-externalization mechanism.

```ts
// next.config.ts — plugin only
const withNextIntl = createNextIntlPlugin();

// i18n/request.ts
export default getRequestConfig(async () => {
  const locale = process.env.NEXT_PUBLIC_SITE_LANG ?? "es";
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

Wrap the root layout's children in `NextIntlClientProvider` (no props — messages
are inherited) and set `<html lang={locale}>`. Then §7 (copy) and §8 (formatting)
apply unchanged; skip §5, §6, §9's hreflang and sitemap work, §10 and §14.

If the locale should be per-*reader* rather than per-deployment, read it from a
cookie or the signed-in user instead. `getRequestConfig` runs during the RSC
render pass, so `cookies()`, `headers()` and the database are all available:

```ts
export default getRequestConfig(async () => {
  const user = await currentUser();                       // lib/auth/server
  const cookieLocale = (await cookies()).get("locale")?.value;
  const locale = hasLocale(LOCALES, user?.locale)
    ? user.locale
    : hasLocale(LOCALES, cookieLocale)
      ? cookieLocale
      : "es";
  return { locale, timeZone: SITE_TZ, messages: /* … */ };
});
```

Note the cookie here is **yours**, named whatever you like — `NEXT_LOCALE` is the
proxy-managed cookie and there is no proxy in this mode. Switch locale with a
server action that writes the cookie or the user row and then revalidates.

Understand the tradeoff: one URL serves multiple languages, so Google indexes
exactly one of them and the rest are invisible to search. For a site whose job is
selling courses that is usually the wrong trade — which is why the body of this
document recommends routing.

**The middle ground** is `localePrefix: 'never'`: keep the `[locale]` folder and
its static rendering, let the cookie decide the locale, and serve unprefixed URLs.
You do need the proxy back, and the matcher has to cover unprefixed pathnames.
Alternate links are disabled automatically, so you still get no hreflang. Useful
when you want per-locale static rendering without changing any URL.

Also note `localePrefix: 'as-needed'` — the mode §4 recommends — **requires** the
proxy, because serving the default locale unprefixed is a rewrite. `'always'` and
`'never'` are the only modes with a plausible no-proxy story.

---

## Appendix B — env

Extends the existing "Locale / currency" block in `.env.local.example`. The
current keys keep working; `_LANG` just becomes the default rather than the only
one.

```bash
# Locale / currency. `LOCALE` is the OpenGraph form (es_AR), `INTL_LOCALE` the
# Intl.NumberFormat form (es-AR) — they are not interchangeable.
NEXT_PUBLIC_SITE_LANG=es
NEXT_PUBLIC_SITE_LOCALE=es_AR
NEXT_PUBLIC_SITE_INTL_LOCALE=es-AR
NEXT_PUBLIC_SITE_CURRENCY=ARS

# i18n switch. Comma-separated, first entry is the default and must equal
# NEXT_PUBLIC_SITE_LANG. Must be a subset of CAPTION_LANGUAGES in
# lib/mux/caption_languages.ts, or the subtitle picker offers languages the UI
# does not have.
NEXT_PUBLIC_SITE_LOCALES=es,en,pt

# Pinned so server and client format dates identically. One per deployment —
# this is the operator's market, not the reader's device.
NEXT_PUBLIC_SITE_TIMEZONE=America/Argentina/Buenos_Aires
```

Note the deliberate asymmetry with `locales` in `i18n/routing.ts`: next-intl
needs its locale list at build time for `generateStaticParams` and the
`pathnames` map, so the env var is a deployment-time cross-check, not the source
of truth. If you make it authoritative, static rendering goes with it.

---

## Appendix C — `AGENTS.md` block

next-intl documents an agent-rules pattern; this repo's `AGENTS.md` currently
holds only the Next.js stub. Append:

```markdown
## Internationalization

- All user-facing strings go through `useExtracted()` / `getExtracted()` from
  next-intl. Never hardcode a string in JSX.
- Use ICU arguments, never string concatenation or `? :` pluralization — a
  translator needs the whole sentence.
- Import `Link`, `redirect`, `useRouter`, `usePathname` and `getPathname` from
  `@/i18n/navigation`, never from `next/link` or `next/navigation`.
- Never call `.toLocaleString()` / `.toLocaleDateString()` or construct
  `Intl.*` directly. Use `useFormatter()` / `getFormatter()`.
- Outside a request (email templates, crons), use `createTranslator` /
  `createFormatter` from `use-intl/core` with an explicit locale.
- Do not translate message catalogs yourself — write the source locale and leave
  target locales for a translator.
```

---

## Appendix D — error messages you will actually see

| Message | What it means |
| --- | --- |
| *"Unable to find `next-intl` locale because the proxy/middleware didn't run on this request and no `locale` was returned in `getRequestConfig`"* | **The single most common failure.** Routing mode: the matcher is wrong, or the file is named `middleware.ts` and Next 16 is looking for `proxy.ts`. Non-routing mode: return an explicit `locale`. next-intl calls `notFound()` when no locale resolves, so you also need a not-found page. |
| *"Failed to call `useTranslations` because the context from `NextIntlClientProvider` was not found"* | Either no provider above this component, or something you believed was a Server Component got pulled into the client graph. Pass it via `children` instead of importing it. |
| *"`usePathname` is not supported in Server Components"* | Use `getPathname` (or `Link`) there. |
| Dates or numbers differ between server and client render | `timeZone` not pinned in `getRequestConfig`, or a bare `.toLocaleString()` survived the §8 sweep. |
| `runtime` config throws in `proxy.ts` | Proxy is Node-only in Next 16 and the runtime is not configurable. Keep `middleware.ts` if you genuinely need edge. |

Two upstream doc bugs, so you do not lose time to them: next-intl's TypeScript
page shows `import {createNextIntlPlugin}` as a **named** import (the module has a
default export only), and its sitemap example `await`s the synchronous
`getPathname`.

---

## Unresolved, verify before relying on it

Four things could not be confirmed from documentation and are worth a scratch test
rather than a guess:

1. **`next/root-params` on Next 16.2.4.** The module and the
   `experimental.rootParams` flag both exist in the installed 16.2.4, but Next's
   version history says 16.3.0 introduced it and the flag is undocumented. Bumping
   to 16.3.x removes the question.
2. **`middleware.ts` and `proxy.ts` both present.** Next's docs never state the
   precedence. Reports say `proxy.ts` wins silently. Do not ship both.
3. **`skipTrailingSlashRedirect: true` × next-intl.** No documentation on either
   side. next-intl reads `trailingSlash` from `next.config.ts`, but
   `skipTrailingSlashRedirect` is a different flag that hands slash normalization
   to the proxy — so next-intl may see `/es/courses/` un-normalized and not treat
   it as `/es/courses`. **This repo has the flag on** and cannot simply turn it off
   (PostHog needs it). Test `/`, `/es/`, `/es/dashboard/` and `/rz-ev/e/`
   explicitly. If slashed URLs misbehave, normalize them yourself at the top of
   `proxy()` before calling the i18n handler.
4. **Importing `@/i18n/navigation` inside the proxy bundle**, for
   `getPathname` — `createNavigation` transitively pulls in `next/navigation`.

---

*Verified against the repo on 2026-08-17: `proxy.ts`, `app/layout.tsx`,
`lib/seo/site.ts`, `lib/seo/jsonld.ts`, `lib/seo/private-metadata.ts`,
`app/sitemap.ts`, `app/robots.ts`, `instrumentation-client.ts`,
`lib/mux/caption_languages.ts`, `lib/email/templates/*`, and the 34 formatting
call sites. Library facts from next-intl 4.13.7 and the Next.js 16.3 `proxy`
reference. `useExtracted`, `precompile` and `createMessagesDeclaration` are
experimental — re-check the exact config shapes above before relying on them.*
