import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { AdminError } from "@/admin/contracts";
import { validateCampaign } from "@/admin/campaigns/contracts";
import { campaignLocales, campaignRejection, completeContent, scheduleEligible, eligible, uuid, type CampaignDiagnostic, type CampaignContent, type Campaign, type CampaignDraft, type CampaignLibrary, type Poster, type PublicCampaign } from "@/admin/campaigns/model";
import { supabaseConfiguration, supabaseRequest } from "../supabase";
const BUCKET = "medresa-campaigns-preview";
const PREVIEW_REF = "safsijrhxbefgcahvsvm";
export const MAX_POSTER_BYTES = 4 * 1024 * 1024;
export const POSTER_MIMES = ["image/jpeg", "image/png", "image/webp"];
export function campaignConfiguration(write = false) {
  const c = supabaseConfiguration();
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "codex/admin-panel" || !c || c.ref !== PREVIEW_REF) throw new AdminError(503, "Akcije su dostupne samo na namijenjenom Preview projektu.");
  if (write && !c.writable) throw new AdminError(503, "Upis u Preview nije omogućen.");
  return c;
}
type AssetRow = { id: string; object_path: string; mime: string; bytes: number; width: number; height: number };
type CampaignRow = { id: string; revision: number; name: string; poster_id: string | null; cta_text: string; cta_link: string; cta_localizations: CampaignContent; active: boolean; starts_at: string | null; ends_at: string | null; created_at: string; updated_at: string; activated_at: string | null };
const campaignColumns = "id,revision,name,poster_id,cta_text,cta_link,cta_localizations,active,starts_at,ends_at,created_at,updated_at,activated_at";
async function request(path: string, init: RequestInit = {}, write = false) { campaignConfiguration(write); return supabaseRequest(path, { ...init, redirect: "error" }, write); }
function poster(row: Pick<AssetRow, "id" | "width" | "height">): Poster { return { id: row.id, width: row.width, height: row.height, src: `/api/admin/campaigns/assets/${row.id}` }; }
function project(row: CampaignRow, asset?: Pick<AssetRow, "id" | "width" | "height">): Campaign {
  return { id: row.id, revision: row.revision, name: row.name, poster: asset ? poster(asset) : null, ctaText: row.cta_text, ctaLink: row.cta_link, content: row.cta_localizations, active: row.active, startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null, endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null, createdAt: row.created_at, updatedAt: row.updated_at, activatedAt: row.activated_at };
}
async function rows(activeOnly = false): Promise<Campaign[]> {
  const campaigns = new Map<string, Campaign>();
  // Embed only referenced asset dimensions. Retained old/unreferenced uploads
  // cannot hide a new poster behind PostgREST's default row limit.
  for (let offset = 0; ; offset += 200) {
    const page = await (await request(`/rest/v1/medresa_campaigns?select=${campaignColumns},poster:medresa_campaign_assets(id,width,height)&order=updated_at.desc,id.asc&limit=200&offset=${offset}${activeOnly ? "&active=eq.true" : ""}`)).json();
    if (!Array.isArray(page)) throw new AdminError(503, "Akcije trenutno nijesu dostupne.");
    for (const row of page) campaigns.set(row.id, project(row, row.poster ?? undefined));
    if (page.length < 200) break;
  }
  return [...campaigns.values()];
}
export async function listCampaigns(): Promise<CampaignLibrary> {
  try { const c = campaignConfiguration(); return { generatedAt: new Date().toISOString(), campaigns: await rows(), ready: true, writable: c.writable, message: c.writable ? null : "Akcije su dostupne samo za čitanje." }; }
  catch { return { generatedAt: new Date().toISOString(), campaigns: [], ready: false, writable: false, message: "Akcije trenutno nijesu spremne. Provjerite Preview povezivanje i migraciju za akcije." }; }
}
export async function saveCampaign(value: unknown, actor: string): Promise<Campaign> {
  campaignConfiguration(true); validateCampaign(value); const draft: CampaignDraft = value;
  let result: Response;
  try {
    result = await request("/rest/v1/rpc/medresa_campaign_save_localized", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_id: draft.id, p_expected: draft.revision, p_name: draft.name, p_poster: draft.posterId, p_content: draft.content, p_active: draft.active, p_starts: draft.startsAt, p_ends: draft.endsAt, p_actor: actor }) }, true);
  } catch (error) {
    if (error instanceof AdminError && error.status === 409) throw new AdminError(409, "Akcija je promijenjena u drugom prozoru. Ponovo je otvorite prije spremanja.");
    if (error instanceof AdminError && error.status === 404) throw new AdminError(404, "Akcija nije pronađena.");
    throw error;
  }
  const row = await result.json();
  const assets: AssetRow[] = draft.posterId ? await (await request(`/rest/v1/medresa_campaign_assets?id=eq.${draft.posterId}&select=id,width,height&limit=1`)).json() : [];
  return project(row, assets[0]);
}
/** Strict decoder validation only. Stored and served bytes are the ORIGINAL,
 * not an optimized/transcoded/cropped derivative. EXIF orientation is browser-applied. */
export async function validatePoster(bytes: Buffer, mime: string) {
  if (!POSTER_MIMES.includes(mime) || !bytes.length || bytes.length > MAX_POSTER_BYTES) throw new AdminError(422, "Odaberite JPG, PNG ili WebP sliku do 4 MB.");
  try {
    const image = sharp(bytes, { limitInputPixels: 40000000, animated: false, failOn: "warning" });
    const m = await image.metadata();
    if (m.format !== ({ "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[mime] || !m.width || !m.height || (m.pages ?? 1) > 1 || m.width > 20000 || m.height > 20000) throw new Error();
    // Decode to detect truncated/corrupted input, discard derivative. Never persist it.
    await image.stats();
    return (m.orientation ?? 1) >= 5 ? { width: m.height, height: m.width } : { width: m.width, height: m.height };
  } catch { throw new AdminError(422, "Slika je oštećena ili nepodržana (najviše 40 megapiksela)."); }
}
export async function uploadPoster(bytes: Buffer, mime: string, actor: string): Promise<Poster> {
  campaignConfiguration(true); const dimensions = await validatePoster(bytes, mime);
  const id = randomUUID(), extension = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const path = `posters/${id}.${extension}`;
  await request(`/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { "Content-Type": mime, "x-upsert": "false" }, body: new Uint8Array(bytes) }, true);
  // No overwrites or automatic deletion. Unreferenced uploads remain private and recoverable.
  await request("/rest/v1/medresa_campaign_assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, object_path: path, mime, bytes: bytes.length, ...dimensions, created_by: actor }) }, true);
  return { id, ...dimensions, src: `/api/admin/campaigns/assets/${id}` };
}
export async function readPoster(id: string) {
  if (!uuid(id)) throw new AdminError(404, "Slika nije pronađena.");
  const assets: AssetRow[] = await (await request(`/rest/v1/medresa_campaign_assets?id=eq.${id}&select=id,object_path,mime,bytes,width,height&limit=1`)).json();
  const asset = assets[0]; if (!asset || !POSTER_MIMES.includes(asset.mime) || !/^posters\/[a-f0-9-]+\.(jpg|png|webp)$/.test(asset.object_path)) throw new AdminError(404, "Slika nije pronađena.");
  const response = await request(`/storage/v1/object/authenticated/${BUCKET}/${asset.object_path}`);
  const bytes = Buffer.from(await response.arrayBuffer()); if (bytes.length !== asset.bytes || bytes.length > MAX_POSTER_BYTES) throw new AdminError(503, "Slika trenutno nije dostupna.");
  return { bytes, mime: asset.mime };
}
/** Several campaigns may be scheduled. Only the most recently ACTIVATED eligible
 * campaign wins (ID breaks ties). Edits don't silently reorder active campaigns. */
export function selectCampaign(campaigns: Campaign[], now = Date.now()) {
  const current = campaigns.filter(c => eligible(c, now)).sort((a, b) => (b.activatedAt ?? "").localeCompare(a.activatedAt ?? "") || a.id.localeCompare(b.id))[0];
  const times = campaigns.filter(c => c.active && c.poster).flatMap(c => [c.startsAt, c.endsAt]).filter((t): t is string => !!t && Date.parse(t) > now).sort((a,b) => Date.parse(a)-Date.parse(b));
  const campaign: PublicCampaign | null = current?.poster ? { id: current.id, version: current.revision, poster: { ...current.poster, src: `/api/campaigns/poster/${current.id}?version=${current.revision}` }, ctaText: current.content.bs.text, ctaLink: current.content.bs.link, content: current.content, endsAt: current.endsAt } : null;
  return { campaign, nextChangeAt: times[0] ?? null };
}
export async function currentCampaign(now = Date.now()) {
  try { campaignConfiguration(); return selectCampaign(await rows(true), now); } catch { console.warn("medresa.campaign.read.failed", { reason: "campaign_backend_unavailable" }); return { campaign: null, nextChangeAt: null }; }
}
export async function publicPoster(id: string, version: string) {
  if (!uuid(id) || !/^[1-9]\d{0,15}$/.test(version)) throw new AdminError(404, "Slika nije dostupna.");
  const { campaign } = await currentCampaign();
  if (!campaign || campaign.id !== id || campaign.version !== Number(version)) throw new AdminError(404, "Slika nije dostupna.");
  return readPoster(campaign.poster.id);
}

/** Database reserves an unreferenced asset before Storage deletion. Reserved assets
 * cannot acquire new references; shared posters are never returned for cleanup. */
export async function deleteCampaign(value: unknown) {
  campaignConfiguration(true);
  const input = value as { id: string; revision: number };
  if (!input || !uuid(input.id) || !Number.isSafeInteger(input.revision) || input.revision < 1) throw new AdminError(422, "Akcija nije ispravna.");
  const result = await (await request("/rest/v1/rpc/medresa_campaign_delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_id: input.id, p_expected: input.revision }) }, true)).json();
  let cleanup = true;
  if (result.asset_id) {
    try {
      if (!uuid(result.asset_id) || result.object_path !== `posters/${result.asset_id}.${result.extension}` || !["jpg", "png", "webp"].includes(result.extension)) throw new Error();
      await request(`/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [result.object_path] }) }, true);
      await request("/rest/v1/rpc/medresa_campaign_finish_cleanup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_asset: result.asset_id }) }, true);
    } catch { cleanup = false; } // Retain the reserved private asset on cleanup failure; never reuse it.
  }
  return { id: input.id, cleanup };
}

/** Explicit authenticated read-only probe. No raw provider errors, credentials,
 * private Storage paths or poster bytes leave this projection. */
export async function diagnoseCampaign(id: string): Promise<CampaignDiagnostic> {
  campaignConfiguration();
  if (!uuid(id)) throw new AdminError(422, "Akcija nije ispravna.");
  const campaigns = await rows(), now = Date.now(), target = campaigns.find(c => c.id === id);
  const selected = selectCampaign(campaigns, now).campaign;
  let posterAccessible: boolean | null = null;
  if (target?.poster) { try { await readPoster(target.poster.id); posterAccessible = true; } catch { posterAccessible = false; } }
  const reason = target ? campaignRejection(target, now) : "campaign_missing";
  return {
    campaignFound: !!target, id: target?.id ?? null, revision: target?.revision ?? null,
    active: target?.active ?? false, scheduleEligible: !!target && scheduleEligible(target, now),
    localizationComplete: !!target && completeContent(target.content),
    missingLocales: target ? campaignLocales.filter(locale => !completeContent({ bs: target.content[locale], sq: target.content[locale], en: target.content[locale] })) : [...campaignLocales],
    serverTime: new Date(now).toISOString(), startsAt: target?.startsAt ?? null, endsAt: target?.endsAt ?? null,
    selectedForPublic: !!target && selected?.id === target.id,
    posterAccessible,
    rejectionReason: reason ?? (selected?.id !== target?.id ? "another_campaign_selected" : posterAccessible === false ? "poster_unavailable" : null),
  };
}
