export const campaignLocales = ["bs", "sq", "en"] as const;
export type CampaignLocale = typeof campaignLocales[number];
export type CampaignContent = Record<CampaignLocale, { text: string; link: string }>;
export const emptyContent = (): CampaignContent => ({ bs: { text: "SAZNAJ VIŠE", link: "" }, sq: { text: "", link: "" }, en: { text: "", link: "" } });
export function completeContent(content: CampaignContent | undefined): boolean {
  return !!content && campaignLocales.every(locale => typeof content[locale]?.text === "string" && !!content[locale].text.trim() && content[locale].text.length <= 80 && validDestination(content[locale].link));
}
export type Poster = { id: string; width: number; height: number; src: string };
export type Campaign = {
  id: string; revision: number; name: string; poster: Poster | null;
  ctaText: string; ctaLink: string; content: CampaignContent; active: boolean; startsAt: string | null; endsAt: string | null;
  createdAt: string; updatedAt: string; activatedAt: string | null;
};
export type CampaignDraft = Pick<Campaign, "id" | "revision" | "name" | "ctaText" | "ctaLink" | "content" | "active" | "startsAt" | "endsAt"> & { posterId: string | null };
export type CampaignLibrary = { generatedAt: string; campaigns: Campaign[]; ready: boolean; writable: boolean; message: string | null };
// Internal campaign names are never included in the public projection or overlaid on artwork.
export type PublicCampaign = { id: string; version: number; poster: Poster; ctaText: string; ctaLink: string; endsAt: string | null; content?: CampaignContent };
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
export type CampaignRejection = "inactive" | "localization_incomplete" | "poster_missing" | "invalid_schedule" | "not_started" | "expired" | null;
export function scheduleEligible(c: Pick<Campaign, "startsAt" | "endsAt">, now = Date.now()) {
  return (!c.startsAt || Number.isFinite(Date.parse(c.startsAt)) && Date.parse(c.startsAt) <= now) && (!c.endsAt || Number.isFinite(Date.parse(c.endsAt)) && now < Date.parse(c.endsAt));
}
export function campaignRejection(c: Pick<Campaign, "active" | "startsAt" | "endsAt" | "poster"> & { content?: CampaignContent }, now = Date.now()): CampaignRejection {
  if (!c.active) return "inactive";
  if (!completeContent(c.content)) return "localization_incomplete";
  if (!c.poster) return "poster_missing";
  if ([c.startsAt, c.endsAt].some(t => t !== null && !Number.isFinite(Date.parse(t)))) return "invalid_schedule";
  if (c.startsAt && now < Date.parse(c.startsAt)) return "not_started";
  if (c.endsAt && now >= Date.parse(c.endsAt)) return "expired";
  return null;
}
export const campaignRejectionText: Record<Exclude<CampaignRejection, null>, string> = {
  inactive: "Neaktivna — nije objavljena.",
  localization_incomplete: "Nije javna — dopunite BS, SQ i EN tekstove i linkove.",
  poster_missing: "Nije javna — nedostaje poster.",
  invalid_schedule: "Nije javna — vrijeme prikazivanja nije ispravno.",
  not_started: "Zakazana — početak prikazivanja još nije nastupio.",
  expired: "Istekla — završeno prikazivanje.",
};
export function eligible(campaign: Pick<Campaign, "active" | "startsAt" | "endsAt" | "poster"> & { content?: CampaignContent }, now = Date.now()) {
  return campaignRejection(campaign, now) === null;
}
export type CampaignDiagnostic = {
  campaignFound: boolean; id: string | null; revision: number | null;
  active: boolean; scheduleEligible: boolean; localizationComplete: boolean;
  missingLocales: CampaignLocale[]; serverTime: string; startsAt: string | null; endsAt: string | null;
  selectedForPublic: boolean; posterAccessible: boolean | null;
  rejectionReason: CampaignRejection | "campaign_missing" | "another_campaign_selected" | "poster_unavailable";
};
export function dismissalKey(campaign: Pick<PublicCampaign, "id" | "version">) { return `medresa.campaign.dismissed.${campaign.id}.v${campaign.version}`; }
