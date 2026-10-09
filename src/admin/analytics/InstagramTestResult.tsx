import { reasonLabels, stateLabels } from "./model";
import { instagramRequestLabels, type InstagramTestResult as Result } from "./instagramTest";

/** Concise health status; bounded, sanitized failure details remain available on demand. */
export function InstagramTestResult({ result }: { result: Result }) {
  const d = result.diagnostic, verified = result.state === "connected" && d?.insightsAccess === "verified";
  const failures = d?.requests.filter(r => r.reason && r.reason !== "no_data" && (r.httpStatus === null || r.httpStatus >= 400)).slice(0, 3) ?? [];
  return <div role="status" aria-label="Rezultat Instagram testa" style={{ overflowWrap: "anywhere" }}>
    <p>{result.message}</p>
    <p>Instagram: {verified ? "CONNECTED · VERIFIED" : result.state ? stateLabels[result.state] : "—"} · HTTP {result.httpStatus || "—"}</p>
    {result.reason && <p>{reasonLabels[result.reason]}</p>}
    {d?.insightsAccess === "partially_verified" && <p>Insights pristup je djelimično potvrđen. Neki zahtjevi su odbijeni.</p>}
    <p>{result.stored ? "Rezultat sačuvan u Preview Supabase." : "Novi Instagram podaci nijesu potvrđeni; prethodni podaci ostaju sačuvani."}</p>
    {failures.length > 0 && <details><summary style={{ minHeight: 44, display: "flex", alignItems: "center" }}>Detalji greške</summary>{failures.map((r, i) => <p key={i}>{instagramRequestLabels[r.request]}{r.metric ? ` · ${r.metric}` : ""} · HTTP {r.httpStatus ?? "—"} · Meta kod {r.code ?? "—"} · podkod {r.subcode ?? "—"}{r.reason ? ` · ${reasonLabels[r.reason]}` : ""}</p>)}</details>}
  </div>;
}
