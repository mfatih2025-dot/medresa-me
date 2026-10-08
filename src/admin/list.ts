import type { ManagedArticle, NewsListRow } from "./model";
import { localeStatus, publicationChecklist } from "./publication";
/** Compact phone payload. Full documents are fetched only for editing or preview. */
export function newsListRow(row: ManagedArticle): NewsListRow {
  const d = row.draft;
  return { id: d.id, revision: d.revision, title: d.title, date: d.date, status: row.publications && Object.keys(row.publications).length ? "published" : d.status, cover: d.images.find(i => i.id === d.coverImageId) ?? null,
    complete: Object.fromEntries((["bs", "sq", "en"] as const).map(l => [l, !!publicationChecklist(d, l).find(c => c.key === l)?.complete])) as NewsListRow["complete"],
    localeStatus: Object.fromEntries((["bs", "sq", "en"] as const).map(l => [l, localeStatus(d, row.publications, l)])) as NewsListRow["localeStatus"],
    archivedAt: row.archivedAt, deletedAt: row.deletedAt, source: row.source };
}
