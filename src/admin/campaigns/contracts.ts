import { AdminError } from "../contracts";
import { uuid, validDestination, type CampaignDraft } from "./model";
export function validateCampaign(value: unknown): asserts value is CampaignDraft {
  const v = value as CampaignDraft;
  if (!v || typeof v !== "object" || Array.isArray(v) || !uuid(v.id) || !Number.isSafeInteger(v.revision) || v.revision < 0 || typeof v.name !== "string" || !v.name.trim() || v.name.length > 160 || typeof v.ctaText !== "string" || !v.ctaText.trim() || v.ctaText.length > 80 || !validDestination(v.ctaLink) || typeof v.active !== "boolean" || (v.posterId !== null && !uuid(v.posterId))) throw new AdminError(422, "Provjerite naziv akcije, tekst dugmeta, sliku i ispravan link.");
  for (const date of [v.startsAt, v.endsAt]) if (date !== null && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date.replace(/Z$/, date.includes(".") ? "Z" : ".000Z"))) throw new AdminError(422, "Vrijeme prikazivanja nije ispravno.");
  if (v.startsAt && v.endsAt && Date.parse(v.startsAt) >= Date.parse(v.endsAt)) throw new AdminError(422, "Kraj prikazivanja mora biti poslije početka.");
  if (v.active && !v.posterId) throw new AdminError(422, "Aktivna akcija mora imati sliku.");
}
