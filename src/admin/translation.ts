import type { LocalizedText, NewsDraft } from "./model";
import { revise } from "./model";

export const translationLocales = ["sq", "en"] as const;
type TranslatedText = Pick<LocalizedText, "sq" | "en">;
export type TranslationDraft = {
  title: TranslatedText; slug: TranslatedText; lead: TranslatedText;
  blocks: { id: string; type: NewsDraft["blocks"][number]["type"]; text: TranslatedText }[];
  images: { id: string; alt: TranslatedText }[];
};

/** Treat all non-empty translations as manual work; no untracked overwrite. */
export function existingTranslationLocales(draft: NewsDraft) {
  return translationLocales.filter(l => [draft.title[l], draft.slug[l], draft.lead[l], ...draft.blocks.flatMap(b => b.type === "image" ? [] : [b.text[l]]), ...draft.images.map(i => i.alt[l])].some(s => !!s.trim()));
}
export function bosnianTranslationReady(draft: NewsDraft) {
  return !!draft.title.bs.trim() && draft.blocks.some(b => b.type !== "image") && draft.blocks.every(b => b.type === "image" ? !!b.assetId && draft.images.some(i => i.id === b.assetId) : !!b.text.bs.trim());
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const text = (v: unknown): v is TranslatedText => object(v) && keys(v, ["sq", "en"]) && translationLocales.every(l => typeof v[l] === "string" && v[l].length <= 200000);

/** Independent validation even with OpenAI's strict JSON schema. */
export function validateTranslationDraft(draft: NewsDraft, value: unknown): asserts value is TranslationDraft {
  if (!object(value) || !keys(value, ["title", "slug", "lead", "blocks", "images"]) || !text(value.title) || !text(value.slug) || !text(value.lead) || !Array.isArray(value.blocks) || !Array.isArray(value.images) || value.blocks.length !== draft.blocks.length || value.images.length !== draft.images.length) throw new Error("Neispravan prijevod. Postojeći sadržaj je sačuvan.");
  for (const l of translationLocales) if (!value.title[l].trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.slug[l]) || /^\d+$/.test(value.slug[l]) || (!!draft.lead.bs.trim() !== !!value.lead[l].trim())) throw new Error("Neispravna prevedena polja.");
  value.blocks.forEach((b, i) => {
    const master = draft.blocks[i];
    if (!object(b) || !keys(b, ["id", "type", "text"]) || b.id !== master.id || b.type !== master.type || !text(b.text)) throw new Error("Prijevod mora sačuvati redoslijed i vrste blokova.");
    const translated = b.text;
    if (translationLocales.some(l => master.type === "image" ? translated[l] !== "" : !translated[l].trim())) throw new Error("Prijevod mora sačuvati tekstualne blokove.");
  });
  value.images.forEach((image, i) => {
    if (!object(image) || !keys(image, ["id", "alt"]) || image.id !== draft.images[i].id || !text(image.alt)) throw new Error("Prijevod mora sačuvati zajedničke slike.");
    const alt = image.alt;
    if (translationLocales.some(l => !!draft.images[i].alt.bs.trim() !== !!alt[l].trim())) throw new Error("Neispravni prevedeni opisi slika.");
  });
}

/** Apply text only. Preserve every BS field, shared structure and image metadata. */
export function applyTranslationDraft(draft: NewsDraft, translation: TranslationDraft): NewsDraft {
  validateTranslationDraft(draft, translation);
  const next = revise(draft, {
    title: { bs: draft.title.bs, ...translation.title }, slug: { bs: draft.slug.bs, ...translation.slug }, lead: { bs: draft.lead.bs, ...translation.lead },
    blocks: draft.blocks.map((b, i) => b.type === "image" ? b : { ...b, text: { bs: b.text.bs, ...translation.blocks[i].text } }),
    images: draft.images.map((image, i) => ({ ...image, alt: { bs: image.alt.bs, ...translation.images[i].alt } })),
  });
  // Identical regenerated text still requires a fresh human review.
  for (const l of translationLocales) next.review[l] = { approved: false, reviewedRevision: null };
  return next;
}
