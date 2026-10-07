import type { ContentBlock, LocalizedText, NewsDraft } from "./model";
import { revise } from "./model";

export type TranslationDraft = {
  title: Pick<LocalizedText, "sq" | "en">;
  slug: Pick<LocalizedText, "sq" | "en">;
  lead: Pick<LocalizedText, "sq" | "en">;
  blocks: { id: string; text: Pick<LocalizedText, "sq" | "en"> }[];
};

/** Apply text only. Keep BS, block IDs/order, images and cover; invalidate approvals. */
export function applyTranslationDraft(draft: NewsDraft, translation: TranslationDraft): NewsDraft {
  const textual = draft.blocks.filter(b => b.type !== "image");
  if (translation.blocks.length !== textual.length || translation.blocks.some((b, i) => b.id !== textual[i].id)) throw new Error("Translation must preserve the master block structure");
  const blocks: ContentBlock[] = draft.blocks.map(b => b.type === "image" ? b : {
    ...b, text: { bs: b.text.bs, sq: translation.blocks.find(t => t.id === b.id)!.text.sq, en: translation.blocks.find(t => t.id === b.id)!.text.en },
  });
  return revise(draft, {
    title: { bs: draft.title.bs, sq: translation.title.sq, en: translation.title.en },
    slug: { bs: draft.slug.bs, sq: translation.slug.sq, en: translation.slug.en },
    lead: { bs: draft.lead.bs, sq: translation.lead.sq, en: translation.lead.en }, blocks,
  });
}
