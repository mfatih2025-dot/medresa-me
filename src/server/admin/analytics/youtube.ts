import { shiftDay, validDay } from "@/admin/analytics/period";
import type { Metrics, Period, Range } from "@/admin/analytics/model";
import { blank, number, ProviderFailure, safeText, success } from "./common";
import type { YouTubeDiagnostic } from "@/admin/analytics/youtubeTest";
import { youtubeConfiguration, youtubeJson } from "./youtubeDiagnostic";
export const youtubeConfigured = () => Object.values(youtubeConfiguration()).every(Boolean);
export async function youtube(period: Period, now: Date, signal: AbortSignal, diagnostic?: YouTubeDiagnostic) {
  const report = blank("youtube", period, now, "America/Los_Angeles", youtubeConfigured());
  if (diagnostic) diagnostic.configuration = youtubeConfiguration();
  if (!youtubeConfigured()) return report;
  const auth = await youtubeJson("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID!, client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET!, refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!, grant_type: "refresh_token" }) }, signal, "oauth", diagnostic);
  if (typeof auth.access_token !== "string" || !auth.access_token.trim()) throw new ProviderFailure("permission_required", "expired_credential");
  if (diagnostic) diagnostic.oauthVerified = true;
  const token = auth.access_token, headers = { Authorization: `Bearer ${token}` };
  // An id lookup can return any public channel. Discover the owner's channel first.
  const channel = await youtubeJson("https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true", { headers }, signal, "channel", diagnostic);
  const items = Array.isArray(channel.items) ? channel.items as { id: string; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[] : [];
  if (items.length !== 1 || !items[0] || typeof items[0].id !== "string" || !/^UC[\w-]{22}$/.test(items[0].id) || safeText(items[0].id, [token]) !== items[0].id) throw new ProviderFailure("error", "project_mismatch");
  if (diagnostic) { diagnostic.channelDiscovered = true; diagnostic.channelId = items[0].id; diagnostic.configuredChannelMatches = process.env.YOUTUBE_CHANNEL_ID ? items[0].id === process.env.YOUTUBE_CHANNEL_ID : null; }
  if (process.env.YOUTUBE_CHANNEL_ID && items[0].id !== process.env.YOUTUBE_CHANNEL_ID) throw new ProviderFailure("error", "project_mismatch");
  report.current.subscribers = items[0].statistics?.hiddenSubscriberCount ? null : number(items[0].statistics?.subscriberCount);
  async function query(range: Range, dimension?: string) {
    const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
    url.search = new URLSearchParams({ ids: "channel==" + items[0].id, startDate: range.start, endDate: range.end, metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost", ...(dimension ? { dimensions: dimension } : {}), ...(dimension === "video" ? { sort: "-views", maxResults: "10" } : {}) }).toString();
    const request = dimension === "day" ? "daily" : dimension === "video" ? "top" : range === report.range ? "current" : "previous";
    const b = await youtubeJson(url, { headers }, signal, request, diagnostic);
    if (!Array.isArray(b.columnHeaders) || (b.rows !== undefined && !Array.isArray(b.rows))) throw new ProviderFailure("error", "invalid_response");
    const columns = b.columnHeaders as { name: string }[];
    const expected = dimension === "video" ? ["video", "views"] : [...(dimension ? [dimension] : []), "views", "estimatedMinutesWatched", "subscribersGained", "subscribersLost"];
    if (columns.some(c => !c || typeof c.name !== "string" || ![...expected, "estimatedMinutesWatched", "subscribersGained", "subscribersLost"].includes(c.name)) || new Set(columns.map(c => c.name)).size !== columns.length || expected.some(name => !columns.some(c => c.name === name))) throw new ProviderFailure("error", "invalid_response");
    const rows = b.rows as unknown[][] ?? [];
    if (rows.some(row => !Array.isArray(row) || row.length !== columns.length)) throw new ProviderFailure("error", "invalid_response");
    const parsed = rows.map(row => Object.fromEntries(columns.map((h, i) => [h.name, row[i]])));
    if (dimension === "day" && (parsed.some(row => !validDay(row.day) || row.day < range.start || row.day > range.end) || new Set(parsed.map(row => row.day)).size !== parsed.length)) throw new ProviderFailure("error", "invalid_response");
    if (diagnostic && dimension === "day") diagnostic.analyticsVerified = true;
    return parsed;
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
      const data = await youtubeJson("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + ids.join(","), { headers }, signal, "videos", diagnostic);
      if (Array.isArray(data.items)) for (const i of data.items as { id: string; snippet?: { title?: string } }[]) titles.set(i.id, safeText(i.snippet?.title, [token]));
    }
    report.topContent = top.flatMap(row => typeof row.video === "string" && ids.includes(row.video) && number(row.views) !== null ? [{ label: titles.get(row.video) || "YouTube video", url: "https://www.youtube.com/watch?v=" + row.video, value: number(row.views)!, basis: "period" as const }] : []);
  } catch (error) { report.warnings.push(error instanceof ProviderFailure ? error.reason : "invalid_response"); }
  report.warnings = [...new Set(report.warnings)];
  return success(report, now);
}
