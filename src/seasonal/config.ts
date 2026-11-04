import type { Locale } from "@/i18n/config";
import type { PageId } from "@/i18n/routes";

/*
 * Seasonal editions: optional decorative layers over the site's own design.
 *
 * An edition is switched on by one attribute on <html>, data-seasonal-theme,
 * and everything it adds is scoped to it (src/seasonal/*.css) or rendered
 * hidden until it is set. With no edition active the site is exactly its
 * original self: nothing seasonal is shown, laid out or animated.
 *
 * seasonalSettings is the one place an edition is chosen. It is plain data, so a
 * later admin setting can supply the same shape instead of this constant.
 */

export type SeasonalThemeId = "ramadan";

/**
 * The Ramadan calendar, as announced (not an astronomical prediction): its first
 * day, how many days it has (29 or 30), and the time zone in which a day begins.
 * Both dates are set by hand once the Islamic Community announces them.
 */
export type RamadanCalendar = {
  /** The first day of Ramadan, YYYY-MM-DD, local date in timeZone. */
  start: string;
  days: 29 | 30;
  timeZone: string;
};

export type SeasonalSettings = {
  /** The edition shown to every visitor, or null for the original site. */
  active: SeasonalThemeId | null;
  ramadan: RamadanCalendar;
};

export const seasonalSettings: SeasonalSettings = {
  active: null,
  // 1448 AH: an expected date, to be confirmed by the Islamic Community before Ramadan.
  ramadan: { start: "2027-02-08", days: 30, timeZone: "Europe/Podgorica" },
};

/**
 * Preview only (never on production): ?ramadan=1 turns the Ramadan edition on for
 * this browser, ?ramadan=0 off; the choice is kept in a cookie, so it follows
 * every page until changed.
 */
export const PREVIEW_PARAM = "ramadan";
export const PREVIEW_COOKIE = "medresa-seasonal-preview";
/** Preview only: ?ramadan-day=1…30 shows that day's hadith (kept in a cookie; 0 clears it). */
export const DAY_PARAM = "ramadan-day";
export const DAY_COOKIE = "medresa-ramadan-day-preview";

/** Whether this build lets a visitor preview an edition (every build but production). */
export const previewAllowed = () => process.env.VERCEL_ENV !== "production";

/**
 * Sets (or clears) data-seasonal-theme on <html> before the first paint, so an
 * edition never flashes in or out; with Ramadan, also data-ramadan-day: the day of
 * Ramadan today in its time zone (1 … days), absent outside Ramadan. A day is a
 * local date, so midnight and daylight saving changes fall where they should.
 * Previews may pick a day (?ramadan-day=N), and show day 1 outside Ramadan.
 * Static, build-time code only.
 */
export function seasonalScript(
  active: SeasonalThemeId | null,
  preview: boolean,
  calendar: RamadanCalendar = seasonalSettings.ramadan,
) {
  const day =
    `var r=${JSON.stringify(calendar)},t=new Intl.DateTimeFormat("en-CA",{timeZone:r.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),` +
    `n=Math.round((Date.parse(t)-Date.parse(r.start))/864e5)+1;` +
    (preview
      ? `var qd=new URLSearchParams(location.search).get("${DAY_PARAM}");` +
        `if(qd!==null&&/^\\d{1,2}$/.test(qd))document.cookie="${DAY_COOKIE}="+qd+";path=/;max-age=2592000;samesite=lax";` +
        `var md=document.cookie.match(/(?:^|;\\s*)${DAY_COOKIE}=(\\d{1,2})/);if(md&&+md[1]>0)n=+md[1];else if(n<1||n>r.days)n=1;`
      : "") +
    `if(a==="ramadan"&&n>=1&&n<=r.days)d.dataset.ramadanDay=String(n);else delete d.dataset.ramadanDay;`;
  const choose = preview
    ? `var q=new URLSearchParams(location.search).get("${PREVIEW_PARAM}");` +
      `if(q==="1"||q==="0")document.cookie="${PREVIEW_COOKIE}="+q+";path=/;max-age=2592000;samesite=lax";` +
      `var m=document.cookie.match(/(?:^|;\\s*)${PREVIEW_COOKIE}=([01])/);if(m)a=m[1]==="1"?"ramadan":null;`
    : "";
  // Never in the private areas that share the public shell (the admin's renderer previews).
  return `(function(){try{var d=document.documentElement,a=${JSON.stringify(active)};${choose}var p=location.pathname;if(p.indexOf("/admin")===0||p.indexOf("/ulaz7")===0)a=null;if(a)d.dataset.seasonalTheme=a;else delete d.dataset.seasonalTheme;${day}}catch(e){}})()`;
}

/** The Ramadan edition's words: its greeting in the announcement bar, and where it leads. */
export const ramadanContent: { greeting: Record<Locale, string>; page: PageId } = {
  greeting: {
    bs: "Ramazan mubarek olsun",
    sq: "Ramazani mubarek qoftë",
    en: "Ramadan Mubarak",
  },
  page: "vijesti",
};
