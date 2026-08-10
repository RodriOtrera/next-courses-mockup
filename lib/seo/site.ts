/**
 * Canonical site identity — the single source of truth for absolute URLs and
 * brand strings used in metadata, sitemap, robots and JSON-LD.
 *
 * This repo is a white-label base redeployed per client, so every value here is
 * env-overridable and nothing brand-specific may be hardcoded. Before this
 * module existed, `https://axeldubin.com` was baked into the course page's
 * `metadataBase`, which silently followed the template to every new client.
 */

function normalizeUrl(raw: string): string {
    const trimmed = raw.trim().replace(/\/+$/, "");
    // Vercel exposes bare hostnames; everything downstream needs a scheme.
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Resolution order is deliberately NOT the same as `lib/api/client.ts`.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` must precede `VERCEL_URL`: the latter is the
 * per-deployment hostname (`app-git-abc123.vercel.app`), so preferring it would
 * make every preview deployment emit canonicals pointing at itself. If one of
 * those got crawled, ranking signals would be split across throwaway hostnames.
 */
export function resolveSiteUrl(): string {
    const candidate =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.VERCEL_URL;

    return candidate ? normalizeUrl(candidate) : "http://localhost:3000";
}

/** Absolute origin, never with a trailing slash. */
export const SITE_URL = resolveSiteUrl();

/**
 * Build an absolute URL from a root-relative path.
 *
 * Trailing slashes are stripped because `skipTrailingSlashRedirect: true` in
 * next.config.ts (required by the PostHog proxy rewrites) means `/x` and `/x/`
 * both serve 200. Canonicals and sitemap entries must agree on exactly one
 * form, and that form is the one without the slash.
 */
export function absoluteUrl(path = "/"): string {
    if (/^https?:\/\//i.test(path)) return path;
    const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
    const trimmed =
        withLeadingSlash === "/" ? "" : withLeadingSlash.replace(/\/+$/, "");
    return `${SITE_URL}${trimmed}`;
}

export const SITE = {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "Academia Online",
    shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || "Academia",
    description:
        process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
        "Cursos online, ebooks y programas para llevar tu conocimiento al máximo.",
    lang: process.env.NEXT_PUBLIC_SITE_LANG || "es",
    locale: process.env.NEXT_PUBLIC_SITE_LOCALE || "es_AR",
    /** Intl locale for currency formatting — distinct from the OG locale format. */
    intlLocale: process.env.NEXT_PUBLIC_SITE_INTL_LOCALE || "es-AR",
    currency: process.env.NEXT_PUBLIC_SITE_CURRENCY || "ARS",
    defaultOgImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/opengraph-image.png",
    organizationLogo: process.env.NEXT_PUBLIC_SITE_LOGO || "/opengraph-image.png",
    twitterHandle: process.env.NEXT_PUBLIC_SITE_TWITTER || undefined,
} as const;

/** Shared currency formatter — correct locale, so ARS renders `$ 25.000`. */
export const priceFormatter = new Intl.NumberFormat(SITE.intlLocale, {
    style: "currency",
    currency: SITE.currency,
    maximumFractionDigits: 0,
});

/**
 * Destination for "featured course" CTAs on the marketing pages.
 *
 * These used to hardcode one client's course UUID directly in shared component
 * source, which 404s on every other deployment of this white-label base.
 * Falls back to the catalogue when unset.
 */
export function featuredCoursePath(): string {
    const slug = process.env.NEXT_PUBLIC_FEATURED_COURSE_SLUG?.trim();
    return slug ? `/cursos/${slug}` : "/courses";
}

/**
 * Flatten operator-authored rich text into a meta description.
 * Descriptions come from a <Textarea> and may contain markup and newlines.
 */
export function toMetaDescription(raw: string | null | undefined, max = 155): string {
    const text = String(raw ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
