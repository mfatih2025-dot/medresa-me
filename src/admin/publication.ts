import type { Locale } from "@/i18n/config";
import type { NewsArticle, NewsVersion } from "@/content/vijesti/types";
import type { NewsDraft } from "./model";

const languages: Locale[] = ["bs", "sq", "en"];
export type Check = { key: string; label: string; complete: boolean };
const hasText = (s: string) => s.trim().length > 0;
const validUrl = (s: string) => /^\/(?!\/)/.test(s) || /^https:\/\//.test(s);

/** Server publication must rerun these checks against a fresh saved revision. */
export function publicationChecklist(d: NewsDraft): Check[] {
  const content = (locale: Locale) => hasText(d.title[locale]) && d.blocks.length > 0 &&
    d.blocks.some(b => b.type !== "image") && d.blocks.every(b => b.type === "image"
      ? d.images.some(i => i.id === b.assetId && hasText(i.alt[locale]))
      : hasText(b.text[locale]));
  const unique = new Set(d.blocks.map(b => b.id)).size === d.blocks.length && new Set(d.images.map(i => i.id)).size === d.images.length;
  const cover = d.images.find(i => i.id === d.coverImageId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !Number.isNaN(Date.parse(d.date)) && new Date(d.date).toISOString().slice(0, 10) === d.date;
  return [
    ...languages.map(l => ({ key: l, label: `${l.toUpperCase()} kompletan`, complete: content(l) })),
    { key: "cover", label: "Naslovna slika", complete: !!cover && languages.every(l => hasText(cover.alt[l])) },
    { key: "date", label: "Datum", complete: validDate },
    { key: "slugs", label: "URL slugovi", complete: languages.every(l => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug[l]) && !/^\d+$/.test(d.slug[l])) },
    { key: "fields", label: "Nema praznih polja", complete: unique && languages.every(content) && d.images.every(i => validUrl(i.src) && i.width > 0 && i.height > 0 && languages.every(l => hasText(i.alt[l]))) },
    { key: "review", label: "Ljudski pregled sva 3 jezika", complete: languages.every(l => d.review[l].approved && d.review[l].reviewedRevision === d.revision) },
  ];
}

/** Compatibility adapter only. It never writes to the existing public news store. */
export function toPublicArticle(d: NewsDraft): NewsArticle {
  const ids = [...new Set([
    ...(d.coverImageId ? [d.coverImageId] : []),
    ...d.blocks.flatMap(b => b.type === "image" ? [b.assetId] : []),
  ])];
  const images = ids.map(id => {
    const asset = d.images.find(i => i.id === id);
    if (!asset) throw new Error("Article references a missing shared asset");
    return asset;
  });
  const version = (locale: Locale): NewsVersion => ({
    title: d.title[locale], slug: d.slug[locale], ...(d.lead[locale].trim() ? { lead: d.lead[locale] } : {}),
    body: d.blocks.map(b => {
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
    id: d.id, date: d.date, topic: d.topic,
    photos: images.map(({ id: _id, ...photo }) => { void _id; return photo; }),
    bs: version("bs"), sq: version("sq"), en: version("en"),
  };
}
