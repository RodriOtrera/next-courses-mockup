cd# UI Design Brief — Course Platform Base

## 1. Purpose & how to use this document

This document maps the complete UI surface of a reusable **course platform base** (Next.js App Router) so a designer — human or AI — can produce a **specific brand design** for a new client without reading the codebase.

It describes: every screen and its sections, the design-token system, which UI elements should take the **primary brand color**, **secondary/surface background**, **accent**, etc., and where the current code deviates from the token system (hardcoded colors that a re-theme must sweep).

**How to use:** fill in the *Client Brand Inputs* in §2 with the client's brand, then ask for a design that maps those inputs onto the token roles and screen annotations in §4–§6. Everything branded in the current code (previous client "Axel Dubin", calisthenics niche, gold/red/Spartan visuals, Spanish copy) is **placeholder content to be replaced** — see §8.

**Constraint that shapes everything:** the inputs in §2 are not free-form. They mirror, 1:1, the customization settings the companion builder platform (`next-course-ultimate`) exposes to clients — appearance, component layout variants, and page blocks. A valid design must be **fully expressible in those knobs**; anything outside them becomes one-off hardcoded work.

---

## 2. Client Brand Inputs (fill in before designing)

These fields map directly to the platform's per-project settings tables (`projectAppearance`, `projectComponents`, `projectPages`/`projectPageBlocks`, and the per-page config tables). Fill in the *Chosen* columns with the client's answers.

### 2.1 Appearance (platform: `projectAppearance`)

| Setting | Allowed values | Chosen | Drives |
|---|---|---|---|
| Theme | `light` / `dark` / `system` | _(fill in)_ | Whether paper is light or dark. Mockup is currently dark-only — see §3 |
| **Primary color** | any hex (picker offers 17 Tailwind hues × 11 shades) | _(fill in)_ | **Ink**: headings, body text — and via alpha ramps (§2.2) all borders, dividers, and surface tints |
| **Accent color** | any hex | _(fill in)_ | **The brand pop**: CTAs, links, active states, featured badges, progress |
| **Neutral color** | any hex | _(fill in)_ | **Paper**: page background and base surface |
| Heading font | Poppins · Inter · DM Sans · Plus Jakarta Sans · Nunito · Outfit | _(fill in)_ | Hero titles, section headings |
| Body font | same six | _(fill in)_ | Everything else |
| Border radius | `sm` / `md` / `lg` / `xl` / `full` | _(fill in)_ | Corner radius across buttons, cards, inputs |
| Logo / favicon | image uploads | _(fill in)_ | Navbar, dashboard sidebar, footer, browser tab |
| Brand description | free text | _(fill in)_ | Copy voice; context for generated content |
| Brand assets | image/file uploads | _(fill in)_ | Hero backgrounds, section imagery |

> ⚠ **Naming trap:** the platform's **primary = ink/foreground** (it's near-black in every factory preset), and its **accent = what shadcn calls "primary"** (the CTA color). Neutral = background. §4 gives the exact token translation for this codebase.

### 2.2 Derived color system — 3 hex values generate everything

The platform never collects a full palette. It expands the three colors into ramps by alpha-compositing (implementation reference: `template-appearance-scope.tsx` in the builder):

| Ramp | Derivation | Used for |
|---|---|---|
| `paper-0/50` | neutral as-is | Page background |
| `paper-100…500` | primary @ 4 / 8 / 14 / 22 / 32 % over neutral | Card fills, hover fills, borders, dividers |
| `ink-900` | primary as-is | Headings, strong text |
| `ink-700/500/300/100` | primary @ 78 / 55 / 38 / 18 % | Body text → muted text → placeholders → hairlines |
| `accent-500/400` | accent as-is | CTAs, links, active states |
| `accent-200/100` | accent @ 25 / 12 % | Tinted fills, badges, hover washes |

**Design implication:** no element may depend on a hand-picked fourth color. Every screen must look right *generatively* for any 3-color combination a client picks. The re-theme of this codebase should derive its shadcn tokens with the same ramp logic (§4).

### 2.3 Component layout variants (platform: `projectComponents`)

Clients pick one variant per component. The design must specify the chosen variant — or, for a template-grade design, all of them — using only the derived palette + radius + fonts:

| Component | Variants | Chosen |
|---|---|---|
| Navbar | `classic` / `centered` / `pill` / `banner` | _(fill in)_ |
| Footer | `columns` / `minimal` / `centered` / `newsletter` | _(fill in)_ |
| Course card layout | `card` / `row` / `featured` | _(fill in)_ |
| Course card icon | `play` / `book` / `lightbulb` / `zap` / `code` / `graduation` | _(fill in)_ |
| Course rating icon | `star` / `heart` / `flame` / `thumbs` / `trophy` / `sparkle` | _(fill in)_ |
| Testimonials | `grid` / `highlight` / `list` / `wall` | _(fill in)_ |
| Modules list | `accordion` / `thumbnails` / `timeline` / `compact` | _(fill in)_ |
| Quiz (cuestionario) | `immersive` / `paper` / `inline` | _(fill in)_ |
| Course sales page layout | `standard` / `focused` | _(fill in)_ |
| Ebook page layout | `imageLeft` | imageLeft |

### 2.4 Page & block system (platform: `projectPages` + `projectPageBlocks`)

Marketing pages are assembled from ordered, client-configured **content blocks**. Block designs must tolerate arbitrary text length and item count:

| Block | Client-configurable content |
|---|---|
| `intro` | title, description, CTA label + href, optional background image, title/description size `xs`–`2xl` |
| `hero` | title, description, image left/right, aspect ratio `1:1 · 4:3 · 3:2 · 16:9 · 3:4 · 9:16` |
| `stats` | optional heading, N value+label pairs |
| `features` | eyebrow, heading, subtitle, N items with icon from a fixed 12-icon set (globe, hammer, sparkles, check, play, layoutGrid, pencil, clock, quote, star, shield, rocket) |
| `benefits` | heading, subtitle, N checklist strings |
| `testimonials` | eyebrow, heading, N quotes (quote, name, role, site) |
| `pricing` | eyebrow, heading, subtitle, N plans (name, price, description, feature list, `featured` flag) |
| `cta` | heading, subtitle, button label + href |
| `cuestionario` | eyebrow, heading, subtitle, pass threshold, N questions with options |

Clients also control per page: enabled/disabled, order, SEO title + description; plus page-level settings — courses page heading/description, course page section headings + FAQ items, ebook page headings, certification reference image.

### 2.5 Reference presets — the range the design must cover

The platform ships three factory templates; a new client design is effectively a **fourth preset expressed in the same knobs**:

| Preset | Theme | Ink (primary) | Accent | Paper (neutral) | Fonts (heading / body) | Radius |
|---|---|---|---|---|---|---|
| Pulse — fitness | light | `#1A0B1A` | `#FF1F6B` | `#FFF4F7` | Bricolage Grotesque / DM Sans | `lg` |
| Studio — tech | light | `#0F1115` | `#5B6CFF` | `#FAFAFB` | Bricolage Grotesque / DM Sans | `md` |
| Mono — brutalist | light | `#000000` | `#FFD400` | `#FFFFFF` | Space Mono / Space Mono | `sm` |

(Factory templates use fonts beyond the six-item client picker — Bricolage Grotesque, Space Mono — so custom fonts are possible at template level, just not client-swappable.)

### 2.6 Not client-configurable — designer decides

These have no platform knob; the design must fix them so they harmonize with any palette:

- **Brand name** — comes from the project name; wordmark treatment is a design decision.
- **Semantic colors** (success / warning / destructive) — derive standard hues tuned to sit well on the chosen paper; used for quiz feedback, delete dialogs, toasts, `--destructive`.
- **Imagery / iconography style** — replaces the Spartan/Greek SVG set (§8); icon choices beyond the fixed sets in §2.3–2.4 are design-level.
- **Motion & animation intensity** — the old brand's glow/shimmer/conic effects (§7) have no platform equivalent; decide what survives, driven by the accent ramp.

---

## 3. Tech & theming facts the design must respect

- **Stack:** Next.js App Router, React Server Components, TypeScript, **Tailwind v4 (CSS-first — no `tailwind.config.ts`; theme lives in `@theme inline` inside `app/globals.css`)**, shadcn/ui primitives (Radix), Framer Motion, Recharts, sonner toasts.
- **shadcn config** (`components.json`): style `default`, baseColor `slate`, CSS variables ON. (Note: its `tailwind.config`/`css` paths are stale; real stylesheet is `app/globals.css`.)
- **Token format:** HSL triplets on `:root` (e.g. `--primary: 0 0% 98%`), mapped to Tailwind color utilities via `@theme inline` (`--color-primary: hsl(var(--primary))`). Restyling the tokens restyles every shadcn primitive automatically.
- **Dark mode:** the app is **permanently dark** today — `:root` and `.dark` are identical, `body { background-color: #0a0a0a }` is hardcoded, and there is no ThemeProvider (`next-themes` is installed but only used internally by the toast component). If the client wants light mode or a toggle, that's new work the design should specify.
- **Fonts:** root layout loads **Geist + Geist Mono**; the dashboard layout loads **Montserrat** (weights 100–900) and `--font-sans` in `globals.css` points at Montserrat. Result: `font-sans` only resolves to Montserrat *inside the dashboard*; public pages fall back to Arial. The design should pick one coherent font strategy — this is a known inconsistency to fix, not a feature.
- **Radii:** `--radius: 0.5rem` with derived `sm/md/lg/xl` steps.
- **Language:** real UI copy is **Spanish** (Argentine market: ARS pricing, MercadoPago + PayPal). Auth pages and the `/courses` catalog are in English (newer additions). Content language is a client decision.

---

## 4. Design token map

Current values are a grayscale shadcn "slate dark" set — **the brand palette does not exist in tokens yet**. This is the primary surface to re-theme.

| Token (`app/globals.css`) | Current value (HSL) | Semantic role | Should be driven by |
|---|---|---|---|
| `--background` | `240 10% 3.9%` (near-black) | Page background | Brand background (dark base or light, per client) |
| `--foreground` | `0 0% 98%` | Default text | Text color on background |
| `--card` / `--card-foreground` | `240 10% 3.9%` / `0 0% 98%` | Card surfaces (currently same as background — cards rely on borders) | **Secondary/surface background** — give cards real elevation |
| `--popover` / `--popover-foreground` | same as card | Dropdowns, popovers, command menus | Surface background |
| `--primary` / `--primary-foreground` | `0 0% 98%` / `240 5.9% 10%` (white on black!) | Buttons, CTAs, active states | **Primary brand color** |
| `--secondary` / `--secondary-foreground` | `240 3.7% 15.9%` / `0 0% 98%` | Secondary buttons, subtle fills | Secondary background / muted brand tone |
| `--muted` / `--muted-foreground` | `240 3.7% 15.9%` / `240 5% 64.9%` | Disabled fills, secondary text | Neutral derived from brand background |
| `--accent` / `--accent-foreground` | `240 3.7% 15.9%` / `0 0% 98%` | Hover fills, highlights | **Accent color** |
| `--destructive` / `--destructive-foreground` | `0 62.8% 30.6%` / `0 0% 98%` | Delete/danger actions | Semantic destructive |
| `--border` / `--input` | `240 3.7% 15.9%` | Borders, input outlines | Neutral border derived from surfaces |
| `--ring` | `240 4.9% 83.9%` | Focus rings | Primary brand color (accessibility: keep visible contrast) |
| `--radius` | `0.5rem` | Corner radius | Brand radius feel |
| `--font-sans` (`@theme`) | Montserrat → Arial fallback | Global typeface | Brand body typeface |

**Translation from platform inputs (§2.1) to these tokens** — the exact mapping a re-theme should implement, using the §2.2 ramp logic:

| Platform setting | shadcn token(s) in this codebase |
|---|---|
| **Neutral color** (paper) | `--background`, `--popover`; `--card` = neutral + primary @ 4–8% (gives cards real elevation — fixes §9.9) |
| **Primary color** (ink) | `--foreground`, `--card-foreground`, `--popover-foreground`; `--border` / `--input` = primary @ ~14%; `--muted-foreground` = primary @ ~55%; `--secondary` / `--muted` / `--accent` (hover fills) = primary @ 4–8% |
| **Accent color** (pop) | `--primary` + contrast-checked `--primary-foreground` (CTAs), `--ring`, tinted fills at 12–25% alpha (badges, hover washes) |
| Border radius `sm`–`full` | `--radius` |
| Heading / body fonts | `--font-sans` (body) + a new `--font-heading` token (doesn't exist yet — add it) |
| Theme `light` / `dark` / `system` | distinct `:root` vs `.dark` values + a mounted ThemeProvider (net-new — see §3) |

**Missing token families the design should add** (these UI areas currently use hardcoded colors instead):

- **Sidebar tokens** (`--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-border`…) — the dashboard sidebar uses raw `neutral-900/950` classes.
- **Chart tokens** (`--chart-1` … `--chart-5`) — Recharts dashboard charts use a hardcoded gray array + red accent.
- **Rating/highlight token** — ratings use hardcoded amber/gold stars today; the platform makes the rating *icon* client-selectable (star/heart/flame/thumbs/trophy/sparkle, §2.3), so the design should color it from the accent ramp (or fix a rating hue as a §2.6 designer decision) rather than assume gold stars.

---

## 5. Screen inventory with color-role annotations

Legend for annotations: **[P]** primary brand color · **[S]** secondary/surface background · **[A]** accent · **[BG]** page background · **[M]** muted text.

In platform terms (§2.1–2.2): **[P]** = the client's *accent* color (CTA pop) · **[S]** = `paper-100/200` (primary-tinted surface) · **[A]** = accent tints (`accent-100/200`) · **[BG]** = *neutral* (paper) · **[M]** = `ink-500`. Components marked **⚙** have client-selectable layout variants (§2.3).

### 5.1 Public marketing (route group `app/(home)/`)

| Route | File | Status |
|---|---|---|
| `/` | `app/(home)/page.tsx` | **Stub** — renders only "Mockup Home" on black. **This is the page the design must invent.** |

- **Navbar ⚙** (`app/(home)/_components/Navbar.tsx`) — exists but **is not mounted by any layout** (pages reserve space for it with `pt-16`). Fixed, blur over dark. Left: logo/avatar **[P for logo mark]**. Center links: HOME / PRODUCTOS / COACHING + "MIS CURSOS" dropdown with course progress **[P for active link + progress bars]**. Right: INGRESAR / REGISTRARSE **[P for the register CTA]**. Mobile: hamburger + drawer **[S drawer surface]**. *Platform variants: `classic` / `centered` / `pill` / `banner`.*
- **Footer ⚙** (`app/(home)/_components/Footer.tsx`) — also unmounted. Brand column + tagline, social icons row **[A on hover]**, navigation links **[M]**, contact column, "Empezar ahora" CTA **[P]**, copyright **[M]**. **[S background, one step above page BG]**. *Platform variants: `columns` / `minimal` / `centered` / `newsletter`.*
- **Unused building blocks** ready for the new home page, all in `app/(home)/_components/`: `HeroCarousel` (full-bleed hero **[BG + P CTA]**), `FeaturedProducts` + `CardUI` (product cards **[S cards, P price/CTA]** — currently colored by a hardcoded red/blue/green map in `cardColors.ts`), `StatsStrip` + `Stat` + `AnimatedCounter` (metrics band **[A numbers]**), `TestimonialsMarquee` / `TestimonialsStacked` (social proof **[S cards]**), `CoachingGeneral` / `CoachingVip` (pricing/offer sections — VIP uses gold glow classes `.price-glow`/`.btn-vip` **[A or premium tier color]**), `FlipWords`, `TitleAnimation`, `TextFadeIn`, `BackgroundLines`, `MouseMask` (decorative motion **[A at low opacity]**).
- **These map to the platform's block system (§2.4):** the home page should be designed as a stack of the nine block types — `intro`/`hero` (≈ HeroCarousel), `stats` (≈ StatsStrip), `features`, `benefits`, `testimonials` (≈ TestimonialsMarquee/Stacked), `pricing` (≈ CoachingGeneral/Vip), `cta` — so client-built pages inherit the design automatically, whatever blocks they enable and in whatever order.

### 5.2 Course consumption (route group `app/(home)/`)

- **`/courses` ⚙** — public catalog. Page header (title + course count **[M]** — heading/description are client-editable, §2.4), 1/2/3-column grid of course cards: thumbnail, title, duration/modules/rating meta chips **[A icons, M text]**, ARS/USD price **[P]**. Card surface **[S]** with hover lift. Empty state **[M]**. *Platform variants: card layout `card` / `row` / `featured`; card icon (6 options) and rating icon (6 options) — see §2.3. The rating icon choice replaces the hardcoded gold star.*
- **`/cursos/[id]` ⚙** — course **sales page** (the most designed screen). *Platform page layout: `standard` / `focused`; section headings and FAQ items are client-editable (§2.4).* Sections top→bottom:
  1. **Hero** (`components/course/backgroundCourse.tsx`) — full-width image background with dark overlay, course title, enroll CTA **[P]**.
  2. **Welcome/tips block** — image + checklist ("Tips para sacarle el máximo provecho… VAMOS CON TODO!") **[S panel, P check icons]**.
  3. **Stats bar** — modules / classes / duration / certification chips with icons (currently red icon chips) **[A chips]**.
  4. **Modules list ⚙** (shadcn accordion + `ModuleItemContainer`) beside an **intro video** (`YoutubePlayer`) **[S rows, P expanded state]**. *Platform variants: `accordion` / `thumbnails` / `timeline` / `compact`.*
  5. **Description** (`DescripcionCurso`) + **Benefits** (`BeneficiosCurso`) **[BG, M body text, P keyword spans — currently `.red-span #ec4e39`]**.
  6. **Testimonials ⚙** (`TestimonialCarousel`) **[S cards, rating icon per §2.3 — replaces gold stars]**. *Platform variants: `grid` / `highlight` / `list` / `wall`.*
  7. **FAQ grid** (`PreguntaFrecuenteContainer`) **[S panels]**.
- **`/module/[id]`** — **lesson viewer** (enrolled learner). Two-zone layout: main content column renders video (Mux) / PDF / quiz via `components/module/ModuleChecker` **[BG, P primary action buttons like "mark complete"]**; right sticky **progress sidebar** (340px, `ModuleProgressSidebar`) listing modules/lessons with completion state **[S surface, P progress indicators/checkmarks]**. Mobile: sidebar becomes a sheet drawer opened by a floating action button (currently red) **[P FAB]**. **Quiz ⚙** feedback uses green/red correct-incorrect **[semantic success/destructive — §2.6]**. *Platform quiz variants: `immersive` / `paper` / `inline`; pass threshold and questions are client content (§2.4).*

### 5.3 Auth (top-level routes, root layout only)

- **`/login`**, **`/signup`**, **`/verify-otp`** — centered narrow cards (max-w-sm, bordered) on page background: heading, inputs, one primary CTA **[P]**, cross-links login↔signup **[M, P on hover]**. OTP page: 6-digit input + resend cooldown. These are the only screens already fully driven by semantic tokens — they restyle for free.

### 5.4 Admin dashboard (route group `app/(dashboard)/`, auth-gated)

- **Layout** — fixed left **sidebar** (`components/dashboard/LateralBarNavigation.tsx`, 220px): brand block "…/ ADMIN" **[P logo]**, user block, two nav groups (*Principal*: Inicio, Cursos, Coachings, Suscripciones; *Contenido*: Email, Testimonios, Ebook, Programas). Active item **[P or A fill]**, inactive **[M]**. Mobile: top bar + slide-in overlay. Sidebar surface **[S — needs the new sidebar tokens]**. Toasts bottom-center (currently hardcoded `#171717` style).
- **`/dashboard`** — overview: 4-column **stat cards** **[S cards, A numbers]**, **charts** (Recharts — needs chart token palette derived from brand) and **payment logs** list + "Asignar Curso" panel **[S panels, M meta text]**. Suspense skeletons throughout **[muted shimmer]**.
- **`/dashboard/cursos`** — header + count + "create course" modal trigger **[P button]**, responsive grid of admin course cards (`CourseContainer`) **[S]**.
- **`/dashboard/coaching`** — coaching content editor (rooms/topics/items CRUD dialog set) **[S panels, P save actions, destructive deletes]**.
- **`/dashboard/subscripciones`** — subscriptions table (has a gradient title using `.gradientTextAnimation` — red/purple, to rebrand) **[S rows, status badges in semantic colors]**.
- **`/dashboard/email`** — email composer/blast **[S editor surface, P send]**.
- **`/dashboard/testimonios`** — create dialog + **live preview** of public testimonial cards + admin grid **[S]**.
- **`/dashboard/ebook`** and **`/dashboard/program`** — product CRUD: header + "Crear" button **[P]**, card grids, `create/` and `[id]/edit/` editor pages.

### 5.5 Editor surfaces (legacy/admin, lower design priority)

- **`/editarCurso/[id]`** — inline WYSIWYG course editor mirroring the sales page (editable hero, stats, modules, testimonials, FAQ) plus floating edit menu and dialogs **[same roles as sales page + P edit affordances]**.
- **`/editarCurso/[id]/preview`** (+ `[moduleId]`) — preview shell: top bar with "Volver al editor" + 320px `PreviewSidebar` **[S]**.
- **`/cursosAdmin`** — legacy admin course list (superseded by `/dashboard/cursos`).

---

## 6. Component color-usage map

### 6.1 Token-driven (restyle via tokens only)

`components/ui/*` — shadcn primitives: `accordion, avatar, badge, button, card, checkbox, command, dialog, drawer, dropdown-menu, input, label, navigation-menu, popover, radio-group, select, sheet, skeleton, slider, sonner, textarea` (+ `AnimatedCounter`). These consistently use `bg-primary`, `bg-background`, `text-muted-foreground`, `border-border`, etc. **Changing §4 tokens restyles all of them with zero code edits.**

### 6.2 Hardcoded (must be swept during re-theme)

Custom components almost never use the tokens — they use raw Tailwind palette classes and hex. Map of current color → target brand role:

| Component group | Current colors | Target token role |
|---|---|---|
| `components/dashboard/*` (sidebar, stats, charts) | `neutral-900/950` surfaces, `red-500` accents, chart hex array `#a3a3a3…#262626` + `#ef4444` | Sidebar tokens **[S]**, accent **[A]**, new chart tokens |
| `components/course/*` (hero, description, testimonials, progress, module rows) | `neutral-*` surfaces, `red-*` CTAs/highlights, amber/yellow stars, inline hex in `backgroundCourse`, `EditableCourseHero`, `Star`, `CircleProgressBar` | **[S]** surfaces, **[P]** CTAs/progress, rating token for stars |
| `components/module/*`, `components/questionary/*` (lesson viewer, quizzes) | `neutral-*`, red FAB, green/red answer feedback | **[P]** actions, semantic success/destructive for feedback |
| `components/coaching/*`, `components/admin/*`, `components/edit/*`, `components/payment_logs/*`, `components/uploaders/*` | `neutral-*` panels, `red-*` destructive + accents | **[S]** panels, **[P]** primary actions, `--destructive` |
| `components/navbar/*` (course progress dropdown) | neutral + inline progress color | **[S]** dropdown, **[P]** progress bars |
| `components/spartan/*` (SVG brand icon set: helmet, shield, spear, laurel wreath, crossed swords, meander divider) | Hardcoded gold/bronze gradients (`#d4a030→#b8860b→#8b6914`) | **Replace entirely** with new client iconography (§8) |
| `components/certification/*` (diploma) | Gold/brand styling | Rebrand with client identity |
| `app/(home)/_components/*` (marketing blocks) | Gradients + hex throughout: `cardColors.ts` (red/blue/green map, `#FF0000/#0000FF/#008000`), `CoachingVip` gold glows, `Footer`, `FeaturedProducts`, `TestimonialsMarquee/Stacked`, `TitleOfProducts`, `YoutuDialog` | Rebuild palette from brand inputs; product-tier colors become brand-derived |
| `components/mux/MuxPlayer` | one hardcoded player color | **[P]** player accent |
| Payment icons (`MercadoPagoIcon`, PayPal, `WhatsappIcon`) | Third-party brand hex | **Keep as-is** (external brands) |

---

## 7. Hardcoded-color debt checklist (`app/globals.css` custom classes)

Utility classes in the global stylesheet carry the old brand and must be re-valued (not deleted — components reference them):

| Class / rule | Current value | Replace with |
|---|---|---|
| `body { background-color }` | `#0a0a0a` | `hsl(var(--background))` |
| `.red-span` | `#ec4e39` | Primary brand color (inline keyword highlight used in course descriptions) |
| `.gold-shimmer` | Animated gold gradient `#b8780d→#f8d56b→#ffe680` | Brand premium/accent shimmer (or remove) |
| `.gradientTextAnimation` | `rgb(239,58,58) ↔ #a855f7` animated text gradient | Brand gradient (primary→accent) |
| `.box::after/::before` + `.box.general` | Conic glowing borders — orange set (`#ff8800,#f37c1a,#ff4800,#ff7300,#fbff05`) and blue set (`#48cae4,#0077b6,#0026ff,#2137ff`) | Two brand-tier glow palettes (used for VIP vs general offer cards) |
| `.price-glow`, `.btn-vip:hover` | Gold glow `rgba(245,197,66,…)` | Accent/premium glow |
| `.text` scroll animation | `#afa18f` gradient fill | Brand-neutral text reveal color |
| Scrollbar rules (`html`, `::-webkit-scrollbar*`, `.custom-scrollbar`) | `#646464/#414141/#303030/#000`, `rgba(255,255,255,…)` | Derive from `--muted`/`--border` |
| `.glow-effect` (`--glow-color` consumer) | Set per-component | Feed with brand accent |

Plus outside CSS: `DashboardCharts.tsx` `PRODUCT_COLORS` array, dashboard layout inline toast style (`#171717`), and the inline hex flagged in §6.2 (18 tsx files total contain raw hex/gradients).

---

## 8. Placeholder branding to replace

Everything below belongs to the previous client and is **content, not design system** — the new design should specify its replacement:

- **Name/marks:** "Axel Dubin" / "AXEL DUBIN" / "AD" logo (Navbar, Footer, dashboard sidebar "Axel Dubin / ADMIN", diploma).
- **Domain/metadata:** `axeldubin.com` used as `metadataBase`/OG URL in `app/(home)/cursos/[id]/page.tsx`; root metadata still literally "Create Next App" (`app/layout.tsx`).
- **Tagline/copy:** "Atleta e instructor de Calistenia profesional…", "VAMOS CON TODO!", motivational calisthenics voice — replace with client tone.
- **Social/contact:** Instagram/YouTube `@axeel_dubin`, WhatsApp deep links, one hardcoded WhatsApp group invite inside the lesson viewer.
- **Iconography:** the entire Spartan/Greek SVG set (`components/spartan/*`) is previous-client identity.
- **Market context:** ARS pricing, MercadoPago — keep or change per client's market.
- **Favicon/public assets:** `public/` only has default Next.js SVGs; new brand assets needed.

---

## 9. Known gaps the designer must know

1. **The home page does not exist** — `/` is a one-line stub. The marketing home is a green-field design task; building blocks listed in §5.1 are available but unused.
2. **Navbar and Footer are built but mounted nowhere** — no layout renders them; public pages compensate with `pt-16`. The design should assume they get mounted in `app/(home)/layout.tsx`.
3. **Dead navigation targets:** Navbar/Footer link to `/productos`, `/coaching`, `/micuenta` — those routes don't exist yet.
4. **Several dashboard pages import missing modules** (email composer, subscriptions container, ebook/program editors, `useIsAdmin` hook) — those screens will need their content designed/rebuilt, not just restyled.
5. **No `error.tsx` / `not-found.tsx`** anywhere — error and 404 states are unstyled framework defaults; worth including in the design.
6. **No light mode / theme toggle** — permanently dark (see §3). A light variant is net-new work.
7. **Font inconsistency** — Montserrat only loads inside the dashboard; public pages silently fall back to Arial (see §3).
8. **`app/globals.mockup.css` is dead code** (unimported create-next-app boilerplate) and `components.json` has stale paths — ignore both for design purposes.
9. **Cards have no elevation** — `--card` equals `--background`, so all "cards" are border-only. The new palette should give surfaces a real elevation step.

---

*Generated from repo state on 2026-07-02 (branch `master`). Source of truth for tokens: `app/globals.css`; for screens: `app/**/page.tsx`; for components: `components/**` and `app/(home)/_components/**`. Platform customization model (§2) sourced from the builder repo `next-course-ultimate`: `convex/schema.ts` (`projectAppearance`, `projectComponents`, block configs), `components/home/appearance-panel.tsx` (color/font pickers), `components/templates/template-appearance-scope.tsx` (derived ramps), `lib/templates/{atelier,studio,mono}.ts` (factory presets).*
