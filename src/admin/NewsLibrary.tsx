import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Shell } from "./Shell";
import { ConfirmDialog } from "./ConfirmDialog";
import { LivePreview } from "./LivePreview";
import { adminRequest } from "./client";
import { NewArticleAction } from "./NewArticleAction";
import { newsListRow } from "./list";
import { statusLabels, type BackendState, type ManagedArticle, type NewsListRow } from "./model";
import styles from "./admin.module.css";
export function NewsLibrary({ rows: initialRows, backend, preview }: { rows: NewsListRow[]; backend: BackendState; preview: ManagedArticle | null }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<{ row: NewsListRow; action: "trash" | "archive" } | null>(null);
  const filtered = rows.filter(r => (filter === "trash" ? !!r.deletedAt : filter === "archive" ? !!r.archivedAt && !r.deletedAt : !r.archivedAt && !r.deletedAt && (filter === "active" || r.status === filter)) && `${r.title.bs} ${r.title.sq} ${r.title.en}`.toLocaleLowerCase("bs").includes(query.toLocaleLowerCase("bs")));
  async function transition(row: NewsListRow, action: "trash" | "archive" | "restore") {
    setBusy(true); setMessage("");
    try {
      const result = await adminRequest<{ article: ManagedArticle }>(`/api/admin/news/${row.id}`, { action, expectedRevision: row.revision, confirmedId: row.id });
      setRows(rows => rows.map(r => r.id === result.article.draft.id ? newsListRow(result.article) : r));
      setConfirmation(null); setMessage(action === "trash" ? "Vijest je premještena u smeće. Možete je vratiti; slike su sačuvane." : action === "archive" ? "Vijest je arhivirana u bazi. Javni izvor još nije povezan." : "Vijest je vraćena.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Promjena nije spremljena."); setConfirmation(null); }
    finally { setBusy(false); }
  }
  return <Shell active="/admin/vijesti" title="Vijesti" intro="Jedna vijest, tri jezika. Javni izgled ostaje isti." action={<NewArticleAction backend={backend} />}>
    <div className={styles.noticeInline}><span className={styles.status}>{backend.state === "connected" ? "Urednička baza" : "Javna arhiva"}</span><p>{backend.message} {rows.some(r => r.source === "static") ? "Postojeće vijesti čekaju provjereni import prije spremanja i upravljanja." : ""}</p></div>
    <div className={styles.toolbar}><label className={styles.search}>Pretraži vijesti<input type="search" placeholder="Naslov vijesti…" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Status<select aria-label="Status" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Sve aktivne</option><option value="draft">Nacrt</option><option value="ready">Spremno</option><option value="published">Objavljeno</option><option value="archive">Arhiva</option><option value="trash">Smeće</option></select></label><span>{filtered.length} / {rows.length}</span></div>
    <p role="status" className={styles.muted}>{message}</p>
    <div className={styles.managementList}>{filtered.map(row => {
      const d = row; const cover = row.cover;
      const actionable = backend.writable && row.source === "database";
      return <article className={styles.managementRow} key={d.id}><div className={styles.managementTitle}>{cover ? <Image unoptimized src={cover.src} alt="" width={96} height={72} className={styles.coverThumb} /> : <span className={styles.coverPlaceholder}>Bez slike</span>}<div><h2>{d.title.bs || "Nacrt bez naslova"}</h2><time dateTime={d.date}>{d.date || "Datum nije odabran"}</time><span className={styles.status}>{row.deletedAt ? "Smeće" : row.archivedAt ? "Arhiva" : statusLabels[d.status]}{row.source === "static" ? " · javna arhiva" : " · baza"}</span><span className={styles.languages}>{(["bs", "sq", "en"] as const).map(l => <span key={l}>{l.toUpperCase()} {row.complete[l] ? "✓" : "○"}</span>)}</span></div></div><div className={styles.rowActions}><Link className={styles.textLink} href={`/admin/vijesti/${d.id}`}>Uredi</Link><Link className={styles.textLink} href={`/admin/vijesti?preview=${d.id}`} scroll={false}>Pregled</Link>{row.archivedAt || row.deletedAt ? <button className={styles.textLink} disabled={!actionable || busy} onClick={() => transition(row, "restore")}>Vrati</button> : <button className={styles.textLink} disabled={!actionable || busy} onClick={() => setConfirmation({ row, action: "archive" })}>Arhiviraj</button>}<button className={styles.textLink} disabled={!actionable || !!row.deletedAt || busy} onClick={() => setConfirmation({ row, action: "trash" })}>Obriši</button></div></article>;
    })}{!filtered.length && <p className={styles.emptySearch}>Nema vijesti u ovom prikazu.</p>}</div>
    {preview && <section><div className={styles.sectionHead}><h2>{preview.draft.title.bs || "Nacrt"}</h2><Link className={styles.secondary} href="/admin/vijesti" scroll={false}>Zatvori pregled</Link></div><LivePreview draft={preview.draft} /></section>}
    {confirmation && <ConfirmDialog title={confirmation.action === "trash" ? "Premjesti vijest u smeće?" : "Arhiviraj vijest?"} description={`„${confirmation.row.title.bs}“ — ${confirmation.action === "trash" ? "Vijest i slike ostaju sačuvani. Vijest možete vratiti iz smeća." : "Vijest ostaje u bazi i može se vratiti. Javna arhiva sada ostaje neizmijenjena."}`} confirm={confirmation.action === "trash" ? "Premjesti u smeće" : "Arhiviraj"} busy={busy} onCancel={() => setConfirmation(null)} onConfirm={() => transition(confirmation.row, confirmation.action)} />}
  </Shell>;
}
