import { articles } from "@/content/vijesti";
import { importArticle } from "@/admin/import";
import { AdminError } from "@/admin/contracts";
import type { EditorProps } from "@/admin/DraftEditor";
import { archiveAssets, getNews } from "./news";
import { listImages } from "./media";
import { backendState } from "./supabase";
export async function editorProps(id?: string): Promise<EditorProps | null> {
  const state = backendState();
  try {
    const initial = id ? await getNews(id) : null;
    if (id && !initial) return null;
    return { initial, assets: await listImages(), backend: state };
  } catch (error) {
    const legacy = articles.find(a => a.id === id);
    if (id && !legacy) return null;
    return { initial: legacy ? importArticle(legacy) : null, assets: archiveAssets(), backend: { state: "error", writable: false, message: error instanceof AdminError ? error.message : "Baza nije dostupna. Spremanje nije omogućeno." } };
  }
}
