import type { Metadata } from "next";

/**
 * Robots directives for pages that must not appear in search results.
 *
 * These pages are deliberately *not* blocked in robots.txt: several are already
 * crawlable and may already be indexed, and a Disallow would stop the crawler
 * from ever seeing this directive — leaving them in the index permanently.
 * Let it fetch the page, read the noindex, and drop the URL.
 */
export const NOINDEX: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
    },
};

/** `NOINDEX` plus a title, for pages that want both. */
export function noindexMetadata(title: string): Metadata {
    return { ...NOINDEX, title };
}
