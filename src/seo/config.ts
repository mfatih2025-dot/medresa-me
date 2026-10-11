import type { Locale } from "@/i18n/config";

/*
 * The single source of the public site's address and indexability.
 *
 * Every canonical URL, hreflang alternate, sitemap entry, Open Graph URL and
 * JSON-LD identifier is built from `siteUrl`, so moving the site to its final
 * domain (https://www.medresa.me) needs no page edits. A deployment may set
 * SITE_URL (server-side, never public), but a temporary *.vercel.app address is
 * never accepted as canonical: it falls back to the production domain.
 */
const PRODUCTION_URL = "https://www.medresa.me";

function resolveSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return PRODUCTION_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || /\.vercel\.app$/i.test(url.hostname)) return PRODUCTION_URL;
    return url.origin;
  } catch {
    return PRODUCTION_URL;
  }
}

export const siteUrl = resolveSiteUrl();

/** An absolute URL on the production site. */
export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();

/**
 * Whether this build may be indexed: production deployments (and local builds)
 * yes; Vercel preview/development deployments never. Requests to a *.vercel.app
 * host are additionally sent `X-Robots-Tag: noindex` (next.config.ts), so only
 * the real domain is ever indexed.
 */
export const indexable = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = { bs: "bs_BA", sq: "sq_AL", en: "en_GB" };

/** BCP 47 language tags for structured data. */
export const languageTag: Record<Locale, string> = { bs: "bs", sq: "sq", en: "en" };

/** The seat of the Medresa as each language writes it (src/content/{bs,sq,en}.ts). */
export const placeName: Record<Locale, string> = {
  bs: "Tuzi, Crna Gora",
  sq: "Tuz, Mali i Zi",
  en: "Tuzi, Montenegro",
};

/** Default share image: the campus from the air (the homepage hero). */
export const defaultShareImage = { url: "/images/hero-campus.jpg", width: 1627, height: 1080 };

/**
 * A meta description from page copy: whole sentences up to ~160 characters, or
 * the first sentence cut at a word with an ellipsis. Never invents text.
 */
export function describe(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // Whole sentences while they fit (a sentence ends with . ! ? before a space or the end).
  let out = "";
  for (const s of clean.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? []) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  out = out.trim();
  if (out.length >= 70) return out;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:–—-]+$/, "")}…`;
}

/**
 * Google Search Console verification: only when the owner sets the token
 * (GOOGLE_SITE_VERIFICATION) in the deployment's environment. Never hardcoded.
 */
export const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/**
 * Private routes: the administration, its sign-in (/ulaz7), authenticated
 * previews and internal APIs. Disallowed in robots.txt and always sent
 * `X-Robots-Tag: noindex, nofollow` (next.config.ts), so even a link to them
 * can never put them in search results.
 */
export const privatePaths = ["/admin", "/admin/", "/admin-preview/", "/ulaz7", "/ulaz7/", "/api/"];
