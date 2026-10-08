import { shiftDay, validDay } from "@/admin/analytics/period";
import type { Metrics, Period, Range } from "@/admin/analytics/model";
import { blank, number, providerJson, ProviderFailure, safeText, success } from "./common";
export const youtubeConfigured = () => ["YOUTUBE_OAUTH_CLIENT_ID", "YOUTUBE_OAUTH_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"].every(k => !!process.env[k]?.trim());
export async function youtube(period: Period, now: Date, signal: AbortSignal) {
  const report = blank("youtube", period, now, "America/Los_Angeles", youtubeConfigured());
  if (!youtubeConfigured()) return report;
  const auth = await providerJson("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID!, client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET!, refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!, grant_type: "refresh_token" }) }, signal);
  if (typeof auth.access_token !== "string") throw new ProviderFailure("permission_required", "expired_credential");
  const token = auth.access_token, headers = { Authorization: `Bearer ${token}` };
  const channel = await providerJson("https://www.googleapis.com/youtube/v3/channels?part=statistics&" + (process.env.YOUTUBE_CHANNEL_ID ? "id=" + encodeURIComponent(process.env.YOUTUBE_CHANNEL_ID) : "mine=true"), { headers }, signal);
  const items = Array.isArray(channel.items) ? channel.items as { id: string; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[] : [];
  if (items.length !== 1 || (process.env.YOUTUBE_CHANNEL_ID && items[0].id !== process.env.YOUTUBE_CHANNEL_ID)) throw new ProviderFailure("error", "project_mismatch");
  report.current.subscribers = items[0].statistics?.hiddenSubscriberCount ? null : number(items[0].statistics?.subscriberCount);
  async function query(range: Range, dimension?: string) {
    const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
    url.search = new URLSearchParams({ ids: "channel==" + items[0].id, startDate: range.start, endDate: range.end, metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost", ...(dimension ? { dimensions: dimension } : {}), ...(dimension === "video" ? { sort: "-views", maxResults: "10" } : {}) }).toString();
    const b = await providerJson(url, { headers }, signal);
    if (!Array.isArray(b.columnHeaders) || (b.rows !== undefined && !Array.isArray(b.rows))) throw new ProviderFailure("error", "invalid_response");
    const columns = b.columnHeaders as { name: string }[];
    return (b.rows as unknown[][] ?? []).map(row => Object.fromEntries(columns.map((h, i) => [h.name, row[i]])));
  }
  const daily = await query({ start: report.previousRange.start, end: report.todayDate }, "day");
  function values(row: Record<string, unknown>): Metrics {
    const a = number(row.subscribersGained), b = number(row.subscribersLost);
    return { views: number(row.views), watchMinutes: number(row.estimatedMinutesWatched), subscriberChange: a !== null && b !== null ? a - b : null };
  }
  report.daily = daily.flatMap(row => validDay(row.day) ? [{ date: row.day, metrics: values(row), complete: row.day < report.todayDate }] : []);
  report.today = report.daily.find(d => d.date === report.todayDate) ?? null;
  report.yesterday = report.daily.find(d => d.date === shiftDay(report.todayDate, -1)) ?? null;
  for (const [range, target] of [[report.range, "totals"], [report.previousRange, "previousTotals"]] as const) {
    // Do not use an aggregate truncated by YouTube's processing delay as a complete period.
    const expectedDays = Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86400000) + 1;
    if (report.daily.filter(d => d.date >= range.start && d.date <= range.end).length === expectedDays) {
      const rows = await query(range); report[target] = rows.length === 1 ? values(rows[0]) : {};
    } else report.warnings.push("provider_delay");
  }
  try {
    const top = await query(report.range, "video");
    const ids = top.map(r => r.video).filter((id): id is string => typeof id === "string" && /^[\w-]{11}$/.test(id));
    const titles = new Map<string, string>();
    if (ids.length) {
      const data = await providerJson("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + ids.join(","), { headers }, signal);
      if (Array.isArray(data.items)) for (const i of data.items as { id: string; snippet?: { title?: string } }[]) titles.set(i.id, safeText(i.snippet?.title, [token]));
    }
    report.topContent = top.flatMap(row => typeof row.video === "string" && ids.includes(row.video) && number(row.views) !== null ? [{ label: titles.get(row.video) || "YouTube video", url: "https://www.youtube.com/watch?v=" + row.video, value: number(row.views)!, basis: "period" as const }] : []);
  } catch { report.warnings.push("unsupported_metric"); }
  report.warnings = [...new Set(report.warnings)];
  return success(report, now);
}
