import type { NewsDraft } from "@/admin/model";
import type { TranslationDraft } from "@/admin/translation";
import { AdminError } from "@/admin/contracts";
/** Provider contract for a later reviewed server-side OpenAI integration. Never publishes. */
export async function translateBosnianMaster(_draft: NewsDraft): Promise<TranslationDraft> {
  void _draft;
  throw new AdminError(503, "OpenAI prijevod još nije povezan. SQ i EN uredite ručno i potvrdite ljudski pregled.");
}
