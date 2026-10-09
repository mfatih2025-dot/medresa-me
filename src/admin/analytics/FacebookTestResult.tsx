import { reasonLabels, stateLabels } from "./model";
import { facebookPermissions, facebookRequestLabels, type FacebookTestResult as Result } from "./facebookTest";

export function FacebookTestResult({ result }: { result: Result }) {
  const d = result.diagnostic, verified = result.state === "connected" && d?.insightsAccess === "verified";
  const failed = d?.requests.filter(r => r.reason && r.reason !== "no_data").slice(0, 4) ?? [];
  const insight = d?.requests.find(r => r.request === "insights");
  return <div role="status" aria-label="Rezultat Facebook testa" style={{ overflowWrap: "anywhere" }}>
    <p>{result.message}</p>
    <p>Facebook: {verified ? "CONNECTED · VERIFIED" : result.state ? `${stateLabels[result.state]} (${result.state})` : "—"} · HTTP {result.httpStatus || "—"}</p>
    {result.reason && <p>{reasonLabels[result.reason]} ({result.reason})</p>}
    {d && <>
      <p>Token na serveru: {d.tokenPresent ? "YES" : "NO"} · Medresa Page potvrđena: {d.pageDiscovered ? "YES" : "NO"} · Page ID: {d.pageId ?? "—"}.</p>
      <p>Page token vraćen od API-ja: {d.derivedPageTokenObtained ? "YES" : "NO"}. Postojeći token može već biti Page token.</p>
      <p>Insights pristup: {{ verified: "VERIFIED", denied: "DENIED", partially_verified: "Djelimično potvrđen", unverified: "Nije potvrđen" }[d.insightsAccess]} · prvi Page Insights HTTP: {insight?.httpStatus ?? "—"}.</p>
      <p>Dozvole: {facebookPermissions.map(p => `${p}: ${d.permissions[p]}`).join(" · ")}</p>
      <p>Poznati Page zadaci: {d.pageTasks === null ? "nijesu vraćeni" : d.pageTasks.length ? d.pageTasks.join(", ") : "nema poznatih vraćenih zadataka"}.</p>
      <p>Nedostupna provjera dozvola/zadataka nije dokaz da nedostaju. Stvarni Insights odgovor potvrđuje pristup.</p>
    </>}
    <p>Period: {result.range ? `${result.range.start} — ${result.range.end} · America/Los_Angeles` : "—"}</p>
    <p>Pratioci: {result.followers ?? "—"} · Pregledi: {result.views ?? "—"} · Interakcije: {result.interactions ?? "—"}</p>
    <p>{result.stored ? "Rezultat sačuvan u Preview Supabase." : "Novi Facebook podaci nijesu potvrđeni; prethodni podaci ostaju sačuvani."}</p>
    {failed.length > 0 && <details><summary style={{ minHeight: 44, display: "flex", alignItems: "center" }}>Detalji greške</summary>{failed.map((r, i) => <p key={i}>{facebookRequestLabels[r.request]}{r.metric ? ` · ${r.metric}` : ""} · HTTP {r.httpStatus ?? "—"} · Meta kod {r.code ?? "—"} · podkod {r.subcode ?? "—"} · tip {r.errorType ?? "—"}{r.reason ? ` · ${reasonLabels[r.reason]}` : ""}{r.hints.length ? ` · ${r.hints.join(", ")}` : ""}</p>)}</details>}
  </div>;
}
