import { reasonLabels, stateLabels } from "./model";
import { instagramAccessLabels, instagramRequestLabels, type InstagramTestResult as Result } from "./instagramTest";

export function InstagramTestResult({ result }: { result: Result }) {
  const d = result.diagnostic;
  return <div role="status" aria-label="Rezultat Instagram testa" style={{ overflowWrap: "anywhere" }}>
    <p>{result.message}</p>
    <p>HTTP: {result.httpStatus || "—"} · Instagram: {result.state ? `${stateLabels[result.state]} (${result.state})` : "—"}</p>
    {result.reason && <p>Razlog: {reasonLabels[result.reason]} ({result.reason})</p>}
    <p>{result.stored ? "Rezultat sačuvan u Preview Supabase." : "Novi Instagram podaci nijesu potvrđeni; prethodni podaci ostaju sačuvani."}</p>
    {d && <>
      <p>Token na serveru: {d.tokenPresent ? "da" : "ne"} · račun otkriven: {d.accountDiscovered ? "da" : "ne"}</p>
      <p>Facebook Page otkriven: {d.pageDiscovered ? "da" : "ne"} · Page ID: {d.pageId ?? "—"}.</p>
      {d.pageLinkStatus === "missing" && <p>Meta nije vratio instagram_business_account za postojeću Medresa Page. Veza nije potvrđena ili nije dostupna ovom tokenu.</p>}
      <p>Instagram račun: {d.accountId ?? "—"}{d.accountIdSource ? ` · izvor: ${d.accountIdSource}` : ""} · tip: {d.accountType ?? "nije vraćen od API-ja"}</p>
      <p>Razlikuje se od prethodnog Instagram Login ID-ja: {d.differsFromOldLoginId === null ? "nije potvrđeno" : d.differsFromOldLoginId ? "da" : "ne"}.</p>
      <p>Podudaranje s postojećim profilom @medresacg: {d.expectedAccountMatches === null ? "nije potvrđeno" : d.expectedAccountMatches ? "da" : "ne"}.</p>
      <p>Način povezivanja: Facebook Login · /me/accounts → Medresa Page → instagram_business_account.</p>
      <p>instagram_manage_insights: {d.insightsPermission} · instagram_basic: {d.basicPermission}.</p>
      <p>Insights pristup: {instagramAccessLabels[d.insightsAccess]}.</p>
      <p>Grant iz /me/permissions i stvarni Insights pristup provjeravaju se odvojeno. Grant sam po sebi ne potvrđuje pristup podacima.</p>
      {d.insightsAccess === "denied" || d.insightsAccess === "partially_verified" ? <p>Meta je odbio neke Insights zahtjeve. Provjerite prikazane kodove i pristup povezanom računu u postojećoj aplikaciji; ne mijenjajte token naslijepo.</p> : null}
      {d.requests.filter(r => r.reason || r.request !== "insights" || (r.range?.start === result.range?.start && r.range?.end === result.range?.end)).map((r, i) => <div key={i}>
        <p>Meta: {instagramRequestLabels[r.request]}{r.metric ? ` · metric=${r.metric}` : ""}{r.metricType ? ` · metric_type=${r.metricType}` : ""}{r.period ? ` · period=${r.period}` : ""} · HTTP {r.httpStatus ?? "—"}{r.range ? ` · ${r.range.start} — ${r.range.end} UTC` : ""}</p>
        {r.reason && <p>{reasonLabels[r.reason]} ({r.reason})</p>}
        {r.code !== null && <p>Meta kod: {r.code} · podkod: {r.subcode ?? "—"} · tip: {r.errorType ?? "—"}</p>}
        {r.hints.length > 0 && <p>Teme navedene u Meta odgovoru: {r.hints.join(", ")}. Izvorni tekst odgovora se ne prikazuje.</p>}
      </div>)}
    </>}
  </div>;
}
