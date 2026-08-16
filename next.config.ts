import type { NextConfig } from "next";

// No `serverExternalPackages` entry for the database driver: Next already ships
// both `@libsql/client` and its native `libsql` addon in its built-in list
// (`next/dist/lib/server-external-packages.jsonc`), so adding only the former
// here would be redundant and misleadingly incomplete.
const nextConfig: NextConfig = {
  // PostHog ingestion is proxied through our own origin so ad-blockers (common
  // in the LATAM consumer market this sells to) can't silently delete the
  // funnel. The path is deliberately opaque — blocklists match on obvious
  // names like /analytics, /track or /posthog.
  async rewrites() {
    return [
      {
        source: "/rz-ev/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/rz-ev/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required by PostHog's API, which depends on trailing slashes being preserved.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      // UploadThing — course/product cover images
      { protocol: "https", hostname: "utfs.io", pathname: "/f/**" },
      // Mux — video thumbnails
      { protocol: "https", hostname: "image.mux.com", pathname: "/**" },
      // YouTube — coaching video thumbnails
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
      // better-upload — S3-hosted uploaded images (images/PDFs covers)
      { protocol: "https", hostname: "*.s3.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "*.s3.us-east-2.amazonaws.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
