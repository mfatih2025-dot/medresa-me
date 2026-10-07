import { useRef, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { SharedImage } from "./model";
import styles from "./admin.module.css";
const mimes = ["image/jpeg", "image/png", "image/webp"];
export function ImagePicker({ label, image, assets, locale, onSelect, onRemove, onCover, busy: externalBusy }: { label: string; image?: SharedImage; assets: SharedImage[]; locale: Locale; onSelect: (image: SharedImage) => void; onRemove: () => void; onCover?: () => void; busy?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState(24);
  const [query, setQuery] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  async function upload(file?: File) {
    if (!file) return;
    setMessage("");
    if (!mimes.includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) { setMessage("Odaberite JPG, PNG ili WebP do 10 MB."); return; }
    setBusy(true);
    const preview = URL.createObjectURL(file); setLocalPreview(preview);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error ?? "Upload nije završen.");
      onSelect(value.image); setMessage("Slika je spremljena u zajedničku biblioteku.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload nije završen."); }
    finally { setBusy(false); setLocalPreview(null); URL.revokeObjectURL(preview); if (input.current) input.current.value = ""; }
  }
  const images = assets.filter(a => `${a.alt.bs} ${a.alt.sq} ${a.alt.en}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className={styles.imageChooser}><span className={styles.imageLabel}>{label}</span>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-label={`Datoteka · ${label}`} className={styles.srOnly} onChange={e => upload(e.target.files?.[0])} disabled={busy || externalBusy} />
    {(localPreview || image) && <Image unoptimized src={localPreview ?? image!.src} alt={image?.alt[locale] || "Odabrana slika"} width={image?.width ?? 800} height={image?.height ?? 600} className={styles.assetPreview} />}
    <div className={styles.imageActions}><button className={styles.secondary} disabled={busy || externalBusy} onClick={() => input.current?.click()}>{busy ? "Prenos slike…" : "Odaberi sliku"}</button>{image && <><button className={styles.textLink} disabled={busy || externalBusy} onClick={onRemove}>Ukloni</button>{onCover && <button className={styles.textLink} disabled={externalBusy} onClick={onCover}>Postavi kao naslovnu</button>}</>}</div>
    <p className={styles.muted}>JPG, PNG ili WebP · do 10 MB · original ostaje sačuvan.</p>
    <button className={styles.textLink} aria-expanded={library} onClick={() => setLibrary(v => !v)}>Odaberi iz postojeće biblioteke {library ? "↑" : "↓"}</button>
    {library && <section aria-label={`Biblioteka · ${label}`}><label>Pretraži slike<input value={query} onChange={e => { setQuery(e.target.value); setLimit(24); }} /></label><div className={styles.imageGrid}>{images.slice(0, limit).map(a => <button className={styles.imageTile} key={a.id} aria-label={`Odaberi: ${a.alt[locale] || a.id}`} aria-pressed={image?.id === a.id} disabled={externalBusy} onClick={() => { onSelect(a); setLibrary(false); setMessage(""); }}><Image unoptimized src={a.src} alt={a.alt[locale]} width={a.width} height={a.height} loading="lazy" /><span>{a.alt[locale] || "Fotografija"}</span></button>)}</div>{images.length > limit && <button className={styles.secondary} onClick={() => setLimit(n => n + 24)}>Prikaži još fotografija</button>}{!images.length && <p>Nema slika za ovu pretragu.</p>}</section>}
    <p role="status" className={styles.muted}>{message}</p>
  </div>;
}
