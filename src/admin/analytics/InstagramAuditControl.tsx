import { useRef, useState } from "react";
import shared from "../admin.module.css";
import styles from "./analytics.module.css";
import { instagramAuditView } from "./instagramAuditView";

/** Temporary Preview-only control; uses the existing Analytics session and GET API. */
export function InstagramAuditControl() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof instagramAuditView> | null>(null);
  async function inspect() {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/admin/analytics?period=90&diagnostic=instagram&fresh=1", { method: "GET", credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(65000) });
      if (!response.ok) throw new Error("Diagnostic unavailable");
      setResult(instagramAuditView(await response.json()));
    } catch {
      setError("Dijagnostika nije dostupna. Osvježite ovu Admin stranicu i pokušajte ponovo.");
    } finally { running.current = false; setBusy(false); }
  }
  return <section className={styles.temporaryDiagnostic} aria-label="Privremena Instagram dijagnostika">
    <button type="button" className={shared.secondary} onClick={inspect} disabled={busy}>{busy ? "Provjeravam Instagram…" : "Instagram 90d diagnostic"}</button>
    <div aria-live="polite">
      {error && <p role="alert" className={styles.context}>{error}</p>}
      {result && <>
        <p className={styles.context}>Samo čitanje · 90 dana. Ništa nije sačuvano niti osvježeno u historiji.</p>
        {result["FRESH META VALUE"].value === null && <p className={styles.context}>Svježi Meta podaci trenutno nijesu dostupni; sačuvana vrijednost ostaje odvojena.</p>}
        <pre className={styles.diagnosticResult} aria-label="Instagram 90d diagnostic result" tabIndex={0}>{JSON.stringify(result, null, 2)}</pre>
      </>}
    </div>
  </section>;
}
