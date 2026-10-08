import { useState } from "react";
import styles from "./admin.module.css";

// Enter through the authenticated Admin page, not a cross-site link to a JSON API.
export function PreviewDiagnostics() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function check() {
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/admin/diagnostics?connectivity=1", {
        method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Sesija nije dostupna. Prijavite se ponovo kroz administraciju." : "Dijagnostika trenutno nije dostupna.");
        return;
      }
      const report = await response.json();
      if (!report.runtime || !report.connectivity) { setError("Dijagnostički odgovor nije potpun."); return; }
      // Whitelist only required connection checks. Write opt-in does not gate reads.
      const names = ["previewEnvironment", "adminBranch", "supabaseUrlPresent", "serviceRoleKeyPresent", "projectRefPresent", "supabaseUrlParseable", "supabaseUrlExactOrigin", "supabaseUrlHttps", "supabaseHostnameMatchesProjectRef", "projectRefFormatValid"];
      const checks = Object.fromEntries(names.map(name => [name, report.checks?.[name] === true]));
      const translationNames = ["previewEnvironment", "adminBranch", "openAiKeyPresent", "supabaseConfigurationAvailable", "supabaseWritesEnabled"];
      const translationChecks = Object.fromEntries(translationNames.map(name => [name, report.translation?.checks?.[name] === true]));
      setResult(JSON.stringify({
        configuration: {
          accepted: report.configurationAccepted === true,
          failedChecks: names.filter(name => !checks[name]),
          checks,
        },
        runtime: report.runtime,
        connectivity: report.connectivity,
        translation: {
          available: report.translation?.available === true,
          failedChecks: translationNames.filter(name => !translationChecks[name]),
          checks: translationChecks,
          commitSha: typeof report.translation?.commitSha === "string" && /^[a-f0-9]{40}$/.test(report.translation.commitSha) ? report.translation.commitSha : null,
        },
      }, null, 2));
    } catch { setError("Provjera nije završena. Pokušajte ponovo."); }
    finally { setBusy(false); }
  }

  return <section className={styles.previewDiagnostic} aria-label="Preview dijagnostika">
    <button type="button" className={styles.secondary} disabled={busy} onClick={check}>{busy ? "Provjeravam Preview vezu…" : "Provjeri Preview vezu"}</button>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {result && <div className={styles.notice} role="status"><p>Preview provjera · samo čitanje</p><pre className={styles.diagnosticResult} aria-label="Rezultat Preview dijagnostike">{result}</pre></div>}
  </section>;
}
