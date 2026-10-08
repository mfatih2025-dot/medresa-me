import { articles } from "@/content/vijesti";
import { importArticle } from "@/admin/import";
import { AdminError } from "@/admin/contracts";
import type { EditorProps } from "@/admin/DraftEditor";
import { archiveAssets, getNews, readLocalePublications } from "./news";
import { listImages } from "./media";
import { backendState } from "./supabase";
import { translationAvailable } from "./translation";
export async function editorProps(id?: string): Promise<EditorProps | null> {
  const state = backendState();
  try {
    const initial = id ? await getNews(id) : null;
    if (id && !initial) return null;
    return { initial, assets: await listImages(), translationAvailable: translationAvailable(), backend: { ...state, localePublishingReady: initial?.localePublishingReady ?? (state.state === "connected" && (await readLocalePublications()).available) } };
  } catch (error) {
    const legacy = articles.find(a => a.id === id);
    if (id && !legacy) return null;
    return { initial: legacy ? importArticle(legacy) : null, assets: archiveAssets(), backend: { state: "error", writable: false, message: error instanceof AdminError ? error.message : "Baza nije dostupna. Spremanje nije omogućeno." } };
  }
}
