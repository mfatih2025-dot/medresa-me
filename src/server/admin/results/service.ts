import { randomUUID } from "node:crypto";
import { AdminError } from "@/admin/contracts";
import { uuid } from "@/admin/campaigns/model";
import { isLocale, type Locale } from "@/i18n/config";
import { MAX_PDF_BYTES, PDF_CHUNK_BYTES, resultLocales, resultDownload, type ResultAsset, type ResultState, type ResultsLibrary } from "@/admin/results/model";
import { supabaseConfiguration, supabaseRequest } from "../supabase";
import { pdfDigest, validatePdf } from "./pdf";
const BUCKET = "medresa-results-preview";
export function resultsConfiguration(write = false) {
  const c = supabaseConfiguration();
  if (!c || c.ref !== "safsijrhxbefgcahvsvm" || process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "codex/admin-panel" || write && !c.writable) throw new AdminError(503, "Rezultati nijesu spremni za namijenjeni Preview projekat.");
  return c;
}
async function request(path: string, init: RequestInit = {}, write = false) { resultsConfiguration(write); return supabaseRequest(path, { ...init, redirect: "error" }, write); }
async function rpc(name: string, body: unknown) {
  try { return await (await request(`/rest/v1/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, true)).json(); }
  catch (error) { if (error instanceof AdminError && error.status === 409) throw new AdminError(409, "Rezultati su promijenjeni u drugom prozoru. Osvježite stranicu."); throw error; }
}
type AssetRow = { id: string; locale: Locale; filename: string; bytes: number; pages: number; sha256: string; object_path: string; created_at: string };
type StateRow = { revision: number; bs_id: string | null; sq_id: string | null; en_id: string | null; publication_id: string | null };
type PublicationRow = { id: string; locale: Locale; version: number; asset_id: string; published_at: string };
type UploadRow = { id: string; locale: Locale; filename: string; bytes: number; base_revision: number; created_by: string; expires_at: string; asset_id: string | null };
const project = (a: AssetRow): ResultAsset => ({ id: a.id, locale: a.locale, filename: a.filename, bytes: a.bytes, pages: a.pages, createdAt: new Date(a.created_at).toISOString() });
async function stateRow(): Promise<StateRow> { const rows = await (await request("/rest/v1/medresa_results_state?select=revision,bs_id,sq_id,en_id,publication_id&singleton=eq.true&limit=1")).json(); if (!rows[0]) throw new AdminError(503, "Migracija za rezultate nije spremna."); return rows[0]; }
async function asset(id: string): Promise<AssetRow> {
  if (!uuid(id)) throw new AdminError(404, "PDF nije pronađen.");
  const rows = await (await request(`/rest/v1/medresa_results_assets?id=eq.${id}&select=id,locale,filename,bytes,pages,sha256,object_path,created_at&limit=1`)).json();
  if (!rows[0] || rows[0].object_path !== `documents/${id}.pdf`) throw new AdminError(404, "PDF nije pronađen."); return rows[0];
}
async function publication(locale: Locale): Promise<PublicationRow | null> {
 let heads;
 try { heads = await (await request(`/rest/v1/medresa_results_locale_heads?locale=eq.${locale}&select=publication_id&limit=1`)).json(); }
 catch {
  // Read-only legacy release fallback while the additive migration awaits manual application.
  // No mutation uses this path; current complete publications remain downloadable.
  const state = await stateRow(); if (!state.publication_id) return null;
  const old = await (await request(`/rest/v1/medresa_results_publications?id=eq.${state.publication_id}&select=id,version,bs_id,sq_id,en_id,published_at&limit=1`)).json();
  const p = old[0]; if (!p) throw new AdminError(503,"Objavljeni rezultati nijesu dostupni.");
  return {id:p.id,locale,version:p.version,asset_id:p[`${locale}_id`],published_at:p.published_at};
 }
 if (!heads[0]) return null;
 const rows = await (await request(`/rest/v1/medresa_results_locale_publications?id=eq.${heads[0].publication_id}&locale=eq.${locale}&select=id,locale,version,asset_id,published_at&limit=1`)).json();
 if (!rows[0]) throw new AdminError(503,"Objavljeni rezultati nijesu dostupni."); return rows[0];
}
export async function readResults(): Promise<ResultState> {
 const s = await stateRow(), drafts = {} as ResultState["drafts"], published = {} as ResultState["published"];
 for (const locale of resultLocales) {
  drafts[locale] = s[`${locale}_id`] ? project(await asset(s[`${locale}_id`]!)) : null;
  const p = await publication(locale);
  published[locale] = p ? { id:p.id, version:p.version, publishedAt:new Date(p.published_at).toISOString(), file:project(await asset(p.asset_id)) } : null;
 }
 return {revision:s.revision,drafts,published};
}
export async function listResults(): Promise<ResultsLibrary> {
  try { const c = resultsConfiguration(); let channelsReady = true; try { await request("/rest/v1/medresa_results_locale_heads?select=locale&limit=1"); } catch { channelsReady = false; } return { ready: true, writable: c.writable && channelsReady, message: !channelsReady ? "Za nezavisnu objavu PDF-a primijenite Preview migraciju 202610100004_independent_locale_channels.sql." : c.writable ? null : "Rezultati su dostupni samo za čitanje.", state: await readResults() }; }
  catch { return { ready: false, writable: false, message: "Rezultati još nijesu povezani. Provjerite Preview migraciju za rezultate.", state: null }; }
}
function revision(value: unknown): asserts value is number { if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 9007199254740990) throw new AdminError(422, "Verzija rezultata nije ispravna."); }
export async function beginUpload(value: unknown, actor: string) {
  resultsConfiguration(true); const v = value as { locale: Locale; filename: string; bytes: number; revision: number };
  if (!v || !isLocale(v.locale) || typeof v.filename !== "string" || !v.filename.trim() || v.filename.length > 180 || /[\u0000-\u001f\u007f/\\]/.test(v.filename) || !Number.isSafeInteger(v.bytes) || v.bytes < 1 || v.bytes > MAX_PDF_BYTES) throw new AdminError(422, "Odaberite PDF do 5 MB sa ispravnim nazivom.");
  revision(v.revision); if ((await stateRow()).revision !== v.revision) throw new AdminError(409, "Rezultati su promijenjeni. Osvježite stranicu.");
  const id = randomUUID(); await request("/rest/v1/medresa_results_uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, locale: v.locale, filename: v.filename, bytes: v.bytes, base_revision: v.revision, created_by: actor }) }, true);
  return { id, chunkBytes: PDF_CHUNK_BYTES };
}
async function uploadSession(id: string, actor: string): Promise<UploadRow> {
  if (!uuid(id)) throw new AdminError(422, "Prenos nije ispravan.");
  const rows = await (await request(`/rest/v1/medresa_results_uploads?id=eq.${id}&select=id,locale,filename,bytes,base_revision,created_by,expires_at,asset_id&limit=1`)).json();
  const u = rows[0]; if (!u || u.created_by !== actor || Date.parse(u.expires_at) <= Date.now()) throw new AdminError(422, "Prenos je istekao. Ponovo odaberite PDF."); return u;
}
export async function uploadChunk(id: string, index: number, bytes: Buffer, actor: string) {
  resultsConfiguration(true); const u = await uploadSession(id, actor), count = Math.ceil(u.bytes / PDF_CHUNK_BYTES);
  if (u.asset_id || !Number.isInteger(index) || index < 0 || index >= count || bytes.length !== Math.min(PDF_CHUNK_BYTES, u.bytes - index*PDF_CHUNK_BYTES)) throw new AdminError(422, "Dio prenosa nije ispravan.");
  await request(`/storage/v1/object/${BUCKET}/uploads/${id}/${index}`, { method: "POST", headers: { "Content-Type": "application/octet-stream", "x-upsert": "false" }, body: new Uint8Array(bytes) }, true);
}
export async function finishUpload(id: string, expected: unknown, actor: string) {
  resultsConfiguration(true); revision(expected); const u = await uploadSession(id, actor);
  if (u.asset_id) return readResults();
  if (u.base_revision !== expected || (await stateRow()).revision !== expected) throw new AdminError(409, "Rezultati su promijenjeni. Osvježite stranicu.");
  const pieces: Buffer[] = [], prefixes: string[] = [];
  for (let i=0;i<Math.ceil(u.bytes/PDF_CHUNK_BYTES);i++) {
    const path = `uploads/${id}/${i}`; prefixes.push(path);
    const bytes = Buffer.from(await (await request(`/storage/v1/object/authenticated/${BUCKET}/${path}`)).arrayBuffer());
    if (bytes.length !== Math.min(PDF_CHUNK_BYTES,u.bytes-i*PDF_CHUNK_BYTES)) throw new AdminError(422, "Prenos PDF-a nije potpun."); pieces.push(bytes);
  }
  const original = Buffer.concat(pieces), validated = await validatePdf(original);
  await request(`/storage/v1/object/${BUCKET}/documents/${id}.pdf`, { method: "POST", headers: { "Content-Type": "application/pdf", "x-upsert": "false" }, body: new Uint8Array(original) }, true);
  await rpc("medresa_results_finalize", { p_upload: id, p_expected: expected, p_sha256: validated.sha256, p_pages: validated.pages, p_actor: actor });
  try { await request(`/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes }) }, true); } catch { /* Transport chunks stay private if cleanup fails. Published/history PDFs are never deleted. */ }
  return readResults();
}
export async function readPdf(id: string) {
  const a = await asset(id), bytes = Buffer.from(await (await request(`/storage/v1/object/authenticated/${BUCKET}/${a.object_path}`)).arrayBuffer());
  if (bytes.length !== a.bytes || bytes.length > MAX_PDF_BYTES || pdfDigest(bytes) !== a.sha256) throw new AdminError(503, "PDF trenutno nije dostupan.");
  return { bytes, asset: project(a) };
}
export async function removeDraft(locale: unknown, expected: unknown) { resultsConfiguration(true); revision(expected); if (!isLocale(locale as string)) throw new AdminError(422, "Jezik nije ispravan."); await rpc("medresa_results_remove_draft", { p_locale: locale, p_expected: expected }); return readResults(); }
export async function publishResults(expected: unknown, actor: string, id: string, locale: unknown) {
 resultsConfiguration(true); revision(expected);
 if (!uuid(id) || !isLocale(locale as string)) throw new AdminError(422,"Objava ili jezik nijesu ispravni.");
 const selected = locale as Locale, head = await publication(selected);
 if (head?.id === id) return readResults();
 const s = await stateRow(); if (s.revision !== expected) throw new AdminError(409,"Rezultati su promijenjeni. Osvježite stranicu.");
 const assetId = s[`${selected}_id`]; if (!assetId) throw new AdminError(422,`Za objavu je potreban ${selected.toUpperCase()} PDF.`);
 const pdf = await readPdf(assetId); if (pdf.asset.locale !== selected) throw new AdminError(422,"PDF nije za izabrani jezik."); await validatePdf(pdf.bytes);
 await rpc("medresa_results_publish_locale",{p_id:id,p_expected:expected,p_locale:selected,p_actor:actor}); return readResults();
}
export async function publishedHref(locale: Locale) { try { resultsConfiguration(); return await publication(locale) ? resultDownload(locale) : null; } catch { return null; } }
export async function publicPdf(locale: unknown) {
 resultsConfiguration(); if (!isLocale(locale as string)) throw new AdminError(404,"PDF nije pronađen.");
 const p = await publication(locale as Locale); if (!p) throw new AdminError(404,"Rezultati za ovaj jezik još nijesu objavljeni."); return readPdf(p.asset_id);
}
