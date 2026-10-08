import { publicationChecklist } from "./publication";
import type { NewsDraft } from "./model";
import type { Locale } from "@/i18n/config";

export class AdminError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function canonicalJson(value: unknown): string {
  const order = (v: unknown): unknown => Array.isArray(v) ? v.map(order) : record(v) ? Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, order(v[k])])) : v;
  return JSON.stringify(order(value));
}
const locales = ["bs", "sq", "en"] as const;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const localized = (v: unknown) => record(v) && locales.every(l => typeof v[l] === "string" && (v[l] as string).length <= 200000);
export const safeId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(v);

/** Strict server boundary. No arbitrary remote image URLs or styling inputs. */
export function validateDraft(value: unknown): asserts value is NewsDraft {
  if (!record(value) || !safeId(value.id) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0 || !["draft", "ready", "published"].includes(String(value.status)) || typeof value.date !== "string" || !["visits", "donations", "school", "events", "notices", "sport"].includes(String(value.topic)) || !localized(value.title) || !localized(value.slug) || !localized(value.lead) || !Array.isArray(value.blocks) || !Array.isArray(value.images) || !record(value.review)) throw new AdminError(422, "Nacrt nije u ispravnom formatu.");
  if (value.coverImageId !== null && !safeId(value.coverImageId)) throw new AdminError(422, "Neispravna naslovna slika.");
  const ids = new Set<string>();
  for (const image of value.images) {
    if (!record(image) || !safeId(image.id) || ids.has(image.id) || typeof image.src !== "string" || !/^\/(?:images|api\/admin\/media)\/[a-zA-Z0-9/_.-]+$/.test(image.src) || image.src.includes("..") || !Number.isInteger(image.width) || !Number.isInteger(image.height) || (image.width as number) < 1 || (image.height as number) < 1 || (image.width as number) > 20000 || (image.height as number) > 20000 || !localized(image.alt)) throw new AdminError(422, "Neispravna zajednička slika.");
    ids.add(image.id);
  }
  const blocks = new Set<string>();
  for (const b of value.blocks) {
    if (!record(b) || !safeId(b.id) || blocks.has(b.id) || !["text", "subheading", "image", "quote"].includes(String(b.type)) || (b.type === "image" ? typeof b.assetId !== "string" || (b.assetId !== "" && !ids.has(b.assetId)) : !localized(b.text))) throw new AdminError(422, "Neispravan blok sadržaja.");
    blocks.add(b.id);
  }
  for (const l of locales) {
    const r = value.review[l];
    if (!record(r) || typeof r.approved !== "boolean" || (r.reviewedRevision !== null && !Number.isSafeInteger(r.reviewedRevision))) throw new AdminError(422, "Neispravan ljudski pregled.");
  }
}
export function assertPublishable(draft: NewsDraft, locale: Locale = "bs") {
  const missing = publicationChecklist(draft, locale).filter(c => !c.complete);
  if (missing.length) throw new AdminError(422, `Objava nije spremna: ${missing.map(c => c.label).join(", ")}.`);
}
