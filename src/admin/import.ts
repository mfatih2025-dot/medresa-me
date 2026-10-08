import type { NewsArticle } from "@/content/vijesti/types";
import { parseBody } from "@/lib/newsBody";
import { newDraft, type ContentBlock, type ManagedArticle } from "./model";
import { toPublicArticle } from "./publication";
import { canonicalJson } from "./contracts";

/** Lossless conversion. Refuse ambiguous cross-language block alignment. */
export function importArticle(a: NewsArticle): ManagedArticle {
  const d = newDraft(a.id);
  const locales = ["bs", "sq", "en"] as const;
  const chunks = Object.fromEntries(locales.map(l => [l, a[l].body.trim().split(/\n\s*\n/).filter(c => c.trim())])) as Record<typeof locales[number], string[]>;
  const shape = (chunk: string) => parseBody(chunk)[0]?.type;
  if (locales.some(l => chunks[l].length !== chunks.bs.length || chunks[l].some((c, i) => shape(c) !== shape(chunks.bs[i])))) throw new Error(`Potrebno je ručno usklađivanje blokova: ${a.id}`);
  d.date = a.date; d.topic = a.topic; d.status = "published";
  for (const l of locales) { d.title[l] = a[l].title; d.slug[l] = a[l].slug; d.lead[l] = a[l].lead ?? ""; }
  d.images = a.photos.map((p, i) => ({ ...p, id: `archive-${a.id}-${i + 1}` }));
  d.coverImageId = d.images[0]?.id ?? null;
  d.blocks = chunks.bs.map((chunk, i): ContentBlock => {
    const type = shape(chunk); const id = `import-${i + 1}`;
    if (type === "photo") return { id, type: "image", assetId: d.images[(parseBody(chunk)[0] as { n: number }).n - 1]?.id ?? "" };
    const clean = (s: string) => type === "h" ? s.replace(/^\s*#+\s+/, "") : type === "quote" ? s.split("\n").map(l => l.replace(/^\s*>\s?/, "")).join("\n") : s;
    return { id, type: type === "h" ? "subheading" : type === "quote" ? "quote" : "text", text: { bs: clean(chunk), sq: clean(chunks.sq[i]), en: clean(chunks.en[i]) } };
  });
  d.legacy = { original: a, blocks: structuredClone(d.blocks), imageIds: d.images.map(i => i.id) };
  // Compare every field, including raw Markdown, alt text, crops, sources and slugs.
  if (canonicalJson(toPublicArticle(d)) !== canonicalJson(a)) throw new Error(`Import nije identičan: ${a.id}`);
  return { draft: d, archivedAt: null, deletedAt: null, createdAt: null, updatedAt: null, publishedAt: null, publishedRevision: null, source: "static",
    publications: Object.fromEntries(locales.map(l => [l, { revision: 0, publishedAt: null, snapshot: a }])) };
}
