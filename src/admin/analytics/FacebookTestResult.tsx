import { reasonLabels, stateLabels } from "./model";
import { facebookRequestLabels, type FacebookTestResult as Result } from "./facebookTest";

export function FacebookTestResult({ result }: { result: Result }) {
  const d = result.diagnostic, verified = result.state === "connected" && d?.insightsAccess === "verified";
  const failed = d?.requests.filter(r => r.reason && r.reason !== "no_data" && (r.httpStatus === null || r.httpStatus >= 400)).slice(0, 3) ?? [];
  return <div role="status" aria-label="Rezultat Facebook testa" style={{ overflowWrap: "anywhere" }}>
    <p>{result.message}</p>
    <p>Facebook: {verified ? "CONNECTED · VERIFIED" : result.state ? `${stateLabels[result.state]} (${result.state})` : "—"} · HTTP {result.httpStatus || "—"}</p>
    {result.reason && <p>{reasonLabels[result.reason]} ({result.reason})</p>}
    {d?.insightsAccess === "partially_verified" && <p>Insights pristup je djelimično potvrđen. Neki zahtjevi su odbijeni.</p>}
    <p>{result.stored ? "Rezultat sačuvan u Preview Supabase." : "Novi Facebook podaci nijesu potvrđeni; prethodni podaci ostaju sačuvani."}</p>
    {failed.length > 0 && <details><summary style={{ minHeight: 44, display: "flex", alignItems: "center" }}>Detalji greške</summary>{failed.map((r, i) => <p key={i}>{facebookRequestLabels[r.request]}{r.metric ? ` · ${r.metric}` : ""} · HTTP {r.httpStatus ?? "—"} · Meta kod {r.code ?? "—"} · podkod {r.subcode ?? "—"} · tip {r.errorType ?? "—"}{r.reason ? ` · ${reasonLabels[r.reason]}` : ""}{r.hints.length ? ` · ${r.hints.join(", ")}` : ""}</p>)}</details>}
  </div>;
}
