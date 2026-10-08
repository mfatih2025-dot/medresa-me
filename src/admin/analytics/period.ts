import { periods, type Period, type Range } from "./model";
export function parsePeriod(value: unknown): Period {
  if (value === undefined) return "30";
  if (typeof value !== "string" || !periods.includes(value as Period)) throw new Error("invalid_period");
  return value as Period;
}
export function dayAt(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(k => parts.find(p => p.type === k)!.value).join("-");
}
export function validDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function shiftDay(day: string, offset: number): string {
  if (!validDay(day)) throw new Error("invalid_day");
  const d = new Date(day + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10);
}
export function startInstant(day: string, timezone: string): string {
  if (!validDay(day)) throw new Error("invalid_day");
  const desired = Date.parse(day + "T00:00:00Z"); let instant = desired;
  for (let i = 0; i < 3; i++) {
    const p = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
    const v = (k: string) => Number(p.find(x => x.type === k)!.value);
    const wall = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
    instant += desired - wall;
  }
  return new Date(instant).toISOString();
}
/** Multi-day periods contain completed calendar days. Today is explicitly partial. */
export function ranges(period: Period, now = new Date(), timezone = "Europe/Podgorica") {
  const today = dayAt(now, timezone), yesterday = shiftDay(today, -1);
  const count = period === "today" || period === "yesterday" ? 1 : Number(period);
  const end = period === "today" ? today : yesterday;
  const start = shiftDay(end, 1 - count);
  return { today, yesterday, current: { start, end }, previous: { start: shiftDay(start, -count), end: shiftDay(start, -1) } };
}
export function days(range: Range): string[] {
  if (!validDay(range.start) || !validDay(range.end) || range.start > range.end) throw new Error("invalid_range");
  const count = Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86400000) + 1;
  if (count > 370) throw new Error("range_too_long");
  return Array.from({ length: count }, (_, i) => shiftDay(range.start, i));
}
export function comparison(current: number | null | undefined, previous: number | null | undefined, complete = true) {
  if (!complete || typeof current !== "number" || typeof previous !== "number" || !Number.isFinite(current) || !Number.isFinite(previous)) return { direction: "—", delta: null, percent: null };
  const delta = current - previous;
  const percent = previous > 0 ? delta / previous * 100 : null;
  return { direction: delta > 0 ? "↑" : delta < 0 ? "↓" : "—", delta: Number.isFinite(delta) ? delta : null, percent: percent !== null && Number.isFinite(percent) ? percent : null };
}
