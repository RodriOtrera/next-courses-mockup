import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsIdentity from "@/components/analytics/AnalyticsIdentity";
import JsonLd from "@/components/seo/JsonLd";
import { buildSiteGraph } from "@/lib/seo/jsonld";
import { SITE, SITE_URL } from "@/lib/seo/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Set once here so every relative `alternates.canonical` and `openGraph.url`
  // below resolves against the deployment's real origin. Previously this was
  // absent at the root and hardcoded to one client's domain on a single page.
  metadataBase: new URL(SITE_URL),
  title: {
    // `default` is required whenever `template` is set. Note the template does
    // not apply to a `title` in a page.tsx of this same segment.
    default: `${SITE.name} — Cursos online`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  // Literal root-relative path, not "./" — "./" resolves against the request
  // URL and echoes back any trailing slash, which is exactly the duplicate the
  // canonical exists to collapse (skipTrailingSlashRedirect is on for the
  // PostHog proxy rewrites, so /x and /x/ both serve 200).
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: "/",
    title: `${SITE.name} — Cursos online`,
    description: SITE.description,
    images: [{ url: SITE.defaultOgImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Cursos online`,
    description: SITE.description,
    images: [SITE.defaultOgImage],
    ...(SITE.twitterHandle ? { site: SITE.twitterHandle } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      // All user-facing copy is Spanish; this said "en" since the scaffold.
      lang={SITE.lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={buildSiteGraph()} />
        {/* Renders nothing; the client boundary stays confined to this component. */}
        <AnalyticsIdentity />
        {children}
      </body>
    </html>
  );
}
