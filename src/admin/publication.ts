import type { Locale } from "@/i18n/config";
import type { NewsArticle, NewsVersion } from "@/content/vijesti/types";
import type { EditorialStatus, ManagedArticle, NewsDraft } from "./model";

const languages: Locale[] = ["bs", "sq", "en"];
export type Check = { key: string; label: string; complete: boolean };
const hasText = (s: string) => s.trim().length > 0;
const validUrl = (s: string) => /^\/(?!\/)/.test(s) || /^https:\/\//.test(s);

/** Checks only the selected locale. Missing translations never block it. */
export function publicationChecklist(d: NewsDraft, locale: Locale = "bs"): Check[] {
  const content = hasText(d.title[locale]) && d.blocks.length > 0 && d.blocks.some(b => b.type !== "image") &&
    d.blocks.every(b => b.type === "image" ? d.images.some(i => i.id === b.assetId && hasText(i.alt[locale])) : hasText(b.text[locale]));
  const unique = new Set(d.blocks.map(b => b.id)).size === d.blocks.length && new Set(d.images.map(i => i.id)).size === d.images.length;
  const used = new Set([...(d.coverImageId ? [d.coverImageId] : []), ...(d.legacy?.imageIds ?? []), ...d.blocks.flatMap(b => b.type === "image" ? [b.assetId] : [])]);
  const cover = d.images.find(i => i.id === d.coverImageId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(Date.parse(d.date)) && new Date(d.date).toISOString().slice(0, 10) === d.date;
  return [
    { key: locale, label: `${locale.toUpperCase()} sadržaj kompletan`, complete: content },
    { key: "cover", label: "Naslovna slika · opcionalno", complete: !d.coverImageId || (!!cover && hasText(cover.alt[locale])) },
    { key: "date", label: "Datum", complete: validDate },
    { key: "slugs", label: `URL slug · ${locale.toUpperCase()}`, complete: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug[locale]) && !/^\d+$/.test(d.slug[locale]) },
    { key: "fields", label: `Nema praznih polja · ${locale.toUpperCase()}`, complete: unique && content && [...used].every(id => {
      const i = d.images.find(image => image.id === id); return !!i && validUrl(i.src) && i.width > 0 && i.height > 0 && hasText(i.alt[locale]);
    }) },
    { key: "review", label: `Ljudski pregled · ${locale.toUpperCase()}`, complete: d.review[locale].approved && d.review[locale].reviewedRevision === d.revision },
  ];
}
export function readyLocales(d: NewsDraft): Locale[] {
  return languages.filter(l => publicationChecklist(d, l).every(c => c.complete));
}
/** Compare the visible locale only, including its frozen photos/date/crops. */
function visibleVersion(a: NewsArticle, locale: Locale): string {
  return JSON.stringify({ id: a.id, date: a.date, topic: a.topic, source: a.source, version: a[locale],
    photos: a.photos.map(({ alt, ...photo }) => ({ ...photo, alt: alt[locale] })) }, (_key, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
}
export function localeStatus(d: NewsDraft, publications: ManagedArticle["publications"], locale: Locale): EditorialStatus {
  const published = publications?.[locale];
  if (published) {
    try { if (visibleVersion(toPublicArticle(d), locale) === visibleVersion(published.snapshot, locale)) return "published"; } catch { /* Incomplete image placeholders are drafts. */ }
  }
  return publicationChecklist(d, locale).every(c => c.complete) ? "ready" : "draft";
}
/** A per-locale snapshot uses the real renderer contract; other drafts are not exposed. */
export function toLocalePublicArticle(d: NewsDraft, locale: Locale): NewsArticle {
  const article = toPublicArticle(d);
  for (const other of languages) if (other !== locale) article[other] = { title: "", slug: "", body: "" };
  return article;
}

/** Compatibility adapter only. It never writes to the existing public news store. */
export function toPublicArticle(d: NewsDraft): NewsArticle {
  const ids = [...new Set([
    ...(d.coverImageId ? [d.coverImageId] : []),
    ...(d.legacy?.imageIds ?? []),
    ...d.blocks.flatMap(b => b.type === "image" ? [b.assetId] : []),
  ])];
  const images = ids.map(id => {
    const asset = d.images.find(i => i.id === id);
    if (!asset) throw new Error("Article references a missing shared asset");
    return asset;
  });
  const version = (locale: Locale): NewsVersion => ({
    title: d.title[locale], slug: d.slug[locale], ...(d.lead[locale].trim() ? { lead: d.lead[locale] } : {}),
    body: d.legacy && JSON.stringify(d.blocks.map(b => b.type === "image" ? b : { id: b.id, type: b.type, text: b.text[locale] })) === JSON.stringify(d.legacy.blocks.map(b => b.type === "image" ? b : { id: b.id, type: b.type, text: b.text[locale] })) && JSON.stringify(ids) === JSON.stringify(d.legacy.imageIds)
      ? d.legacy.original[locale].body : d.blocks.map(b => {
      if (b.type === "image") {
        const n = images.findIndex(i => i.id === b.assetId);
        if (n < 0) throw new Error("Image block references a missing shared asset");
        return `![](${n + 1})`;
      }
      if (b.type === "subheading") return `## ${b.text[locale].replace(/\s*\n\s*/g, " ")}`;
      if (b.type === "quote") return b.text[locale].split("\n").map(line => `> ${line}`).join("\n");
      return b.text[locale];
    }).join("\n\n"),
  });
  return {
    id: d.id, date: d.date, topic: d.topic, ...(d.legacy?.original.source ? { source: d.legacy.original.source } : {}),
    photos: images.map(({ id: _id, ...photo }) => { void _id; return photo; }),
    bs: version("bs"), sq: version("sq"), en: version("en"),
  };
}
