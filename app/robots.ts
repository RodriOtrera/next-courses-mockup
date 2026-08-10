import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo/site";

/**
 * `Disallow` and `noindex` are mutually defeating: if a URL is blocked from
 * crawling, Google never sees the `noindex` on it, so anything already indexed
 * stays indexed. So the two mechanisms are split by purpose.
 *
 * Disallow here is only for paths that should never be fetched and were never
 * indexable in the first place. Everything that might already be in the index
 * and needs *removing* — /dashboard, /cursosAdmin, /editarCurso, /module,
 * /certificados, /productos/micuenta — carries a `noindex` robots directive in
 * its layout or page metadata instead, so the crawler can see the instruction.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                // First-party PostHog ingestion proxy (next.config.ts rewrites).
                // Nothing here is a page; crawling it just generates junk.
                "/rz-ev/",
                "/login",
                "/signup",
                "/verify-otp",
            ],
        },
        sitemap: absoluteUrl("/sitemap.xml"),
        host: SITE_URL,
    };
}
