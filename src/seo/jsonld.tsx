import { pageTitles, site } from "@/content/site";
import { kontaktContent } from "@/content/kontakt";
import { dictionaries } from "@/content";
import { siteNames } from "@/i18n/metadata";
import { locales, type Locale } from "@/i18n/config";
import { pathFor, type PageId } from "@/i18n/routes";
import { absoluteUrl, defaultShareImage, languageTag, siteUrl } from "./config";

/*
 * Structured data (schema.org JSON-LD), built only from facts already in the
 * project: src/content/site.ts (name, seat, phone, e-mail, founding date,
 * official social profiles, logo) and src/content/kontakt.ts (hours, the Rožaje
 * branch). Nothing here is invented: no ratings, people, coordinates or awards.
 *
 *   Organization  EducationalOrganization/HighSchool, one @id for the whole site
 *   WebSite       the site in its three languages, published by the Organization
 *   BreadcrumbList on every inner page
 *   NewsArticle   on every published article (see src/seo/news.ts)
 */

export const ORG_ID = `${siteUrl}/#organization`;
export const WEBSITE_ID = `${siteUrl}/#website`;

type Json = Record<string, unknown>;

const logo = {
  "@type": "ImageObject",
  url: absoluteUrl(site.logo.src),
  width: site.logo.width,
  height: site.logo.height,
};

/** The Medresa, in a language (names and descriptions as the site writes them). */
export function organization(locale: Locale): Json {
  const k = kontaktContent[locale];
  return {
    "@type": ["EducationalOrganization", "HighSchool"],
    "@id": ORG_ID,
    name: siteNames[locale],
    alternateName: [...new Set([site.name, ...locales.map((l) => siteNames[l]), "Medresa Mehmed Fatih"])].filter(
      (n) => n !== siteNames[locale],
    ),
    url: absoluteUrl(pathFor(null, locale)),
    logo,
    image: absoluteUrl(defaultShareImage.url),
    description: dictionaries[locale].meta.description,
    foundingDate: "2008-10-06",
    telephone: site.contact.phone.replace(/\s+/g, " "),
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Donji Milješ",
      addressLocality: "Tuzi",
      addressCountry: "ME",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
    department: {
      "@type": "EducationalOrganization",
      name: `${siteNames[locale]} – ${k.rozaje.heading}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.contact.branch.address.split(",")[0],
        addressLocality: "Rožaje",
        addressCountry: "ME",
      },
      email: kontaktContent.bs.rozaje.fields.find((f) => f.kind === "email")?.value,
    },
    sameAs: site.social.map((s) => s.href),
  };
}

/** The Medresa as an article's author/publisher: enough to stand alone on the page. */
export function orgRef(locale: Locale): Json {
  return {
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: siteNames[locale],
    url: absoluteUrl(pathFor(null, locale)),
    logo,
  };
}

/** The website (the same site in bs, sq and en). */
export function website(locale: Locale): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl(pathFor(null, locale)),
    name: siteNames[locale],
    inLanguage: locales.map((l) => languageTag[l]),
    publisher: { "@id": ORG_ID },
  };
}

/** Home › … › this page, by name and URL (the last item is the page itself). */
export function breadcrumbs(locale: Locale, trail: { name: string; path: string }[]): Json {
  const items = [{ name: siteNames[locale], path: pathFor(null, locale) }, ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** One or more schema.org nodes as a JSON-LD script (escaped; static data only). */
export function JsonLd({ data }: { data: Json | Json[] }) {
  const graph = Array.isArray(data) ? data : [data];
  const doc = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      // Built from project content only (no user input); `<` escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(doc).replace(/</g, "\\u003c") }}
    />
  );
}

/** Breadcrumbs of a route-map page (Home › Page), as its JSON-LD. */
export function PageJsonLd({ id, locale }: { id: PageId; locale: Locale }) {
  return <JsonLd data={breadcrumbs(locale, [{ name: pageTitles[locale][id], path: pathFor(id, locale) }])} />;
}
