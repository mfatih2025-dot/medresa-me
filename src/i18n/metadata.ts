import type { Metadata } from "next";
import { defaultShareImage, describe, indexable, ogLocale } from "@/seo/config";
import { pageShareImages } from "@/seo/pages";
import { isLocale, locales, type Locale } from "./config";
import { alternatesFor, pathFor, type PageId } from "./routes";

/** The site's name in each language, as the suffix of every page title. */
export const siteNames: Record<Locale, string> = {
  bs: "Medresa „Mehmed Fatih“",
  sq: "Medreseja “Mehmed Fatih”",
  en: "Medresa “Mehmed Fatih”",
};

/** The locale param of a page, narrowed (the [locale] layout has already 404'd anything else). */
export const asLocale = (v: string): Locale => (isLocale(v) ? v : "bs");

export type ShareImage = { url: string; width: number; height: number; alt?: string };

type Options = {
  /** The page's own title (the site name is appended). */
  title: string;
  /** Page copy to describe it with (trimmed to a search-result length). */
  description?: string;
  image?: ShareImage;
  /** A news article: publication date (Open Graph article). */
  publishedTime?: string;
  /** Use the title as is (the homepage: the site's name is the title). */
  absoluteTitle?: boolean;
  /** Keep out of search results (still followed). */
  noindex?: boolean;
};

/**
 * The one place a public page's metadata is made: title, description,
 * canonical URL, hreflang alternates (bs/sq/en + x-default), Open Graph and
 * X/Twitter cards, all in the page's language.
 *
 * `paths` holds the page's URL in each language where it exists; a language
 * left out (an article not published in it) gets no alternate. The canonical
 * is always the page's own URL in its own language, so it never conflicts
 * with hreflang. x-default is the Bosnian (unprefixed) URL, where the
 * first-visit language gateway lets a visitor choose.
 */
export function localizedMetadata(
  paths: Partial<Record<Locale, string>>,
  locale: Locale,
  { title, description, image, publishedTime, absoluteTitle, noindex }: Options,
): Metadata {
  const url = paths[locale] ?? pathFor(null, locale);
  const fullTitle = absoluteTitle ? title : `${title} · ${siteNames[locale]}`;
  const desc = description ? describe(description) : undefined;
  const img = image ?? { ...defaultShareImage, alt: siteNames[locale] };
  const languages: Record<string, string> = {};
  for (const l of locales) if (paths[l]) languages[l] = paths[l]!;
  const xDefault = paths.bs ?? url;
  return {
    title: { absolute: fullTitle },
    ...(desc ? { description: desc } : {}),
    alternates: { canonical: url, languages: { ...languages, "x-default": xDefault } },
    robots:
      noindex || !indexable
        ? { index: false, follow: true }
        : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      title,
      ...(desc ? { description: desc } : {}),
      url,
      siteName: siteNames[locale],
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale && paths[l]).map((l) => ogLocale[l]),
      ...(publishedTime
        ? { type: "article" as const, publishedTime, modifiedTime: publishedTime }
        : { type: "website" as const }),
      images: [{ ...img, alt: img.alt ?? title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      ...(desc ? { description: desc } : {}),
      images: [{ url: img.url, alt: img.alt ?? title }],
    },
  };
}

/** A page of the route map (null = homepage) in a language: its URL in each language from src/i18n/routes.ts. */
export function pageMetadata(id: PageId | null, locale: Locale, options: Options): Metadata {
  const own = id ? pageShareImages[id] : undefined;
  return localizedMetadata(alternatesFor(id), locale, {
    ...options,
    image: options.image ?? (own ? { ...own, alt: options.title } : undefined),
  });
}
