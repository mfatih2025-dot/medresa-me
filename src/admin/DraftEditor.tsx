import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { ContentBlock, NewsDraft, SharedImage } from "./model";
import { emptyText, moveBlock, newDraft, revise } from "./model";
import { publicationChecklist } from "./publication";
import { Shell } from "./Shell";
import styles from "./admin.module.css";

const labels = { text: "Text", subheading: "Subheading", image: "Image", quote: "Quote" };
export function DraftEditor({ assets }: { assets: SharedImage[] }) {
  const [draft, setDraft] = useState(() => newDraft("unsaved-draft"));
  const [locale, setLocale] = useState<Locale>("bs");
  const [message, setMessage] = useState("");
  const checks = publicationChecklist(draft);
  const reviewed = draft.review[locale].approved;
  function change(patch: Partial<NewsDraft>) { setDraft(d => revise(d, patch)); setMessage(""); }
  function text(field: "title" | "slug" | "lead", value: string) { change({ [field]: { ...draft[field], [locale]: value } }); }
  function add(type: ContentBlock["type"]) {
    const id = crypto.randomUUID();
    const block: ContentBlock = type === "image" ? { id, type, assetId: "" } : { id, type, text: emptyText() };
    change({ blocks: [...draft.blocks, block] });
  }
  function imagePatch(assetId: string) {
    const image = assets.find(a => a.id === assetId);
    return image && !draft.images.some(i => i.id === image.id) ? [...draft.images, image] : draft.images;
  }
  function approve() {
    setDraft(d => {
      const next = { ...d, review: { ...d.review, [locale]: { approved: !d.review[locale].approved, reviewedRevision: d.revision } } };
      return { ...next, status: publicationChecklist(next).every(c => c.complete) ? "ready" : "draft" };
    });
  }
  function download() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "medresa-nacrt.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Nacrt je preuzet kao JSON. Nije spremljen u bazu niti objavljen.");
  }
  return <Shell active="/admin/vijesti" title="Nova vijest" intro="Priča u blokovima. Jedan redoslijed, tri jezika." action={<Link href="/admin/vijesti" className={styles.secondary}>← Javna arhiva</Link>}>
    <div className={styles.noticeInline}><span className={styles.status}>{draft.status === "ready" ? "Spremno · lokalni nacrt" : "Nacrt · samo u ovom prozoru"}</span><p>Spremanje u bazu nije povezano. Preuzmite JSON prije odlaska; osvježavanje stranice briše ovaj nacrt.</p></div>
    <div className={styles.editorGrid}><section className={styles.editor} aria-label="Uređivanje vijesti"><div className={styles.editorTop}><div className={styles.segment} aria-label="Jezik uređivanja">{(["bs", "sq", "en"] as const).map(l => <button key={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div><span>{locale === "bs" ? "Bosanski master" : "Prijevod za ljudski pregled"}</span></div>
      <label>Naslov · {locale.toUpperCase()}<input value={draft.title[locale]} onChange={e => text("title", e.target.value)} placeholder="Naslov vijesti" /></label>
      <div className={styles.fieldPair}><label>URL slug · {locale.toUpperCase()}<input value={draft.slug[locale]} onChange={e => text("slug", e.target.value)} placeholder="naslov-vijesti" autoCapitalize="none" spellCheck={false} /></label><label>Datum objave<input type="date" value={draft.date} onChange={e => change({ date: e.target.value })} /></label></div>
      <label>Uvod · opcionalno<textarea rows={2} value={draft.lead[locale]} onChange={e => text("lead", e.target.value)} placeholder="Kratak uvod u priču" /></label>
      <div className={styles.fieldPair}><label>Tema<select value={draft.topic} onChange={e => change({ topic: e.target.value as NewsDraft["topic"] })}><option value="school">Iz škole</option><option value="visits">Posjete</option><option value="donations">Donacije</option><option value="events">Obilježavanja</option><option value="notices">Obavještenja</option><option value="sport">Sport</option></select></label><label>Naslovna slika<select value={draft.coverImageId ?? ""} onChange={e => change({ coverImageId: e.target.value || null, images: imagePatch(e.target.value) })}><option value="">Odaberite zajedničku sliku</option>{assets.map((a, i) => <option key={a.id} value={a.id}>{i + 1}. {a.alt.bs}</option>)}</select></label></div>
      <div className={styles.sectionHead}><h2>Sadržaj</h2><span>{draft.blocks.length} blokova</span></div><p className={styles.muted}>Povucite ručicu za redoslijed ili koristite ↑ / ↓ na telefonu i tastaturi. Redoslijed vrijedi za sva tri jezika.</p>
      {!draft.blocks.length && <div className={styles.blockEmpty}>Počnite prvim blokom. Priča određuje redoslijed.</div>}
      <ol className={styles.blocks}>{draft.blocks.map((block, index) => <li key={block.id} className={styles.block} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const from = draft.blocks.findIndex(b => b.id === e.dataTransfer.getData("text/medresa-block")); if (from >= 0) change({ blocks: moveBlock(draft.blocks, from, index) }); }}><div className={styles.blockHead}><button type="button" draggable onDragStart={e => { e.dataTransfer.setData("text/medresa-block", block.id); e.dataTransfer.effectAllowed = "move"; }} aria-label={`Povuci blok ${index + 1}`} className={styles.dragHandle}>⠿</button><b>{String(index + 1).padStart(2, "0")} / {labels[block.type]}</b><div className={styles.blockActions}><button aria-label={`Pomjeri blok ${index + 1} gore`} disabled={index === 0} onClick={() => change({ blocks: moveBlock(draft.blocks, index, index - 1) })}>↑</button><button aria-label={`Pomjeri blok ${index + 1} dolje`} disabled={index === draft.blocks.length - 1} onClick={() => change({ blocks: moveBlock(draft.blocks, index, index + 1) })}>↓</button><button aria-label={`Ukloni blok ${index + 1}`} onClick={() => change({ blocks: draft.blocks.filter(b => b.id !== block.id) })}>×</button></div></div>
        {block.type === "image" ? <div className={styles.imageBlock}><label>Zajednička fotografija<select value={block.assetId} onChange={e => change({ blocks: draft.blocks.map(b => b.id === block.id ? { ...block, assetId: e.target.value } : b), images: imagePatch(e.target.value) })}><option value="">Odaberite iz javne biblioteke</option>{assets.map((a, i) => <option key={a.id} value={a.id}>{i + 1}. {a.alt.bs}</option>)}</select></label>{draft.images.filter(a => a.id === block.assetId).map(a => <div key={a.id}><Image src={a.src} alt={a.alt[locale]} width={a.width} height={a.height} sizes="(min-width: 1024px) 500px, 90vw" className={styles.assetPreview} /><label>Opis slike · {locale.toUpperCase()}<input value={a.alt[locale]} onChange={e => change({ images: draft.images.map(i => i.id === a.id ? { ...i, alt: { ...i.alt, [locale]: e.target.value } } : i) })} /></label></div>)}</div> : <textarea aria-label={`${labels[block.type]} ${index + 1} · ${locale.toUpperCase()}`} rows={block.type === "text" ? 5 : 2} value={block.text[locale]} onChange={e => change({ blocks: draft.blocks.map(b => b.id === block.id ? { ...block, text: { ...block.text, [locale]: e.target.value } } : b) })} placeholder={locale === "bs" ? "Napišite sadržaj bloka…" : `Unesite ${locale.toUpperCase()} prijevod ovog bloka…`} />}
      </li>)}</ol><div className={styles.addBlocks} aria-label="Dodaj blok">{(["text", "subheading", "image", "quote"] as const).map(t => <button key={t} onClick={() => add(t)}>＋ {labels[t]}</button>)}</div>
      <button className={styles.secondary} onClick={approve} disabled={!checks.find(c => c.key === locale)?.complete}>{reviewed ? "✓ Pregledano · povuci odobrenje" : `Potvrdi ljudski pregled · ${locale.toUpperCase()}`}</button>
    </section><aside className={styles.publicationAside}><section><p className={styles.eyebrow}>Prije objave</p><h2>Svaki detalj provjeren.</h2><ul className={styles.checklist}>{checks.map(c => <li key={c.key}><span className={c.complete ? styles.checkComplete : styles.checkPending} aria-hidden="true">{c.complete ? "✓" : "○"}</span><span>{c.label}</span><span className={styles.srOnly}>{c.complete ? "ispunjeno" : "nije ispunjeno"}</span></li>)}</ul><button className={styles.primary} disabled>Objavi na sva 3 jezika</button><p className={styles.muted}>Objavljivanje ostaje zaključano dok baza i serverska provjera nisu povezani.</p></section><section><h3>Prijevod uz ljudski pregled.</h3><p>BS je master. SQ i EN se mogu urediti ručno. Budući AI prijevod kreirat će samo nacrte.</p><button className={styles.secondary} disabled>Prevedi na SQ i EN</button></section><section><h3>Zajednička biblioteka.</h3><p>Fotografije javne arhive dostupne su kao reference. Prijenos novih slika još nije povezan.</p><button className={styles.secondary} disabled>Dodaj nove slike</button></section><section><h3>Sačuvajte rad.</h3><p>Nacrt trenutno postoji samo u ovom prozoru.</p><button className={styles.secondary} onClick={download}>Preuzmi nacrt · JSON</button><p role="status">{message}</p></section><section><h3>Stvarni pregled.</h3><p>BS/SQ/EN i Mobile/Desktop pregled javnih članaka dostupni su u arhivi. Pregled nespremljenog nacrta slijedi nakon povezivanja baze.</p></section></aside></div>
  </Shell>;
}
