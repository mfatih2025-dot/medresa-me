import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { NewsArticle } from "@/content/vijesti/types";
import type { NewsDraft } from "./model";
import { adminRequest } from "./client";
import styles from "./admin.module.css";
export function LivePreview({ draft }: { draft: NewsDraft }) {
  const [locale, setLocale] = useState<Locale>("bs");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [message, setMessage] = useState("Otvorite pregled da vidite trenutni nacrt.");
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const ready = (event: MessageEvent) => { if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "medresa-preview-ready") { setLoaded(true); if (article) frame.current?.contentWindow?.postMessage({ type: "medresa-draft-preview", article, locale }, window.location.origin); } };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [article, locale]);
  useEffect(() => { if (loaded && article) frame.current?.contentWindow?.postMessage({ type: "medresa-draft-preview", article, locale }, window.location.origin); }, [loaded, article, locale]);
  async function refresh() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(Date.parse(draft.date)) || new Date(draft.date).toISOString().slice(0, 10) !== draft.date) { setMessage("Unesite ispravan datum prije pregleda."); return; }
    setBusy(true);
    try { const result = await adminRequest<{ article: NewsArticle }>("/api/admin/preview", { draft }); setArticle(result.article); setMessage("Pregled osvježen. Nakon novih promjena ponovo osvježite pregled."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Pregled nije dostupan."); }
    finally { setBusy(false); }
  }
  return <section className={styles.previewPanel} aria-label="Pregled nacrta"><div className={styles.sectionHead}><h2>Stvarni pregled članka</h2><button className={styles.secondary} onClick={refresh} disabled={busy}>{busy ? "Priprema…" : "Osvježi pregled"}</button></div><div className={styles.previewControls}><div className={styles.segment} aria-label="Jezik pregleda">{(["bs", "sq", "en"] as const).map(l => <button key={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>)}</div><div className={styles.segment} aria-label="Veličina pregleda"><button aria-pressed={viewport === "mobile"} onClick={() => setViewport("mobile")}>Mobile</button><button aria-pressed={viewport === "desktop"} onClick={() => setViewport("desktop")}>Desktop</button></div></div>{article && <div className={styles.previewScroll}><iframe ref={frame} title="Stvarni Article · nacrt" src="/admin-preview/editor" className={viewport === "mobile" ? styles.mobileFrame : styles.desktopFrame} onLoad={() => setLoaded(true)} /></div>}<p role="status" className={styles.muted}>{message}</p></section>;
}
