import type { MetadataRoute } from "next";
import { absoluteUrl, indexable, privatePaths } from "@/seo/config";

/**
 * robots.txt: the whole public site may be crawled (pages, images, styles and
 * scripts); private routes may not. A preview deployment disallows everything.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Article images published from the Admin are served at /api/news/media/ and stay crawlable.
    rules: { userAgent: "*", allow: ["/", "/api/news/media/"], disallow: privatePaths },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
