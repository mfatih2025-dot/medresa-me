import { generations } from "../content/alumni";
import { locales, type Locale } from "../i18n/config";
import { pathFor, type PageId } from "../i18n/routes";

/*
 * The old WordPress medresa.me → the new site, as permanent (301) redirects.
 * Audited against the old site's own sitemaps (post-, page-, category-sitemap.xml
 * and the theme's taxonomy sitemaps), its REST API (posts, pages, media) and the
 * links its pages publish (generation pages, theme demo entries), October 2026.
 * Every old URL goes to its closest real equivalent — never everything to the homepage.
 *
 * Already handled elsewhere (no entry needed here):
 *   /upis/, /historijat/ … all 13 page URLs     same slugs on the new site (Next drops
 *                                               the trailing slash, 308)
 *   /sq/historijat/, /en/upis/ …                the proxy sends a Bosnian slug under
 *                                               /sq or /en to that language's slug (308)
 *   /<article-slug>/, /sq|en/<article-slug>/    all 17 old posts: app/[locale]/[slug] sends
 *                                               them to the article in that language (308)
 *
 * The old pages were served at /, /sq/… and /en/… with the same slugs, so each
 * rule below is applied in all three languages.
 */

/** Old WordPress pages and taxonomies with a real counterpart (page = null: the homepage). */
const pages: { from: string; to: PageId | null }[] = [
  { from: "/home", to: null }, // „Početna“, a second copy of the homepage
  { from: "/dn1", to: "donacije" }, // „Uplata i donacija“
  { from: "/donor-dashboard", to: "donacije" },
  { from: "/vijesti/page/:n(\\d+)", to: "vijesti" }, // WordPress pagination of the news page
  { from: "/category/scholarship/:rest*", to: "vijesti" }, // the old posts' category, titled „Vijesti“
  { from: "/category/uncategorized/:rest*", to: "vijesti" },
  { from: "/event/category/alumni/:rest*", to: "alumni" },
  { from: "/feed", to: "vijesti" }, // the posts' RSS feed → the news it listed
  { from: "/comments/feed", to: "vijesti" },
];

/** The old site's sitemaps → the new sitemap (for crawlers and Search Console). */
const sitemaps = [
  "/sitemap_index.xml",
  "/wp-sitemap.xml",
  "/sitemap.rss",
  "/post-sitemap.xml",
  "/page-sitemap.xml",
  "/category-sitemap.xml",
  "/team-category-sitemap.xml",
  "/rt-research-category-sitemap.xml",
  "/rt-program-category-sitemap.xml",
  "/tribe_events_cat-sitemap.xml",
];

/**
 * Pages of the old site's theme with no counterpart (demo shop, LMS and event
 * templates): answered with 410 Gone (src/proxy.ts), so search engines drop them.
 */
export const gonePaths = [
  "elementor-13919",
  "tech-tools",
  "shop",
  "shop-2",
  "student-registration",
  "instructor-registration",
  "video-home",
  "sample-page",
  "academic-areas-of-unipix-2",
  "event",
  "event-grid",
  "pages",
  "my-account-2",
  "team-category",
  "rt-research-category",
  "rt-program-category",
  // The theme's demo entries behind those categories (English placeholder programmes,
  // research and staff: /rt-program/american-literature/, /teams/jennifer-aarons/ …)
  // and the shop's account page — linked from the old pages, none of them Medresa content.
  "rt-program",
  "rt-research",
  "teams",
  "my-account",
];

/*
 * Old uploads (/wp-content/uploads/…) are not redirected. The one relevant document, the
 * entrance exam results (2026/06/2026-06-22-14-06.pdf), would be redirected only to the
 * same document on the new site, and the new site has no such file (audited October 2026).
 */

type Redirect = { source: string; destination: string; statusCode: 301 };

const prefix = (l: Locale) => (l === "bs" ? "" : `/${l}`);

export function legacyRedirects(): Redirect[] {
  const out: Redirect[] = [];
  for (const l of locales) {
    for (const p of pages) {
      out.push({ source: `${prefix(l)}${p.from}`, destination: pathFor(p.to, l), statusCode: 301 });
    }
    // „e-medresa“ was a page about the school's e-learning platform: the platform itself.
    out.push({ source: `${prefix(l)}/e-medresa`, destination: "https://www.e-medresa.me/", statusCode: 301 });
    // Each generation's page on the old site (/generacija/generacija1/,
    // /generacija/generacija-xv-otvori-pano/ …, recorded in src/content/alumni.ts) →
    // that generation's own place on the Alumni page.
    for (const g of generations) {
      const old = new URL(g.source.page).pathname.replace(/\/$/, "");
      out.push({ source: `${prefix(l)}${old}`, destination: `${pathFor("alumni", l)}#generacija-${g.number}`, statusCode: 301 });
    }
  }
  for (const s of sitemaps) out.push({ source: s, destination: "/sitemap.xml", statusCode: 301 });
  return out;
}
