import { useRef, useState } from "react";
import { Shell } from "../Shell";
import shared from "../admin.module.css";
import styles from "./analytics.module.css";
import { comparison, days } from "./period";
import { providerLabels, metricLabels, periods, stateLabels, reasonLabels, type AnalyticsDashboard, type Metric, type Period, type ProviderReport, type Ranked } from "./model";

const periodLabels: Record<Period, string> = { today: "Danas", yesterday: "Juče", "7": "7 dana", "30": "30 dana", "60": "60 dana", "90": "90 dana" };
const primaryMetrics: Record<ProviderReport["provider"], Metric[]> = { website: ["visits", "visitors", "pageviews"], instagram: ["views", "reach", "interactions", "followerChange", "profileActivity"], facebook: ["views", "reach", "interactions", "followerChange"], youtube: ["views", "watchMinutes", "subscriberChange"] };
const format = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) ? new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 1 }).format(n) : "—";
// Numeric parts avoid server/browser CLDR month-name differences during hydration.
const date = (s: string | null) => {
  if (!s || !Number.isFinite(Date.parse(s))) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Podgorica" }).formatToParts(new Date(s));
  const part = (name: string) => parts.find(p => p.type === name)?.value ?? "";
  return `${part("day")}.${part("month")}.${part("year")}. · ${part("hour")}:${part("minute")}`;
};
function Change({ current, previous, complete = true, partial = false }: { current: number | null | undefined; previous: number | null | undefined; complete?: boolean; partial?: boolean }) {
  const c = comparison(current, previous, complete);
  return <span className={styles.change}>{c.direction}{c.delta !== null && c.delta !== 0 ? ` ${c.delta > 0 ? "+" : ""}${format(c.delta)}` : ""}{!partial && c.percent !== null ? ` · ${format(c.percent)}%` : ""}</span>;
}
function Ranking({ rows, empty = "Nema podataka za izabrani period" }: { rows: Ranked[]; empty?: string }) {
  if (!rows.length) return <p className={styles.empty}>{empty}</p>;
  return <ol className={styles.ranking}>{rows.map((row, i) => <li key={`${i}-${row.label}`}><span className={styles.ordinal}>{String(i + 1).padStart(2, "0")}</span><span>{row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer">{row.label} ↗</a> : row.label}<small>{row.basis === "lifetime" ? "Ukupni pregledi od objave" : "Pregledi u izabranom periodu"}</small></span><strong>{format(row.value)}</strong></li>)}</ol>;
}
function Trend({ report, metric }: { report: ProviderReport; metric: Metric }) {
  const [position, setPosition] = useState(0);
  const series = days(report.range).map(day => ({ day, value: report.daily.find(d => d.date === day)?.metrics[metric] ?? null }));
  if (!series.some(d => typeof d.value === "number")) return <div className={styles.chartEmpty}><span>Podaci još nijesu dostupni</span><small>{metricLabels[metric]} · dnevni tok</small></div>;
  const values = series.flatMap(d => d.value === null ? [] : [d.value]); const max = Math.max(1, ...values), min = Math.min(0, ...values);
  const x = (i: number) => series.length === 1 ? 300 : 20 + i / (series.length - 1) * 560;
  const y = (v: number) => 155 - (v - min) / (max - min) * 130;
  let path = "", gap = true;
  series.forEach((point, i) => { if (point.value === null) gap = true; else { path += `${gap ? "M" : "L"}${x(i)},${y(point.value)} `; gap = false; } });
  const selected = Math.min(position, series.length - 1), p = series[selected];
  return <figure className={styles.chart}>
    <figcaption><span>{metricLabels[metric]} · dnevni tok</span><strong>{p.day} <span>{format(p.value)}</span></strong></figcaption>
    <svg viewBox="0 0 600 180" role="img" aria-label={`Dnevni tok: ${metricLabels[metric]}`}>
      <title>{`${metricLabels[metric]} od ${report.range.start} do ${report.range.end}. Nedostajući dani su prekidi linije.`}</title>
      {[25, 90, 155].map(h => <line key={h} x1="20" x2="580" y1={h} y2={h} stroke="#dce1d7" strokeWidth="1" />)}
      <path d={path} fill="none" stroke="#123c31" strokeWidth="2.5" />
      {series.length === 1 && p.value !== null && <circle cx={x(0)} cy={y(p.value)} r="4" fill="#123c31" />}
      {p.value !== null && <><line x1={x(selected)} x2={x(selected)} y1="20" y2="160" stroke="#b39961" strokeDasharray="3 4" /><circle cx={x(selected)} cy={y(p.value)} r="5" fill="#b39961" stroke="#f8f6ef" strokeWidth="2" /></>}
    </svg>
    <label className={styles.chartControl}>Odaberi dan<input type="range" aria-label={`Odaberi dan · ${providerLabels[report.provider]}`} min="0" max={Math.max(0, series.length - 1)} value={selected} onChange={e => setPosition(Number(e.target.value))} /></label>
    <div className={styles.axis}><span>{report.range.start}</span><span>{report.range.end}</span></div>
  </figure>;
}
function Source({ report }: { report: ProviderReport }) {
  const [dimension, setDimension] = useState<keyof ProviderReport["breakdowns"]>("pages");
  const keys = primaryMetrics[report.provider];
  const chartKey = report.provider === "website" ? "pageviews" : report.provider === "instagram" ? "reach" : "views";
  return <section id={`analytics-${report.provider}`} className={styles.source} aria-label={`${providerLabels[report.provider]} analitika`}>
    <header className={styles.sectionHead}><div><p className={shared.eyebrow}>{report.source}</p><h2>{providerLabels[report.provider]}</h2></div><span className={styles.state} data-state={report.state}>{stateLabels[report.state]}</span></header>
    {report.reason && <p className={styles.sourceNotice}>{reasonLabels[report.reason]}{report.lastSuccessAt ? " · prikazani su sačuvani podaci" : ""}</p>}
    <div className={styles.metrics}>{keys.map(k => <div key={k}><span>{metricLabels[k]}</span><strong>{format(report.totals[k])}</strong><Change current={report.totals[k]} previous={report.previousTotals[k]} complete={report.range.end < report.todayDate} /></div>)}</div>
    <p className={styles.context}>Prethodni period: {report.previousRange.start} — {report.previousRange.end} · Dani prema izvoru: {report.timezone}. Višednevni periodi obuhvataju završene dane.</p>
    {report.provider === "website" ? <div className={styles.total}><p className={shared.eyebrow}>UKUPNO POSJETA</p><strong>{format(report.cumulative.visits)}</strong><p>Vercel ne mjeri sesije / posjete. Posjetioci i pregledi stranica su zasebne metrike.</p><p>Ukupno od početka praćenja: {report.trackingStart ?? "datum nije potvrđen"}</p><span>Pregledi stranica: {format(report.cumulative.pageviews)} · Historijski baseline: —</span><p className={styles.context}>Website obuhvata Preview projekta; Admin putanje su isključene. Javni tracker nije dodan niti promijenjen.</p></div> : <div className={styles.current}><span>{report.provider === "youtube" ? "Pretplatnici · trenutno" : "Pratioci · trenutno"}</span><strong>{format(report.provider === "youtube" ? report.current.subscribers : report.current.followers)}</strong></div>}
    <Trend key={`${report.provider}-${report.range.start}-${report.range.end}`} report={report} metric={chartKey} />
    {report.provider === "website" && <div className={styles.breakdowns}><div className={styles.tabs} aria-label="Website raspodjela">{(["pages", "referrers", "devices", "countries"] as const).map((d, i) => <button key={d} type="button" aria-pressed={dimension === d} onClick={() => setDimension(d)}>{["Stranice", "Izvori posjeta", "Uređaji", "Zemlje"][i]}</button>)}</div><Ranking rows={report.breakdowns[dimension]} /></div>}
    {report.warnings.length > 0 && <p className={styles.context}>{report.warnings.map(w => reasonLabels[w]).join(" · ")}</p>}
    <p className={styles.context}>Posljednje uspješno osvježavanje: {date(report.lastSuccessAt)}</p>
  </section>;
}
export function Analytics({ initial }: { initial: AnalyticsDashboard }) {
  const [data, setData] = useState(initial), [period, setPeriod] = useState(initial.period);
  const [loading, setLoading] = useState(false), [syncing, setSyncing] = useState(false), [message, setMessage] = useState("");
  const serial = useRef(0), syncingRef = useRef(false), periodRef = useRef(period);
  async function select(p: Period) {
    const id = ++serial.current; setPeriod(p); periodRef.current = p; setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(); const body = await res.json();
      if (id === serial.current && body.period === p) setData(body);
    } catch { if (id === serial.current) setMessage("Podaci nijesu učitani. Pokušajte ponovo."); }
    finally { if (id === serial.current) setLoading(false); }
  }
  async function sync() {
    if (syncingRef.current) return; syncingRef.current = true; setSyncing(true); setMessage("");
    const p = periodRef.current;
    try {
      const res = await fetch("/api/admin/analytics/sync", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: p, requestId: crypto.randomUUID() }), signal: AbortSignal.timeout(115000) });
      if (!res.ok) throw new Error(); const body = await res.json();
      if (periodRef.current === p) setData(body.dashboard);
      const outcome = body.dashboard?.history?.find((run: AnalyticsDashboard["history"][number]) => run.id === body.runId)?.outcome;
      setMessage(body.outcome === "running" ? "Osvježavanje je već u toku. Podaci će biti dostupni po završetku." : body.outcome === "cooldown" ? "Sačekajte dvije minute između osvježavanja." : ["success", "partial"].includes(outcome) ? "Dostupni podaci su osvježeni. Status svakog izvora je prikazan ispod." : "Osvježavanje je završeno; izvori još nijesu vratili dostupne podatke.");
    } catch { setMessage("Posljednje osvježavanje nije uspjelo. Sačuvani podaci ostaju dostupni. Ponovo učitajte pregled prije novog pokušaja."); }
    finally { syncingRef.current = false; setSyncing(false); }
  }
  return <Shell active="/admin/analitika" title="Analitika" intro="Posjete, doseg i sadržaj. Jedan pregled, isključivo stvarni podaci." action={<button className={shared.primary} onClick={sync} disabled={syncing || loading || data.sync.running || !data.writable || data.storage !== "ready"}>{syncing ? "Osvježavam podatke…" : "Osvježi podatke"}</button>}>
    <div className={styles.toolbar}><div><p className={shared.eyebrow}>Period izvještaja</p><p>{loading ? "Učitavam period…" : `${data.reports[0].range.start} — ${data.reports[0].range.end}`}</p></div><div className={styles.periods} role="group" aria-label="Period analitike">{periods.map(p => <button key={p} type="button" aria-pressed={period === p} disabled={syncing} onClick={() => select(p)}>{periodLabels[p]}</button>)}</div></div>
    {message && <p className={styles.notice} role="status">{message}</p>}
    {data.storage !== "ready" && <p className={styles.notice} role="status">{data.storage === "migration_required" ? "Historija analitike čeka zasebnu Preview migraciju. News i prijevod ostaju dostupni." : data.storage === "preview_required" ? "Analitika je dostupna samo na namijenjenom Preview okruženju." : "Historija analitike trenutno nije dostupna."}</p>}
    <nav className={styles.contents} aria-label="Analitičke sekcije">{["Dnevni pregled", "Website", "Instagram", "Facebook", "YouTube", "Top sadržaj", "Status izvora"].map((name, i) => <a key={name} href={["#daily-overview", "#analytics-website", "#analytics-instagram", "#analytics-facebook", "#analytics-youtube", "#top-content", "#sync-status"][i]}>{name}</a>)}</nav>
    <div aria-busy={loading} className={loading ? styles.loading : undefined}>
      <section id="daily-overview" className={styles.daily}><header className={styles.sectionHead}><div><p className={shared.eyebrow}>DNEVNI PREGLED</p><h2>Danas, uz jučerašnji kontekst.</h2></div></header><p className={styles.context}>Danas prikazuje podatke do sada, juče cijeli dan. Strelica i razlika porede dostupne vrijednosti; procenti su izostavljeni dok današnji dan traje. Prazna vrijednost je —, potvrđena nula je 0.</p><div className={styles.dailyGrid}>{data.reports.map(r => <article key={r.provider}><h3>{providerLabels[r.provider]}</h3><div className={styles.dailyHead}><span>Metrika</span><span>Danas</span><span>Juče</span></div>{primaryMetrics[r.provider].slice(0, 3).map(k => <div key={k} className={styles.dailyRow}><span>{metricLabels[k]}</span><strong>{format(r.today?.metrics[k])}</strong><span>{format(r.yesterday?.metrics[k])}<Change current={r.today?.metrics[k]} previous={r.yesterday?.metrics[k]} partial /></span></div>)}{(r.provider === "instagram" || r.provider === "facebook") && <div className={styles.dailyRow}><span>Promjena pratilaca</span><strong>{format(r.today?.metrics.followerChange)}</strong><span>{format(r.yesterday?.metrics.followerChange)}<Change current={r.today?.metrics.followerChange} previous={r.yesterday?.metrics.followerChange} partial /></span></div>}{r.provider === "youtube" && <p className={styles.context}>YouTube dnevni podaci mogu kasniti.</p>}<small>{r.timezone}</small></article>)}</div></section>
      {data.reports.map(r => <Source key={r.provider} report={r} />)}
      <section id="top-content" className={styles.source}><p className={shared.eyebrow}>TOP SADRŽAJ</p><h2>Sadržaj koji je privukao pažnju.</h2><div className={styles.topGrid}>{data.reports.map(r => <div key={r.provider}><h3>{providerLabels[r.provider]}</h3>{(r.provider === "instagram" || r.provider === "facebook") && <p className={styles.context}>Među najnovijim objavama u periodu · najviše pet provjerenih objava · pregledi od objave, ne samo u periodu.</p>}<Ranking rows={r.topContent} /></div>)}</div></section>
      <section id="sync-status" className={styles.source}><p className={shared.eyebrow}>PROVIDER / SYNC STATUS</p><h2>Izvori i historija osvježavanja.</h2><p className={styles.context}>Pokreće administrator. Automatski raspored nije aktiviran.</p><ul className={styles.providers}>{data.reports.map(r => <li key={r.provider}><strong>{providerLabels[r.provider]}</strong><span className={styles.state} data-state={r.state}>{stateLabels[r.state]}</span><div><span>Uspješno: {date(r.lastSuccessAt)}</span><small>Pokušaj: {date(r.lastAttemptAt)}{r.requiredPermissions.length > 0 ? ` · Potrebne dozvole: ${r.requiredPermissions.join(", ")}` : ""}</small></div></li>)}</ul>{data.sync.running && <p className={styles.notice}>Osvježavanje je u toku od {date(data.sync.startedAt)}. <button className={shared.secondary} onClick={() => select(period)} disabled={loading || syncing}>Provjeri status</button></p>}<h3 className={styles.historyTitle}>Posljednja osvježavanja</h3>{data.history.length ? <ul className={styles.history}>{data.history.map(run => <li key={run.id}><time>{date(run.started_at)}</time><span>{{ running: "U toku", success: "Uspješno", partial: "Djelimično · provjerite izvore", failed: "Bez dostupnih podataka", abandoned: "Prekinuto · moguće ponoviti" }[run.outcome]}</span></li>)}</ul> : <p className={styles.empty}>Podaci još nijesu dostupni</p>}</section>
    </div>
  </Shell>;
}
