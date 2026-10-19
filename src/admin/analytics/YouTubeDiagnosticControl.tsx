import { useRef, useState } from "react";
import type { Period } from "./model";
import { youtubeReadOnlyResult } from "./youtubeReadOnly";
import shared from "../admin.module.css";
import styles from "./analytics.module.css";

export function YouTubeDiagnosticControl({ period }: { period: Period }) {
  const running = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof youtubeReadOnlyResult> | null>(null);
  async function inspect() {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/admin/analytics/youtube-diagnostic?period=${period}`, { method: "GET", credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(55000) });
      if (!response.ok) throw new Error();
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("refreshTokenExchangeSucceeded" in body) || !("analyticsRequestSucceeded" in body)) throw new Error();
      setResult(youtubeReadOnlyResult(body));
    } catch { setError("YouTube dijagnostika nije dostupna. Ponovo učitajte Admin i pokušajte još jednom."); }
    finally { running.current = false; setBusy(false); }
  }
  return <div className={styles.youtubeDiagnostic}>
    <button type="button" className={shared.secondary} disabled={busy} onClick={inspect}>{busy ? "Provjeravam YouTube…" : "YouTube diagnostic"}</button>
    <div aria-live="polite">
      {error && <p className={styles.context} role="alert">{error}</p>}
      {result && <><p className={styles.context}>Privremena provjera · samo čitanje. Analitički podaci nijesu sačuvani niti izmijenjeni.</p><pre className={styles.youtubeDiagnosticOutput} aria-label="YouTube diagnostic result" tabIndex={0}>{JSON.stringify(result, null, 2)}</pre></>}
    </div>
  </div>;
}
