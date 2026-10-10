import { useEffect, useRef, useState } from "react";
import { Shell } from "../Shell";
import shared from "../admin.module.css";
import styles from "./analytics.module.css";
import { comparison, days } from "./period";
import { providerLabels, metricLabels, periods, stateLabels, reasonLabels, type AnalyticsDashboard, type Metric, type Period, type Provider, type ProviderReport, type Ranked } from "./model";
import { formatYouTube } from "./formatYouTube";
import { periodViews } from "./views";

const periodLabels: Record<Period, string> = { today: "Danas", yesterday: "Juče", "7": "7 dana", "30": "30 dana", "60": "60 dana", "90": "90 dana" };
const primaryMetrics: Record<ProviderReport["provider"], Metric[]> = { website: ["visits", "visitors", "pageviews"], instagram: ["views", "reach", "interactions", "followerChange", "profileActivity"], facebook: ["views", "reach", "interactions", "followerChange"], youtube: ["views", "watchMinutes", "subscriberChange"] };
const sourceSummaries: Record<Provider, string> = { website: "Posjete i sadržaj", instagram: "Publika i objave", facebook: "Publika i objave", youtube: "Publika i video" };
// Stable Bosnian separators keep all displayed KPIs/comparisons consistent across SSR and phones.
const format = formatYouTube;
const formatFor = (provider: Provider | undefined, n: number | null | undefined) => provider === "youtube" ? formatYouTube(n) : format(n);
// Numeric parts avoid server/browser CLDR month-name differences during hydration.
const date = (s: string | null) => {
  if (!s || !Number.isFinite(Date.parse(s))) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Podgorica" }).formatToParts(new Date(s));
  const part = (name: string) => parts.find(p => p.type === name)?.value ?? "";
  return `${part("day")}.${part("month")}.${part("year")}. · ${part("hour")}:${part("minute")}`;
};
function Change({ current, previous, complete = true, partial = false, provider }: { current: number | null | undefined; previous: number | null | undefined; complete?: boolean; partial?: boolean; provider?: Provider }) {
  const c = comparison(current, previous, complete);
  return <span className={styles.change}>{c.direction}{c.delta !== null && c.delta !== 0 ? ` ${c.delta > 0 ? "+" : ""}${formatFor(provider, c.delta)}` : ""}{!partial && c.percent !== null ? ` · ${formatFor(provider, c.percent)}%` : ""}</span>;
}
function Ranking({ rows, empty = "Nema podataka za izabrani period", provider }: { rows: Ranked[]; empty?: string; provider?: Provider }) {
  if (!rows.length) return <p className={styles.empty}>{empty}</p>;
  return <ol className={styles.ranking}>{rows.map((row, i) => <li key={`${i}-${row.label}`}><span className={styles.ordinal}>{String(i + 1).padStart(2, "0")}</span><span>{row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer">{row.label} ↗</a> : row.label}<small>{row.basis === "lifetime" ? "Ukupni pregledi od objave" : "Pregledi u izabranom periodu"}</small></span><strong>{formatFor(provider, row.value)}</strong></li>)}</ol>;
}
function Trend({ report, metric }: { report: ProviderReport; metric: Metric }) {
  const [position, setPosition] = useState(0);
  const series = days(report.range).map(day => ({ day, value: report.daily.find(d => d.date === day)?.metrics[metric] ?? null }));
  if (!series.some(d => typeof d.value === "number")) return <div className={styles.chartEmpty}><span>Podaci još nijesu dostupni</span><small>{metricLabels[metric]} · dnevni tok</small></div>;
  const values = series.flatMap(d => d.value === null ? [] : [d.value]); const max = Math.max(1, ...values), min = Math.min(0, ...values);
  const x = (i: number) => series.length === 1 ? 300 : 20 + i / (series.length - 1) * 560;
  const y = (v: number) => 285 - (v - min) / (max - min) * 250;
  let path = "", gap = true;
  series.forEach((point, i) => { if (point.value === null) gap = true; else { path += `${gap ? "M" : "L"}${x(i)},${y(point.value)} `; gap = false; } });
  const selected = Math.min(position, series.length - 1), p = series[selected];
  return <figure className={styles.chart}>
    <figcaption><div><span>{providerLabels[report.provider]} · {metricLabels[metric]} · dnevni tok</span><time dateTime={p.day}>{p.day}</time></div><strong>{formatFor(report.provider, p.value)}</strong></figcaption>
    <svg viewBox="0 0 600 320" preserveAspectRatio="none" role="img" aria-label={`Dnevni tok: ${metricLabels[metric]}`}>
      <title>{`${metricLabels[metric]} od ${report.range.start} do ${report.range.end}. Nedostajući dani su prekidi linije.`}</title>
      {[35, 160, 285].map(h => <line key={h} x1="20" x2="580" y1={h} y2={h} stroke="#dce1d7" strokeWidth="1" />)}
      <path d={path} fill="none" stroke="#123c31" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      {series.length === 1 && p.value !== null && <circle cx={x(0)} cy={y(p.value)} r="4" fill="#123c31" />}
      {p.value !== null && <><line x1={x(selected)} x2={x(selected)} y1="30" y2="290" stroke="#b39961" strokeDasharray="3 4" /><circle cx={x(selected)} cy={y(p.value)} r="5" fill="#b39961" stroke="#f8f6ef" strokeWidth="2" /></>}
    </svg>
    <label className={styles.chartControl}>Odaberi dan<input type="range" aria-label={`Odaberi dan · ${providerLabels[report.provider]}`} min="0" max={Math.max(0, series.length - 1)} value={selected} onChange={e => setPosition(Number(e.target.value))} /></label>
    <div className={styles.axis}><span>{report.range.start}</span><span>{report.range.end}</span></div>
  </figure>;
}
function Source({ report }: { report: ProviderReport }) {
  const [dimension, setDimension] = useState<keyof ProviderReport["breakdowns"]>("pages");
  const keys = [...primaryMetrics[report.provider]].sort((a, b) => Number(typeof report.totals[b] === "number") - Number(typeof report.totals[a] === "number"));
  const chartKey = report.provider === "website" ? "pageviews" : report.provider === "instagram" ? "reach" : "views";
  return <section id={`analytics-${report.provider}`} className={styles.source} aria-label={`${providerLabels[report.provider]} analitika`}>
    <header className={styles.sectionHead}><div><p className={shared.eyebrow}>{sourceSummaries[report.provider]}</p><h2>{providerLabels[report.provider]}</h2></div><span className={styles.state} data-state={report.state}>{stateLabels[report.state]}</span></header>
    {Object.values(report.totalCoverage ?? {}).some(c => c?.partial) && <p className={styles.context}>Prikazani su dostupni izmjereni dani; period nije potpuno pokriven.</p>}
    {report.reason && <p className={styles.sourceNotice}>{report.reason === "project_mismatch" ? "Veza s izvorom trenutno nije dostupna." : reasonLabels[report.reason]}{report.lastSuccessAt ? " · prikazani su sačuvani podaci" : ""}</p>}
    <div className={styles.metrics}>{keys.map(k => <div key={k} data-available={typeof report.totals[k] === "number"}><span>{metricLabels[k]}</span><strong>{formatFor(report.provider, report.totals[k])}</strong><Change current={report.totals[k]} previous={report.previousTotals[k]} complete={report.range.end < report.todayDate && !report.totalCoverage?.[k]?.partial && !report.previousCoverage?.[k]?.partial && (!report.totalCoverage?.[k] || !report.previousCoverage?.[k] || report.totalCoverage[k]!.days === report.previousCoverage[k]!.days)} provider={report.provider} /></div>)}</div>
    <p className={styles.context}>Prethodni period: {report.previousRange.start} — {report.previousRange.end} · Dani prema izvoru: {report.timezone}. Višednevni periodi obuhvataju završene dane.</p>
    {report.provider === "website" && report.state === "connected" && !Object.values(report.previousTotals).some(v => typeof v === "number") && <p className={styles.context}>Nema dostupnih podataka za prethodni period.</p>}
    {report.provider === "website" ? <div className={styles.total} data-available={typeof report.cumulative.visits === "number"}><p className={shared.eyebrow}>UKUPNO POSJETA</p><strong>{format(report.cumulative.visits)}</strong><p>Sesije / posjete nijesu dostupne za ovaj izvor. Posjetioci i pregledi stranica mjere se zasebno.</p><p>Ukupno od početka praćenja{report.trackingStart ? ` · ${report.trackingStart}` : ""}</p><span>Pregledi stranica: {format(report.cumulative.pageviews)}</span></div> : <div className={styles.current}><span>{report.provider === "youtube" ? "Pretplatnici · trenutno" : "Pratioci · trenutno"}</span><strong>{formatFor(report.provider, report.provider === "youtube" ? report.current.subscribers : report.current.followers)}</strong></div>}
    <Trend key={`${report.provider}-${report.range.start}-${report.range.end}`} report={report} metric={chartKey} />
    {report.provider === "website" && <div className={styles.breakdowns}><div className={styles.tabs} aria-label="Website raspodjela">{(["pages", "referrers", "devices", "countries"] as const).map((d, i) => <button key={d} type="button" aria-pressed={dimension === d} onClick={() => setDimension(d)}>{["Stranice", "Izvori posjeta", "Uređaji", "Zemlje"][i]}</button>)}</div><Ranking rows={report.breakdowns[dimension]} /></div>}
    {report.warnings.some(w => w !== "no_data") && <p className={styles.context}>{report.warnings.includes("provider_delay") ? "Najnoviji podaci ovog izvora mogu kasniti." : "Neke metrike trenutno nijesu dostupne."}</p>}
    {report.topContent.length > 0 && <div className={styles.sourceTop}><h3>Top sadržaj</h3>{(report.provider === "instagram" || report.provider === "facebook") && <p className={styles.context}>Među najnovijim objavama u periodu · pregledi od objave.</p>}<Ranking rows={report.topContent} provider={report.provider} /></div>}
  </section>;
}
function DailyMetric({ report, metric }: { report: ProviderReport; metric: Metric }) {
  const today = report.today?.metrics[metric], yesterday = report.yesterday?.metrics[metric];
  return <div className={styles.dailyRow} data-available={typeof today === "number" || typeof yesterday === "number"}>
    <span className={styles.dailyLabel}>{metricLabels[metric]}</span>
    <div className={styles.dailyNumbers}><strong>{formatFor(report.provider, today)}</strong><div className={styles.dailyYesterday}><span>Juče {formatFor(report.provider, yesterday)}</span><Change current={today} previous={yesterday} partial provider={report.provider} /></div></div>
  </div>;
}
export function Analytics({ initial }: { initial: AnalyticsDashboard }) {
  const [data, setData] = useState(initial), [period, setPeriod] = useState(initial.period);
  const [loading, setLoading] = useState(false), [syncing, setSyncing] = useState(false), [message, setMessage] = useState("");
  const serial = useRef(0), syncingRef = useRef(false), periodRef = useRef(period);
  // An in-progress refresh only polls saved status; it never triggers another sync.
  useEffect(() => {
    if (!data.sync.running || syncing) return;
    const controller = new AbortController(); let pending = false;
    const timer = setInterval(async () => {
      if (pending) return; pending = true;
      const p = periodRef.current, id = serial.current;
      try {
        const res = await fetch(`/api/admin/analytics?period=${p}`, { credentials: "same-origin", cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
        if (res.ok) { const body = await res.json(); if (!controller.signal.aborted && id === serial.current && body.period === p) setData(body); }
      } catch { /* Keep the saved dashboard available during a transient read failure. */ }
      finally { pending = false; }
    }, 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [data.sync.running, syncing]);
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
  const views = periodViews(data.reports);
  const lastRefreshed = data.reports.map(r => r.lastSuccessAt).filter((value): value is string => !!value && Number.isFinite(Date.parse(value))).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const website = data.reports.find(r => r.provider === "website");
  return <div className={styles.dashboard}><Shell active="/admin/analitika" title="Analitika" intro="Pregledi, publika i sadržaj.">
    <div className={styles.toolbar}>
      <div className={styles.controls}><div className={styles.periods} role="group" aria-label="Period analitike">{periods.map(p => <button key={p} type="button" aria-pressed={period === p} disabled={syncing} onClick={() => select(p)}>{periodLabels[p]}</button>)}</div><button className={`${shared.primary} ${styles.refresh}`} onClick={() => sync()} disabled={syncing || loading || data.sync.running || !data.writable || data.storage !== "ready"}>{syncing ? "Osvježavam podatke…" : "Osvježi podatke"}</button></div>
      <p className={styles.refreshed}>Posljednje osvježeno: {date(lastRefreshed)}</p>
    </div>
    {message && <p className={styles.notice} role="status">{message}</p>}
    {data.storage !== "ready" && <p className={styles.notice} role="status">Historija analitike trenutno nije dostupna.</p>}

    <div aria-busy={loading} className={loading ? styles.loading : undefined}>
      <section className={styles.hero} aria-label="Ukupno pregleda u izabranom periodu">
        <p className={shared.eyebrow}>UKUPNO PREGLEDA</p><strong className={styles.heroValue} data-testid="period-views">{formatYouTube(views.total)}</strong>
        <p className={styles.heroContext}>{loading ? "Učitavam period…" : periodLabels[data.period]} · {views.coverage ? `Dostupni izvori: ${views.coverage}/4` : "Podaci još nijesu dostupni"}{views.sources.some(s => s.history?.partial) ? " · djelimična historija" : ""}</p>
        <ul className={styles.platformTotals} aria-label="Pregledi po platformi">{views.sources.map(source => <li key={source.provider}><span>{providerLabels[source.provider]}</span><strong>{formatYouTube(source.value)}</strong>{source.history && <small>Dostupni podaci: {source.history.days}/{source.history.expectedDays} dana{source.history.partial ? " · djelimično" : ""}</small>}</li>)}</ul>
        <p className={styles.heroDefinition}>Zbir pregleda sadržaja, ne jedinstvenih posjetilaca.{views.coverage > 0 && views.coverage < 4 ? " Nedostupni izvori nijesu uključeni." : ""}</p>
      </section>
      <nav className={styles.contents} aria-label="Analitičke sekcije">{["Danas / Juče", "Website", "Instagram", "Facebook", "YouTube", "Status izvora"].map((name, i) => <a key={name} href={["#daily-overview", "#analytics-website", "#analytics-instagram", "#analytics-facebook", "#analytics-youtube", "#sync-status"][i]}>{name}</a>)}</nav>
      {website && <section className={styles.mainTrend} aria-label="Pregledi stranica · Website"><Trend key={`overview-${website.range.start}-${website.range.end}`} report={website} metric="pageviews" /></section>}
      <section id="daily-overview" className={styles.daily}><header className={styles.sectionHead}><div><p className={shared.eyebrow}>DNEVNI PREGLED</p><h2>Danas / Juče</h2></div></header><p className={styles.context}>Danas do sada · juče cijeli dan. — označava nedostupne podatke.</p><div className={styles.dailyGrid}>{data.reports.map(r => <article key={r.provider}><div className={styles.dailyProvider}><h3>{providerLabels[r.provider]}</h3><span>Danas</span></div>{primaryMetrics[r.provider].slice(0, 3).map(k => <DailyMetric key={k} report={r} metric={k} />)}{(r.provider === "instagram" || r.provider === "facebook") && <DailyMetric report={r} metric="followerChange" />}{r.provider === "youtube" && <p className={styles.context}>YouTube dnevni podaci mogu kasniti.</p>}<small>{r.timezone}</small></article>)}</div></section>
      {data.reports.map(r => <Source key={r.provider} report={r} />)}
      <section id="sync-status" className={styles.source}><p className={shared.eyebrow}>STATUS IZVORA</p><h2>Stanje izvora</h2><ul className={styles.providers}>{data.reports.map(r => <li key={r.provider}><strong>{providerLabels[r.provider]}</strong><span className={styles.state} data-state={r.state}>{stateLabels[r.state]}</span><small>Osvježeno: {date(r.lastSuccessAt)}</small></li>)}</ul>{data.sync.running && <p className={styles.notice}>Osvježavanje je u toku. Status se automatski ažurira.</p>}</section>
    </div>
  </Shell></div>;
}
