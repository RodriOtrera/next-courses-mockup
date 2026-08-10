/**
 * schema.org JSON-LD builders.
 *
 * Types are hand-rolled rather than pulled from `schema-dts`: that package
 * ships ~1MB of .d.ts and measurably slows tsc, and we need roughly six of its
 * ~2000 types. Adopting it later is a devDependency plus an annotation — no
 * runtime change.
 *
 * Every builder returns `object | null`. `null` means "emit nothing" and is the
 * mechanism that keeps invalid values out of the output entirely: an absent
 * property is fine, a `null` one is a validation error that can suppress the
 * whole rich result.
 */
import { SITE, absoluteUrl } from "./site";

type JsonLdNode = Record<string, unknown>;

export function organizationJsonLd(): JsonLdNode {
    return {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl(SITE.organizationLogo),
    };
}

export function webSiteJsonLd(): JsonLdNode {
    return {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: SITE.name,
        url: absoluteUrl("/"),
        description: SITE.description,
        inLanguage: SITE.lang,
        publisher: { "@id": absoluteUrl("/#organization") },
    };
}

export function breadcrumbJsonLd(
    items: ReadonlyArray<{ name: string; path: string }>,
): JsonLdNode | null {
    if (items.length === 0) return null;
    return {
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

/**
 * Omitted entirely when there are no reviews.
 *
 * This guard is the important one. `JSON.stringify({ratingValue: NaN})` does
 * not throw — it emits `{"ratingValue":null}`, which Google reads as invalid
 * and can use to suppress the entire rich result for the page. Worse, the
 * upstream value used to default to 4.5, which would have published a
 * fabricated rating: a fake-reviews structured-data policy violation.
 */
export function aggregateRatingJsonLd(args: {
    rating: number | null;
    reviewCount: number;
}): JsonLdNode | null {
    const { rating, reviewCount } = args;
    if (reviewCount <= 0) return null;
    if (rating === null || !Number.isFinite(rating)) return null;

    return {
        "@type": "AggregateRating",
        ratingValue: Number(rating.toFixed(2)),
        reviewCount,
        bestRating: 5,
        worstRating: 1,
    };
}

export function offerJsonLd(args: {
    price: number;
    currency: string;
    path: string;
    available: boolean;
}): JsonLdNode | null {
    const { price, currency, path, available } = args;
    // A course priced at 0 is "Consultar" in this UI, not free. Advertising
    // price: 0 for something you actually sell is a rich-result policy problem,
    // so no Offer is emitted until a real price exists.
    if (!Number.isFinite(price) || price <= 0) return null;

    return {
        "@type": "Offer",
        price: String(price),
        priceCurrency: currency,
        availability: available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: absoluteUrl(path),
        category: "Paid",
    };
}

export function faqPageJsonLd(
    faqs: ReadonlyArray<{ question: string; response: string }>,
): JsonLdNode | null {
    if (faqs.length === 0) return null;
    return {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.response },
        })),
    };
}

/**
 * `duracion` is free text ("8 semanas"), but courseWorkload requires an ISO
 * 8601 duration. Anything unrecognised yields null and the field is dropped —
 * emitting the raw string would be invalid markup.
 */
export function parseWorkload(duracion: string | null | undefined): string | null {
    const text = String(duracion ?? "").toLowerCase().trim();
    if (!text) return null;

    const match = text.match(
        /(\d+(?:[.,]\d+)?)\s*(semanas?|horas?|hs?\b|d[ií]as?|meses|mes|a[nñ]os?)/,
    );
    if (!match) return null;

    const amount = Math.round(Number(match[1]!.replace(",", ".")));
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const unit = match[2]!;
    if (unit.startsWith("semana")) return `P${amount}W`;
    if (unit.startsWith("hora") || unit === "h" || unit === "hs") return `PT${amount}H`;
    if (unit.startsWith("d")) return `P${amount}D`;
    if (unit.startsWith("mes")) return `P${amount}M`;
    if (unit.startsWith("a")) return `P${amount}Y`;
    return null;
}

type CourseLike = {
    slug: string;
    title: string;
    descripcion: string;
    duracion: string | null;
    img_url: string | null;
    price: number;
    price_usd: number;
    is_public: boolean;
    rating: number | null;
    reviewCount: number;
    instructors: ReadonlyArray<{ name: string }>;
    frequentlyAskedQuestions: ReadonlyArray<{ question: string; response: string }>;
};

/**
 * The full `@graph` for a course page — one script tag instead of four, which
 * also lets nodes cross-reference cleanly by @id.
 */
export function buildCourseGraph(course: CourseLike): JsonLdNode {
    const path = `/cursos/${course.slug}`;
    const url = absoluteUrl(path);

    const offers = [
        offerJsonLd({
            price: course.price,
            currency: SITE.currency,
            path,
            available: course.is_public,
        }),
        offerJsonLd({
            price: course.price_usd,
            currency: "USD",
            path,
            available: course.is_public,
        }),
    ].filter((o): o is JsonLdNode => o !== null);

    const aggregateRating = aggregateRatingJsonLd({
        rating: course.rating,
        reviewCount: course.reviewCount,
    });

    const workload = parseWorkload(course.duracion);

    const courseNode: JsonLdNode = {
        "@type": "Course",
        "@id": `${url}#course`,
        name: course.title,
        description: course.descripcion,
        url,
        inLanguage: SITE.lang,
        // Required by Google, and the field most often missed — its absence
        // invalidates the entire Course item.
        provider: { "@id": absoluteUrl("/#organization") },
        hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            ...(workload ? { courseWorkload: workload } : {}),
        },
    };

    if (course.img_url) courseNode.image = course.img_url;
    if (offers.length > 0) courseNode.offers = offers;
    if (aggregateRating) courseNode.aggregateRating = aggregateRating;
    if (course.instructors.length > 0) {
        courseNode.instructor = course.instructors.map((i) => ({
            "@type": "Person",
            name: i.name,
        }));
    }

    const graph: JsonLdNode[] = [
        organizationJsonLd(),
        courseNode,
    ];

    const breadcrumb = breadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        { name: "Cursos", path: "/courses" },
        { name: course.title, path },
    ]);
    if (breadcrumb) graph.push(breadcrumb);

    const faq = faqPageJsonLd(course.frequentlyAskedQuestions);
    if (faq) graph.push(faq);

    return { "@context": "https://schema.org", "@graph": graph };
}

export function buildSiteGraph(): JsonLdNode {
    return {
        "@context": "https://schema.org",
        "@graph": [organizationJsonLd(), webSiteJsonLd()],
    };
}
