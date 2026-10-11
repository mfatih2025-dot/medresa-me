import type { NextConfig } from "next";
import { legacyRedirects } from "./src/seo/legacy";

/** Never in search results: administration, its sign-in, previews and internal APIs. */
const privateSources = ["/admin", "/admin/:path*", "/admin-preview/:path*", "/ulaz7", "/ulaz7/:path*", "/api/admin/:path*"];
const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A 404 for addresses outside every route (the root layout is per locale: app/[locale]/layout.tsx).
  experimental: { globalNotFound: true },
  images: {
    formats: ["image/avif", "image/webp"],
    // Media of the latest Instagram/Facebook posts (Meta Graph API, see src/lib/social).
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  async headers() {
    return [
      ...privateSources.map((source) => ({ source, headers: noindex })),
      // Temporary Vercel addresses (previews and the deployment URL) are never indexed;
      // only the production domain is (canonical: src/seo/config.ts).
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "(?<host>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      // The bare domain → www (one canonical host), keeping the path.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "medresa.me" }],
        destination: "https://www.medresa.me/:path*",
        statusCode: 301 as const,
      },
      // The old WordPress medresa.me → the new pages (see src/seo/legacy.ts).
      ...legacyRedirects(),
    ];
  },
};

export default nextConfig;
