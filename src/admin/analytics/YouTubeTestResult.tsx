import { reasonLabels, stateLabels } from "./model";
import { youtubeConfigurationNames, youtubeRequestLabels, type YouTubeTestResult as Result } from "./youtubeTest";

export function YouTubeTestResult({ result }: { result: Result }) {
  const d = result.diagnostic, verified = result.state === "connected" && d?.oauthVerified && d.channelDiscovered && d.analyticsVerified;
  const missing = d ? youtubeConfigurationNames.filter(k => !d.configuration[k]) : [];
  const failures = d?.requests.filter(r => r.reason && r.reason !== "no_data").slice(0, 3) ?? [];
  return <div role="status" aria-label="Rezultat YouTube testa" style={{ overflowWrap: "anywhere" }}>
    <p>{result.message}</p>
    <p>YouTube: {verified ? "CONNECTED · VERIFIED" : result.state ? stateLabels[result.state] : "—"} · HTTP {result.httpStatus || "—"}</p>
    {result.reason && <p>{reasonLabels[result.reason]}</p>}
    {missing.length > 0 && <p>Nedostaje Preview konfiguracija: {missing.join(", ")}. Vrijednosti se unose samo u Vercel, nikada u ovaj prikaz.</p>}
    {d && <p>Google OAuth: {d.oauthVerified ? "VERIFIED" : "nije potvrđen"} · vlasnički kanal: {d.channelId ?? "—"} · Analytics pristup: {d.analyticsVerified ? "VERIFIED" : "nije potvrđen"}.</p>}
    {d?.configuredChannelMatches === false && <p>Autorizovani kanal ne odgovara konfigurisanom kanalu. Insights nijesu zatraženi.</p>}
    <p>Period: {result.range ? `${result.range.start} — ${result.range.end} · America/Los_Angeles` : "—"}</p>
    <p>{result.stored ? "Rezultat sačuvan u Preview Supabase." : "Novi YouTube podaci nijesu potvrđeni; prethodni podaci ostaju sačuvani."}</p>
    {failures.length > 0 && <details><summary style={{ minHeight: 44, display: "flex", alignItems: "center" }}>Detalji greške</summary>{failures.map((r, i) => <p key={i}>{youtubeRequestLabels[r.request]} · HTTP {r.httpStatus ?? "—"} · Google kod {r.code ?? "—"}{r.googleReason ? ` · ${r.googleReason}` : ""}{r.googleStatus ? ` · ${r.googleStatus}` : ""}{r.reason ? ` · ${reasonLabels[r.reason]}` : ""}</p>)}</details>}
  </div>;
}
