import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { articles, articlePath, PAGE_SIZE, type NewsArticle, type NewsPhoto } from "@/content/vijesti";
import { homeNews } from "@/content/vijesti/home";
import { getDictionary } from "@/content";
import { newsFallbacks } from "@/content/bs";
import { locales, type Locale } from "@/i18n/config";
import { supabaseConfiguration } from "@/server/admin/supabase";
import { safeId } from "@/admin/contracts";

const preview = () => process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel";
const emptyVersion = () => ({ title: "", slug: "", body: "" });
const batchSize = 200;
type Publication = { article_id: string; locale: Locale; snapshot: NewsArticle; source_order: number | null };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Server-only GETs. The public integration can never write or run a private RPC. */
export async function publicNewsRequest(path: string) {
  const config = preview() ? supabaseConfiguration() : null;
  if (!config) throw new Error("Preview news unavailable");
  const headers = new Headers({ apikey: config.key });
  if (!config.key.startsWith("sb_secret_")) headers.set("Authorization", `Bearer ${config.key}`);
  const result = await fetch(`${config.url}${path}`, { headers, method: "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000) });
  if (!result.ok) throw new Error("Preview news unavailable");
  return result;
}

/** Only active immutable locale publications. Never read editorial documents. */
export const publishedNews = cache(async (): Promise<Publication[]> => {
  if (!preview()) return [];
  // Preview must read at request time, including unknown newly published slugs.
  // Production and every other branch retain their existing static behavior.
  await connection();
  if (!supabaseConfiguration()) return [];
  try {
    const output: Publication[] = [];
    for (let offset = 0; offset < batchSize * 20; offset += batchSize) {
      const result = await publicNewsRequest(`/rest/v1/medresa_admin_public_locale_feed?select=article_id,locale,snapshot,source_order&order=article_id.asc,locale.asc&limit=${batchSize}&offset=${offset}`);
      const rows: unknown = await result.json();
      if (!Array.isArray(rows) || rows.length > batchSize) throw new Error("Invalid publication feed");
      for (const row of rows) {
        if (!object(row) || !safeId(row.article_id) || !locales.includes(row.locale as Locale) || !object(row.snapshot) || row.snapshot.id !== row.article_id || (row.source_order !== null && !Number.isSafeInteger(row.source_order))) throw new Error("Invalid publication feed");
        const snapshot = row.snapshot; const l = row.locale as Locale; const v = snapshot[l];
        if (typeof snapshot.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) || new Date(snapshot.date).toISOString().slice(0,10) !== snapshot.date || !["school","visits","donations","events","notices","sport"].includes(String(snapshot.topic)) || !object(v) || typeof v.title !== "string" || !v.title.trim() || typeof v.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) || /^\d+$/.test(v.slug) || typeof v.body !== "string" || !v.body.trim() || (v.lead !== undefined && typeof v.lead !== "string") || !Array.isArray(snapshot.photos)) throw new Error("Invalid publication feed");
        // Do not serialize another locale's fields, even if an old snapshot holds them.
        const photos: NewsPhoto[] = snapshot.photos.map(p => {
          if (!object(p) || typeof p.src !== "string" || !/^\/(?:images\/[a-zA-Z0-9/_.-]+|api\/admin\/media\/[a-zA-Z0-9_-]+)$/.test(p.src) || p.src.includes("..") || !Number.isInteger(p.width) || !Number.isInteger(p.height) || Number(p.width)<1 || Number(p.height)<1 || !object(p.alt) || typeof p.alt[l] !== "string" || !p.alt[l].trim() || (p.blur !== undefined && (typeof p.blur !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.blur))) || (p.focus !== undefined && typeof p.focus !== "string") || (p.graphic !== undefined && typeof p.graphic !== "boolean")) throw new Error("Invalid publication photo");
          return { src: p.src.replace(/^\/api\/admin\/media\//,"/api/news/media/"), width: Number(p.width), height: Number(p.height), alt: { bs: "", sq: "", en: "", [l]: p.alt[l] }, ...(p.blur ? { blur: p.blur as string } : {}), ...(p.focus ? { focus: p.focus as string } : {}), ...(p.graphic !== undefined ? { graphic: p.graphic as boolean } : {}) };
        });
        const article: NewsArticle = { id: row.article_id, date: snapshot.date, topic: snapshot.topic as NewsArticle["topic"], photos, bs: emptyVersion(), sq: emptyVersion(), en: emptyVersion(), [l]: { title: v.title, slug: v.slug, body: v.body, ...(v.lead ? { lead: v.lead as string } : {}) } };
        output.push({ article_id: row.article_id, locale: l, snapshot: article, source_order: row.source_order as number | null });
      }
      if (rows.length < batchSize) return output;
    }
    throw new Error("Publication feed exceeds safe read limit");
  } catch { return []; } // Existing 17 articles stay usable; no provider errors leak.
});

export const publicNews = cache(async (locale: Locale) => {
  const rows = await publishedNews();
  // Keep original archive content and URLs exactly; imports must not duplicate it.
  const ids = new Set(articles.map(a => a.id)); const slugs = new Set(articles.map(a => a[locale].slug));
  const merged = articles.map((article, source_order) => ({ article, source_order }));
  for (const row of rows) {
    if (row.locale !== locale || ids.has(row.article_id) || slugs.has(row.snapshot[locale].slug)) continue;
    ids.add(row.article_id); slugs.add(row.snapshot[locale].slug);
    merged.push({ article: row.snapshot, source_order: row.source_order ?? Number.MAX_SAFE_INTEGER });
  }
  const items = merged.sort((a,b) => b.article.date.localeCompare(a.article.date) || a.source_order-b.source_order || b.article.id.localeCompare(a.article.id)).map(r => r.article);
  const paths = (id: string): Partial<Record<Locale,string>> => {
    const legacy = articles.find(a => a.id === id);
    if (legacy) return Object.fromEntries(locales.map(l => [l,articlePath(legacy,l)]));
    return Object.fromEntries(rows.filter(r => r.article_id === id).map(r => [r.locale,articlePath(r.snapshot,r.locale)]));
  };
  return {
    articles: items, pageCount: Math.max(1, Math.ceil(items.length/PAGE_SIZE)),
    onPage: (page: number) => items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),
    bySlug: (slug: string) => items.find(a => a[locale].slug === slug),
    navigation: (a: NewsArticle) => { const i=items.findIndex(item=>item.id===a.id); return { newer: items[i-1], older: items[i+1], page: Math.floor(i/PAGE_SIZE)+1 }; },
    paths,
    // Redirect a published wrong-language slug only if this locale is published too.
    byOtherSlug: (slug: string) => items.find(a => locales.some(l => paths(a.id)[l]?.split("/").pop()===slug)),
  };
});

const fallbackAlts: Partial<Record<Locale,string[]>> = {
  sq: ["Portali prej guri i Medresesë me harqe", "Oborri i Medresesë me një ulli dhe ndërtesa prej guri"],
  en: ["The stone portal of the Medresa with its arches", "The Medresa courtyard with an olive tree and stone buildings"],
};
export async function publicHomeDictionary(locale: Locale) {
  const dictionary = getDictionary(locale); const news = await publicNews(locale);
  const fallbacks = newsFallbacks.map((image,i) => ({ ...image, alt: fallbackAlts[locale]?.[i] ?? image.alt }));
  return { ...dictionary, news: { ...dictionary.news, items: homeNews(locale, fallbacks, news.articles) } };
}
