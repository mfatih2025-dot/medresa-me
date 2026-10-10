import { AdminError } from "../contracts";
import { campaignLocales, localeComplete, uuid, type CampaignDraft } from "./model";
export function validateCampaign(value: unknown): asserts value is CampaignDraft {
  const v = value as CampaignDraft;
  if (!v || typeof v !== "object" || Array.isArray(v) || !uuid(v.id) || !Number.isSafeInteger(v.revision) || v.revision < 0 || typeof v.name !== "string" || !v.name.trim() || v.name.length > 160 || typeof v.active !== "boolean" || (v.posterId !== null && !uuid(v.posterId))) throw new AdminError(422, "Provjerite naziv akcije, tekst dugmeta, sliku i ispravan link.");
  if (!v.content || typeof v.content !== "object" || Array.isArray(v.content) || Object.keys(v.content).length !== 3 || campaignLocales.some(locale => {
    const pair = v.content[locale]; return !pair || typeof pair !== "object" || Array.isArray(pair) || Object.keys(pair).length !== 2 || typeof pair.text !== "string" || pair.text.length > 80 || typeof pair.link !== "string" || pair.link.length > 2048;
  })) throw new AdminError(422, "Provjerite BS, SQ i EN tekstove i linkove.");
  if (!v.localeActive || Object.keys(v.localeActive).length !== 3 || campaignLocales.some(l => typeof v.localeActive[l] !== "boolean")) throw new AdminError(422, "Status jezika nije ispravan.");
  if (v.active !== campaignLocales.some(l => v.localeActive[l])) throw new AdminError(422, "Status akcije nije ispravan.");
  if (campaignLocales.some(l => v.localeActive[l] && !localeComplete(v.content,l))) throw new AdminError(422, "Za aktivaciju ovog jezika unesite ispravan tekst dugmeta i link.");
  for (const date of [v.startsAt, v.endsAt]) if (date !== null && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date.replace(/Z$/, date.includes(".") ? "Z" : ".000Z"))) throw new AdminError(422, "Vrijeme prikazivanja nije ispravno.");
  if (v.startsAt && v.endsAt && Date.parse(v.startsAt) >= Date.parse(v.endsAt)) throw new AdminError(422, "Kraj prikazivanja mora biti poslije početka.");
  if (v.active && !v.posterId) throw new AdminError(422, "Aktivna akcija mora imati sliku.");
}
