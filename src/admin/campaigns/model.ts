export type Poster = { id: string; width: number; height: number; src: string };
export type Campaign = {
  id: string; revision: number; name: string; poster: Poster | null;
  ctaText: string; ctaLink: string; active: boolean; startsAt: string | null; endsAt: string | null;
  createdAt: string; updatedAt: string; activatedAt: string | null;
};
export type CampaignDraft = Pick<Campaign, "id" | "revision" | "name" | "ctaText" | "ctaLink" | "active" | "startsAt" | "endsAt"> & { posterId: string | null };
export type CampaignLibrary = { generatedAt: string; campaigns: Campaign[]; ready: boolean; writable: boolean; message: string | null };
// Internal campaign names are never included in the public projection or overlaid on artwork.
export type PublicCampaign = { id: string; version: number; poster: Poster; ctaText: string; ctaLink: string; endsAt: string | null };
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
/** Exact administrator destination; no rewriting/localization. Reject executable,
 * protocol-relative, credential-bearing and control-character URLs. */
export function validDestination(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 2048 || value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith("/")) {
    if (value.startsWith("//") || /^\/(?:admin|api)(?:\/|[?#]|$)/i.test(value)) return false;
    try { const parsed = new URL(value, "https://medresa.invalid"); return parsed.origin === "https://medresa.invalid" && !/^\/(?:admin|api)(?:\/|$)/i.test(decodeURIComponent(parsed.pathname)); } catch { return false; }
  }
  try { const parsed = new URL(value); return parsed.protocol === "https:" && !parsed.username && !parsed.password && !!parsed.hostname; } catch { return false; }
}
export function eligible(campaign: Pick<Campaign, "active" | "startsAt" | "endsAt" | "poster">, now = Date.now()) {
  return campaign.active && !!campaign.poster && (!campaign.startsAt || Date.parse(campaign.startsAt) <= now) && (!campaign.endsAt || now < Date.parse(campaign.endsAt));
}
export function dismissalKey(campaign: Pick<PublicCampaign, "id" | "version">) { return `medresa.campaign.dismissed.${campaign.id}.v${campaign.version}`; }
