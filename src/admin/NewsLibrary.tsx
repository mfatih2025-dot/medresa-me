import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Shell } from "./Shell";
import type { ArchiveRow } from "./Overview";
import styles from "./admin.module.css";

export function NewsLibrary({ rows }: { rows: ArchiveRow[] }) {
  const [query, setQuery] = useState("");
  const [locale, setLocale] = useState<Locale>("bs");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("desktop");
  const router = useRouter();
  const selected = rows.find(r => r.id === router.query.preview);
  const filtered = rows.filter(r => r.title.toLocaleLowerCase("bs").includes(query.toLocaleLowerCase("bs")));
  return <Shell active="/admin/vijesti" title="Vijesti" intro="Jedna vijest, tri jezika. Javni izgled ostaje isti." action={<Link href="/admin/vijesti/nova" className={styles.primary}>＋ Nova vijest</Link>}>
    <div className={styles.noticeInline}><span className={styles.status}>Javna arhiva · samo pregled</span><p>Postojećih 17 članaka nije migrirano. Novi nacrti još se ne spremaju u bazu.</p></div>
    <div className={styles.toolbar}><label className={styles.search}><span>Pretraži javne vijesti</span><input type="search" placeholder="Naslov vijesti…" value={query} onChange={e => setQuery(e.target.value)} /></label><span>{filtered.length} / {rows.length} vijesti</span></div>
    <div className={styles.archiveTable}><div className={styles.tableHead}><span>Naslov / jezičke verzije</span><span>Datum</span><span>Fotografije</span><span>Pregled</span></div>{filtered.map(r => <div className={styles.tableRow} key={r.id}><div><h2>{r.title}</h2><span className={styles.languages}>BS <i /> SQ <i /> EN <span>Objavljeno</span></span></div><time dateTime={r.date}>{r.date}</time><span>{r.photos ? `${r.photos} foto` : "Bez fotografije"}</span><Link href={`/admin/vijesti?preview=${r.id}`} className={styles.textLink}>Pregled ↗</Link></div>)}{!filtered.length && <p className={styles.emptySearch}>Nema vijesti s ovim naslovom.</p>}</div>
    {selected && <section className={styles.previewPanel} aria-label="Pregled stvarnog javnog članka"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>Stvarni javni renderer</p><h2>Pregled članka</h2></div><Link href="/admin/vijesti" scroll={false} className={styles.secondary}>Zatvori</Link></div><p className={styles.muted}>{selected.title}</p><div className={styles.previewControls}><div className={styles.segment} aria-label="Jezik pregleda">{(["bs", "sq", "en"] as const).map(l => <button key={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div><div className={styles.segment} aria-label="Veličina pregleda"><button aria-pressed={viewport === "mobile"} onClick={() => setViewport("mobile")}>Mobile</button><button aria-pressed={viewport === "desktop"} onClick={() => setViewport("desktop")}>Desktop</button></div></div><div className={styles.previewScroll}><iframe title={`${selected.title} · ${locale.toUpperCase()} · ${viewport}`} src={`/admin-preview/${selected.id}?locale=${locale}`} className={viewport === "mobile" ? styles.mobileFrame : styles.desktopFrame} /></div><p className={styles.muted}>Pregled koristi postojeći Article, fotografije i animacije. Prikazana je javna verzija; nacrti još nisu povezani.</p></section>}
  </Shell>;
}
