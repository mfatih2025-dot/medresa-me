import type { ManagedArticle, NewsListRow } from "./model";
import { publicationChecklist } from "./publication";
/** Compact phone payload. Full documents are fetched only for editing or preview. */
export function newsListRow(row: ManagedArticle): NewsListRow {
  const d = row.draft; const checks = publicationChecklist(d);
  return { id: d.id, revision: d.revision, title: d.title, date: d.date, status: d.status, cover: d.images.find(i => i.id === d.coverImageId) ?? null,
    complete: { bs: !!checks.find(c => c.key === "bs")?.complete, sq: !!checks.find(c => c.key === "sq")?.complete, en: !!checks.find(c => c.key === "en")?.complete },
    archivedAt: row.archivedAt, deletedAt: row.deletedAt, source: row.source };
}
