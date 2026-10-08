import { createHash, randomUUID } from "node:crypto";
import { articles } from "@/content/vijesti";
import { importArticle } from "@/admin/import";
import { AdminError, assertPublishable, canonicalJson, safeId, validateDraft } from "@/admin/contracts";
import { newDraft, type BackendState, type ManagedArticle, type NewsDraft, type SharedImage } from "@/admin/model";
import { toPublicArticle } from "@/admin/publication";
import { readyLocales, toLocalePublicArticle } from "@/admin/publication";
import type { Locale } from "@/i18n/config";
import { backendState, rpc, supabaseConfiguration, supabaseRequest } from "./supabase";

export type StoredArticle = { document: NewsDraft; archived_at: string | null; deleted_at: string | null; created_at: string; updated_at: string; published_at: string | null; published_revision: number | null };
function managed(row: StoredArticle, publications: ManagedArticle["publications"] = {}, localePublishingReady = false): ManagedArticle {
  return { draft: row.document, archivedAt: row.archived_at, deletedAt: row.deleted_at, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at, publishedRevision: row.published_revision, source: "database", publications, localePublishingReady };
}
/** Missing new schema blocks publication only; existing draft/archive services remain usable. */
export async function readLocalePublications(id?: string) {
  try {
    const query = id ? `&article_id=eq.${encodeURIComponent(id)}` : "";
    const rows: { article_id: string; locale: Locale; revision: number; published_at: string; snapshot: import("@/content/vijesti/types").NewsArticle }[] = await (await supabaseRequest(`/rest/v1/medresa_admin_locale_publication_state?select=article_id,locale,revision,published_at,snapshot${query}`)).json();
    if (!Array.isArray(rows)) throw new Error("Invalid locale publication response");
    const byId: Record<string, NonNullable<ManagedArticle["publications"]>> = {};
    for (const row of rows) {
      if (!safeId(row.article_id) || !["bs", "sq", "en"].includes(row.locale) || !Number.isSafeInteger(row.revision) || !row.snapshot || row.snapshot.id !== row.article_id) throw new Error("Invalid locale publication response");
      (byId[row.article_id] ??= {})[row.locale] = { revision: row.revision, publishedAt: row.published_at, snapshot: row.snapshot };
    }
    return { available: true, byId };
  } catch { return { available: false, byId: {} as Record<string, NonNullable<ManagedArticle["publications"]>> }; }
}
async function withPublications(row: StoredArticle): Promise<ManagedArticle> {
  const state = await readLocalePublications(row.document.id);
  return managed(row, state.byId[row.document.id], state.available);
}
export function archiveAssets(): SharedImage[] { return articles.flatMap(a => a.photos.map((p, i) => ({ ...p, id: `archive-${a.id}-${i + 1}` }))); }
export async function listNews(): Promise<{ rows: ManagedArticle[]; backend: BackendState }> {
  const fallback = articles.map(importArticle);
  const state = backendState();
  if (state.state !== "connected") return { rows: fallback, backend: state };
  try {
    const rows: StoredArticle[] = await (await supabaseRequest("/rest/v1/medresa_admin_articles?select=*&order=publication_date.desc,id.desc")).json();
    const published = await readLocalePublications();
    const ids = new Set(rows.map(r => r.document.id));
    return { rows: [...rows.map(r => managed(r, published.byId[r.document.id], published.available)), ...fallback.filter(r => !ids.has(r.draft.id))].sort((a, b) => b.draft.date.localeCompare(a.draft.date) || b.draft.id.localeCompare(a.draft.id)), backend: { ...state, localePublishingReady: published.available } };
  } catch (error) { return { rows: fallback, backend: { state: "error", writable: false, message: error instanceof AdminError ? error.message : "Baza trenutno nije dostupna." } }; }
}
export async function getNews(id: string): Promise<ManagedArticle | null> {
  if (!safeId(id)) throw new AdminError(422, "Neispravan identitet vijesti.");
  if (supabaseConfiguration()) {
    const rows: StoredArticle[] = await (await supabaseRequest(`/rest/v1/medresa_admin_articles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)).json();
    if (rows[0]) return withPublications(rows[0]);
  }
  const article = articles.find(a => a.id === id);
  return article ? importArticle(article) : null;
}
/** Validate canonical assets rather than trusting image URLs/dimensions from a client. */
export async function canonicalDraft(input: unknown, current?: NewsDraft): Promise<NewsDraft> {
  validateDraft(input);
  const { id, revision, status, date, topic, title, slug, lead, blocks, images, coverImageId, review } = input;
  const draft: NewsDraft = structuredClone({ id, revision, status, date, topic, title, slug, lead, blocks: blocks.map(b => b.type === "image" ? { id: b.id, type: b.type, assetId: b.assetId } : { id: b.id, type: b.type, text: b.text }), images, coverImageId, review });
  // Only the immutable server-side import may provide compatibility provenance.
  delete draft.legacy; if (current?.legacy) draft.legacy = current.legacy;
  const staticAssets = archiveAssets();
  const uploadedIds = draft.images.filter(i => !staticAssets.some(a => a.id === i.id)).map(i => i.id);
  let stored: { id: string; metadata: SharedImage }[] = [];
  if (uploadedIds.length) stored = await (await supabaseRequest(`/rest/v1/medresa_admin_assets?id=in.(${uploadedIds.map(encodeURIComponent).join(",")})&select=id,metadata`)).json();
  draft.images = draft.images.map(image => {
    const asset = staticAssets.find(a => a.id === image.id) ?? stored.find(a => a.id === image.id)?.metadata;
    if (!asset) throw new AdminError(422, "Slika nije dostupna u zajedničkoj biblioteci.");
    return { ...asset, alt: image.alt };
  });
  validateDraft(draft);
  return draft;
}
export async function createDraft(actor: string, input?: unknown): Promise<ManagedArticle> {
  const draft = input === undefined ? newDraft(randomUUID()) : await canonicalDraft(input);
  draft.id = randomUUID(); draft.revision = 0; draft.status = "draft"; draft.review = newDraft(draft.id).review;
  for (const l of ["bs", "sq", "en"] as const) if (draft.slug[l] && articles.some(a => a[l].slug === draft.slug[l])) throw new AdminError(409, `URL slug ${l.toUpperCase()} je već zauzet u javnoj arhivi.`);
  return withPublications(await rpc<StoredArticle>("medresa_admin_save", { p_document: draft, p_expected: -1, p_actor: actor }));
}
async function ensureImported(id: string, _actor: string): Promise<ManagedArticle> {
  void _actor;
  const current = await getNews(id);
  if (!current) throw new AdminError(404, "Vijest nije pronađena.");
  if (current.source === "database") return current;
  // Intentionally not an implicit import on edit/save/delete.
  throw new AdminError(409, "Vijest još nije u bazi. Prvo izvršite provjereni import.");
}
export async function saveDraft(input: unknown, expected: number, actor: string): Promise<ManagedArticle> {
  validateDraft(input);
  const current = await ensureImported(input.id, actor);
  if (current.archivedAt || current.deletedAt) throw new AdminError(409, "Prvo vratite vijest iz arhive ili smeća.");
  if (current.draft.revision !== expected) throw new AdminError(409, "Vijest je promijenjena. Ponovo je otvorite.");
  const draft = await canonicalDraft(input, current.draft);
  for (const l of ["bs", "sq", "en"] as const) if (draft.slug[l] && articles.some(a => a.id !== draft.id && a[l].slug === draft.slug[l])) throw new AdminError(409, `URL slug ${l.toUpperCase()} je već zauzet u javnoj arhivi.`);
  if (draft.revision < expected || (draft.revision === expected && canonicalJson(draft) !== canonicalJson(current.draft))) throw new AdminError(409, "Promjene moraju imati novu reviziju.");
  const content = (d: NewsDraft) => canonicalJson({ title: d.title, slug: d.slug, date: d.date, topic: d.topic, lead: d.lead, blocks: d.blocks, images: d.images, cover: d.coverImageId });
  if (content(draft) !== content(current.draft) && draft.revision <= expected) throw new AdminError(409, "Zastarjela revizija.");
  for (const l of ["bs", "sq", "en"] as const) if (draft.review[l].approved && draft.review[l].reviewedRevision !== draft.revision) throw new AdminError(422, "Ljudski pregled nije potvrđen za ovu reviziju.");
  draft.status = readyLocales(draft).length ? "ready" : "draft";
  return withPublications(await rpc<StoredArticle>("medresa_admin_save", { p_document: draft, p_expected: expected, p_actor: actor }));
}
export async function publishNews(id: string, expected: number, actor: string, requested: unknown): Promise<ManagedArticle> {
  const current = await ensureImported(id, actor);
  if (current.archivedAt || current.deletedAt || current.draft.revision !== expected) throw new AdminError(409, "Vijest je promijenjena, arhivirana ili u smeću.");
  if (!current.localePublishingReady) throw new AdminError(503, "Objava po jeziku čeka provjerenu Preview migraciju 202610080003_locale_publication.sql.");
  if (!Array.isArray(requested) || !requested.length || requested.length > 3 || requested.some(l => !["bs", "sq", "en"].includes(l)) || new Set(requested).size !== requested.length) throw new AdminError(422, "Odaberite jezike za objavu.");
  const locales = (["bs", "sq", "en"] as const).filter(l => requested.includes(l));
  const draft = await canonicalDraft(current.draft, current.draft);
  for (const l of locales) assertPublishable(draft, l);
  // Reserve every legacy URL too, including articles not imported yet.
  for (const l of locales) if (articles.some(a => a.id !== id && a[l].slug === draft.slug[l])) throw new AdminError(409, `URL slug ${l.toUpperCase()} je već zauzet.`);
  return withPublications(await rpc<StoredArticle>("medresa_admin_publish_locales", { p_id: id, p_expected: expected, p_locales: locales, p_snapshots: Object.fromEntries(locales.map(l => [l, toLocalePublicArticle(draft, l)])), p_actor: actor }));
}
export async function transitionNews(id: string, expected: number, action: "archive" | "trash" | "restore", actor: string): Promise<ManagedArticle> {
  await ensureImported(id, actor);
  return withPublications(await rpc<StoredArticle>("medresa_admin_transition", { p_id: id, p_expected: expected, p_action: action, p_actor: actor }));
}
/** Import is explicit, insert-only and idempotent. Existing edited records are never overwritten. */
export async function importLegacy(actor: string, dryRun = true) {
  const plan = articles.map((a, order) => ({ record: importArticle(a), fingerprint: createHash("sha256").update(canonicalJson(a)).digest("hex"), order }));
  // Validate all 17 before the first write; RPC imports the complete set in one transaction.
  if (plan.length !== 17) throw new AdminError(409, "Početni arhiv više nema očekivanih 17 članaka.");
  if (dryRun) return { total: plan.length, verified: true, written: false };
  return rpc<{ inserted: number; skipped: number }>("medresa_admin_import", { p_items: plan.map(p => ({ document: p.record.draft, snapshot: toPublicArticle(p.record.draft), fingerprint: p.fingerprint, source_order: p.order })), p_actor: actor });
}
