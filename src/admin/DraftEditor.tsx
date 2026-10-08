import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { Locale } from "@/i18n/config";
import type { BackendState, ContentBlock, ManagedArticle, NewsDraft, SharedImage } from "./model";
import { emptyText, localeContent, moveBlock, newDraft, revise, statusLabels } from "./model";
import { canonicalJson } from "./contracts";
import { localeStatus, publicationChecklist, readyLocales } from "./publication";
import { Shell } from "./Shell";
import { ImagePicker } from "./ImagePicker";
import { LivePreview } from "./LivePreview";
import { ConfirmDialog } from "./ConfirmDialog";
import { adminRequest } from "./client";
import styles from "./admin.module.css";
const labels = { text: "Tekst", subheading: "Podnaslov", image: "Slika", quote: "Citat" };
export type EditorProps = { initial: ManagedArticle | null; assets: SharedImage[]; backend: BackendState; saved?: boolean };
export function DraftEditor({ initial, assets: initialAssets, backend, saved }: EditorProps) {
  const router = useRouter();
  const [record, setRecord] = useState(initial);
  const [draft, setDraft] = useState(() => initial?.draft ?? newDraft("scratch-new"));
  const [assets, setAssets] = useState(initialAssets);
  const [locale, setLocale] = useState<Locale>("bs");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Locale[] | null>(null);
  const [message, setMessage] = useState(saved ? "Nacrt je spremljen u bazu." : "");
  const checks = publicationChecklist(draft, locale);
  const ready = readyLocales(draft).filter(l => localeStatus(draft, record?.publications, l) !== "published");
  const publishingReady = record?.localePublishingReady ?? backend.localePublishingReady ?? false;
  const writable = backend.writable && record?.source !== "static" && !record?.archivedAt && !record?.deletedAt;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(patch: Partial<NewsDraft>) {
    setDraft(d => { const next = revise(d, patch); const used = new Set([next.coverImageId, ...(next.legacy?.imageIds ?? []), ...next.blocks.flatMap(b => b.type === "image" ? [b.assetId] : [])]); return { ...next, images: next.images.filter(i => used.has(i.id)) }; });
    setDirty(true); setMessage("");
  }
  function text(field: "title" | "slug" | "lead", value: string) { change({ [field]: { ...draft[field], [locale]: value } }); }
  function add(type: ContentBlock["type"]) {
    const id = crypto.randomUUID();
    change({ blocks: [...draft.blocks, type === "image" ? { id, type, assetId: "" } : { id, type, text: emptyText() }] });
  }
  function selectImage(image: SharedImage, blockId?: string) {
    setAssets(a => a.some(i => i.id === image.id) ? a : [image, ...a]);
    setDraft(current => {
      if (blockId && !current.blocks.some(b => b.id === blockId && b.type === "image")) return current;
      const images = current.images.some(a => a.id === image.id) ? current.images : [...current.images, image];
      const next = revise(current, blockId ? { images, blocks: current.blocks.map(b => b.id === blockId && b.type === "image" ? { ...b, assetId: image.id } : b) } : { images, coverImageId: image.id });
      const used = new Set([next.coverImageId, ...(next.legacy?.imageIds ?? []), ...next.blocks.flatMap(b => b.type === "image" ? [b.assetId] : [])]);
      return { ...next, images: next.images.filter(i => used.has(i.id)) };
    });
    setDirty(true); setMessage("");
  }
  function approve() {
    setDraft(d => {
      const revision = d.revision + 1;
      const review = Object.fromEntries((["bs", "sq", "en"] as const).map(l => [l, { approved: l === locale ? !d.review[l].approved : d.review[l].approved && d.review[l].reviewedRevision === d.revision, reviewedRevision: revision }])) as NewsDraft["review"];
      const next = { ...d, revision, review, status: "draft" as const };
      return { ...next, status: readyLocales(next).length > 0 ? "ready" : "draft" };
    }); setDirty(true);
  }
  async function save() {
    if (!writable) return;
    setBusy(true); setMessage("");
    try {
      const result = record
        ? await adminRequest<{ article: ManagedArticle }>(`/api/admin/news/${draft.id}`, { action: "save", draft, expectedRevision: record.draft.revision })
        : await adminRequest<{ article: ManagedArticle }>("/api/admin/news", { draft });
      setRecord(result.article); setDraft(result.article.draft); setDirty(false); setMessage("Nacrt je spremljen u bazu.");
      if (!record) await router.replace(`/admin/vijesti/${result.article.draft.id}?saved=1`, undefined, { scroll: false });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nacrt nije spremljen."); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!confirm || busy || !writable || !publishingReady || confirm.some(l => !ready.includes(l))) return;
    const selected = [...confirm];
    let persisted = record;
    setBusy(true); setMessage("");
    try {
      let reviewedDraft = draft;
      if (!persisted) {
        persisted = (await adminRequest<{ article: ManagedArticle }>("/api/admin/news", { draft })).article;
        setRecord(persisted); setDraft(persisted.draft); setDirty(false);
        // Creation assigns a server ID/revision and clears review. Carry the user's
        // review only when that locale's canonical saved content is unchanged.
        const revision = persisted.draft.revision + 1;
        const review = Object.fromEntries((["bs", "sq", "en"] as const).map(l => {
          const approved = draft.review[l].approved && draft.review[l].reviewedRevision === draft.revision &&
            canonicalJson(JSON.parse(localeContent(draft, l))) === canonicalJson(JSON.parse(localeContent(persisted!.draft, l)));
          return [l, { approved, reviewedRevision: approved ? revision : null }];
        })) as NewsDraft["review"];
        reviewedDraft = { ...persisted.draft, revision, review };
      }
      if (dirty || !record) {
        persisted = (await adminRequest<{ article: ManagedArticle }>(`/api/admin/news/${persisted.draft.id}`, { action: "save", draft: reviewedDraft, expectedRevision: persisted.draft.revision })).article;
        setRecord(persisted); setDraft(persisted.draft); setDirty(false);
      }
      const result = await adminRequest<{ article: ManagedArticle }>(`/api/admin/news/${persisted.draft.id}`, { action: "publish", expectedRevision: persisted.draft.revision, locales: selected });
      setRecord(result.article); setDraft(result.article.draft); setMessage(`Objavljeno: ${selected.map(l => l.toUpperCase()).join(", ")}. Javni website još koristi postojeći izvor.`); setConfirm(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Objava nije završena."); setConfirm(null); }
    finally {
      setBusy(false);
      if (!record && persisted) await router.replace(`/admin/vijesti/${persisted.draft.id}`, undefined, { scroll: false });
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "medresa-nacrt.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const image = (id: string | null) => draft.images.find(a => a.id === id);
  const editAlt = (assetId: string, value: string) => change({ images: draft.images.map(a => a.id === assetId ? { ...a, alt: { ...a.alt, [locale]: value } } : a) });
  return <Shell active="/admin/vijesti" title={record ? "Uredi vijest" : "Nova vijest"} intro="Priča u blokovima. Jedan redoslijed, tri jezika." action={<Link href="/admin/vijesti" className={styles.secondary} onClick={e => { if (dirty && !window.confirm("Nespremljene promjene će biti izgubljene. Želite li otići?")) e.preventDefault(); }}>← Sve vijesti</Link>}>
    <div className={styles.noticeInline}><span className={styles.status}>{statusLabels[draft.status]}{dirty ? " · nespremljene promjene" : ""}</span><p>{record?.source === "static" ? "Postojeća vijest · import još nije izvršen. Uređivanje i pregled su dostupni; spremanje čeka provjereni import." : record?.archivedAt || record?.deletedAt ? "Vijest je arhivirana ili u smeću. Vratite je iz biblioteke prije uređivanja." : backend.message}</p></div>
    <div className={styles.editorGrid}><section className={styles.editor} aria-label="Uređivanje vijesti"><div className={styles.editorTop}><div className={styles.segment} aria-label="Jezik uređivanja">{(["bs", "sq", "en"] as const).map(l => <button key={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div><span>{locale === "bs" ? "Bosanski master" : "Prijevod za ljudski pregled"}</span></div>
      <fieldset disabled={busy || !!record?.archivedAt || !!record?.deletedAt} className={styles.editorFields}>
      <label>Naslov · {locale.toUpperCase()}<input value={draft.title[locale]} onChange={e => text("title", e.target.value)} placeholder="Naslov vijesti" /></label>
      <label>Datum objave<input type="date" value={draft.date} onChange={e => change({ date: e.target.value })} /></label>
      <ImagePicker label="Naslovna slika" locale={locale} assets={[...draft.images, ...assets.filter(a => !draft.images.some(d => d.id === a.id))]} image={image(draft.coverImageId)} onSelect={a => selectImage(a)} onRemove={() => change({ coverImageId: null })} busy={busy} />
      {image(draft.coverImageId) && <label>Opis naslovne slike · {locale.toUpperCase()}<input value={image(draft.coverImageId)!.alt[locale]} onChange={e => editAlt(draft.coverImageId!, e.target.value)} /></label>}
      <div className={styles.fieldPair}><label>URL slug · {locale.toUpperCase()}<input value={draft.slug[locale]} onChange={e => text("slug", e.target.value)} placeholder="naslov-vijesti" autoCapitalize="none" spellCheck={false} /></label><label>Tema<select value={draft.topic} onChange={e => change({ topic: e.target.value as NewsDraft["topic"] })}>{Object.entries({ school: "Iz škole", visits: "Posjete", donations: "Donacije", events: "Obilježavanja", notices: "Obavještenja", sport: "Sport" }).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      <label>Uvod · opcionalno<textarea rows={2} value={draft.lead[locale]} onChange={e => text("lead", e.target.value)} /></label>
      <div className={styles.sectionHead}><h2>Sadržaj</h2><span>{draft.blocks.length} blokova</span></div><p className={styles.muted}>Koristite ↑ / ↓ za redoslijed. Na računaru možete i povući ručicu. Redoslijed vrijedi za sva tri jezika.</p>
      {!draft.blocks.length && <div className={styles.blockEmpty}>Počnite prvim blokom. Priča određuje redoslijed.</div>}
      <ol className={styles.blocks} aria-label="Blokovi članka">{draft.blocks.map((block, index) => <li key={block.id} className={styles.block} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (busy) return; const from = draft.blocks.findIndex(b => b.id === e.dataTransfer.getData("text/medresa-block")); if (from >= 0) change({ blocks: moveBlock(draft.blocks, from, index) }); }}><div className={styles.blockHead}><button type="button" draggable onDragStart={e => { e.dataTransfer.setData("text/medresa-block", block.id); e.dataTransfer.effectAllowed = "move"; }} aria-label={`Povuci blok ${index + 1}`} className={styles.dragHandle}>⠿</button><b>{String(index + 1).padStart(2, "0")} / {labels[block.type]}</b><div className={styles.blockActions}><button aria-label={`Pomjeri blok ${index + 1} gore`} disabled={busy || index === 0} onClick={() => change({ blocks: moveBlock(draft.blocks, index, index - 1) })}>↑</button><button aria-label={`Pomjeri blok ${index + 1} dolje`} disabled={busy || index === draft.blocks.length - 1} onClick={() => change({ blocks: moveBlock(draft.blocks, index, index + 1) })}>↓</button><button aria-label={`Ukloni blok ${index + 1}`} onClick={() => change({ blocks: draft.blocks.filter(b => b.id !== block.id) })}>×</button></div></div>
      {block.type === "image" ? <><ImagePicker label={`Slika bloka ${index + 1}`} image={image(block.assetId)} assets={[...draft.images, ...assets.filter(a => !draft.images.some(d => d.id === a.id))]} locale={locale} onSelect={a => selectImage(a, block.id)} onRemove={() => change({ blocks: draft.blocks.map(b => b.id === block.id ? { ...block, assetId: "" } : b) })} onCover={block.assetId ? () => change({ coverImageId: block.assetId }) : undefined} busy={busy} />{image(block.assetId) && <label>Opis slike · {locale.toUpperCase()}<input value={image(block.assetId)!.alt[locale]} onChange={e => editAlt(block.assetId, e.target.value)} /></label>}</> : <textarea aria-label={`${labels[block.type]} ${index + 1} · ${locale.toUpperCase()}`} rows={block.type === "text" ? 5 : 2} value={block.text[locale]} onChange={e => change({ blocks: draft.blocks.map(b => b.id === block.id ? { ...block, text: { ...block.text, [locale]: e.target.value } } : b) })} placeholder={locale === "bs" ? "Napišite sadržaj bloka…" : `Unesite ${locale.toUpperCase()} prijevod…`} />}</li>)}</ol>
      <div className={styles.addBlocks} aria-label="Dodaj blok">{(["text", "subheading", "image", "quote"] as const).map(t => <button key={t} onClick={() => add(t)}>＋ {labels[t]}</button>)}</div>
      <button className={styles.secondary} onClick={approve} disabled={!checks.find(c => c.key === locale)?.complete}>{draft.review[locale].approved ? "✓ Pregledano · povuci odobrenje" : `Potvrdi ljudski pregled · ${locale.toUpperCase()}`}</button>
      </fieldset>
      <section className={styles.editorReview}><h3>Prijevod uz ljudski pregled.</h3><p className={styles.muted}>OpenAI nije povezan. BS je master; SQ i EN uredite ručno. AI će kasnije kreirati samo nacrte.</p><button className={styles.secondary} disabled>Prevedi na SQ i EN</button></section>
    </section><LivePreview draft={draft} /><aside className={styles.publicationAside}><section><p className={styles.eyebrow}>Prije objave</p><h2>Svaki detalj provjeren.</h2><ul className={styles.checklist}>{checks.map(c => <li key={c.key}><span className={c.complete ? styles.checkComplete : styles.checkPending} aria-hidden="true">{c.complete ? "✓" : "○"}</span><span>{c.label}</span><span className={styles.srOnly}>{c.complete ? "ispunjeno" : "nije ispunjeno"}</span></li>)}</ul><ul className={styles.checklist} aria-label="Status jezika">{(["bs", "sq", "en"] as const).map(l => <li key={l}><b>{l.toUpperCase()}</b><span>{statusLabels[localeStatus(draft, record?.publications, l)]}{record?.publications?.[l] && localeStatus(draft, record.publications, l) !== "published" ? " · prethodna objava sačuvana" : ""}</span></li>)}</ul>
    {(["bs", "sq", "en"] as const).map(l => <button key={l} className={styles.primary} disabled={!writable || !publishingReady || busy || !ready.includes(l)} onClick={() => setConfirm([l])}>OBJAVI {l.toUpperCase()}</button>)}
    {ready.length > 1 && <button className={styles.primary} disabled={!writable || !publishingReady || busy} onClick={() => setConfirm(ready)}>OBJAVI SVE SPREMNE JEZIKE</button>}
    <p className={styles.muted}>Potvrdite pregled odabranog jezika. Objava prvo sprema nacrt, zatim objavljuje samo odabrane jezike. SQ i EN mogu ostati nacrti; ne blokiraju BS. Naslovna slika je opcionalna. Objava u bazi ne mijenja javni website u ovoj fazi.</p>
    {!publishingReady && <p className={styles.muted}>Objava po jeziku čeka provjerenu Preview migraciju 202610080003_locale_publication.sql. Spremanje nacrta i postojeće objave ostaju sačuvani.</p>}</section>
    <section><h3>Sačuvajte rad.</h3><button className={styles.primary} disabled={!writable || busy || (!!record && !dirty)} onClick={save}>{busy ? "Čuvanje…" : record ? "Sačuvaj nacrt" : "Kreiraj i sačuvaj nacrt"}</button><p>{writable ? "Nacrti se spremaju u bazu i ostaju dostupni u sljedećoj sesiji." : "Spremanje nije dostupno. Promjene u ovom prozoru su privremene."}</p><button className={styles.secondary} onClick={download}>Preuzmi nacrt · JSON</button><p role="status">{message}</p></section>
    <section><h3>Zajedničke fotografije.</h3><p>Fotografije se prenose jednom. Opisi se uređuju za svaki jezik; redoslijed je zajednički.</p></section></aside></div>
    {confirm && <ConfirmDialog title={`Objavi ${confirm.map(l => l.toUpperCase()).join(", ")}?`} description="Objavljuju se samo odabrani jezici. Ostale objave ostaju sačuvane; javni website još koristi postojeći izvor." confirm="Objavi u bazi" busy={busy} onCancel={() => setConfirm(null)} onConfirm={publish} />}
  </Shell>;
}
