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

export type SeasonalSettings = {
  /** The edition shown to every visitor, or null for the original site. */
  active: SeasonalThemeId | null;
};

export const seasonalSettings: SeasonalSettings = { active: null };

/**
 * Preview only (never on production): ?ramadan=1 turns the Ramadan edition on for
 * this browser, ?ramadan=0 off; the choice is kept in a cookie, so it follows
 * every page until changed.
 */
export const PREVIEW_PARAM = "ramadan";
export const PREVIEW_COOKIE = "medresa-seasonal-preview";

/** Whether this build lets a visitor preview an edition (every build but production). */
export const previewAllowed = () => process.env.VERCEL_ENV !== "production";

/**
 * Sets (or clears) data-seasonal-theme on <html> before the first paint, so an
 * edition never flashes in or out. Static, build-time code only.
 */
export function seasonalScript(active: SeasonalThemeId | null, preview: boolean) {
  const choose = preview
    ? `var q=new URLSearchParams(location.search).get("${PREVIEW_PARAM}");` +
      `if(q==="1"||q==="0")document.cookie="${PREVIEW_COOKIE}="+q+";path=/;max-age=2592000;samesite=lax";` +
      `var m=document.cookie.match(/(?:^|;\\s*)${PREVIEW_COOKIE}=([01])/);if(m)a=m[1]==="1"?"ramadan":null;`
    : "";
  // Never in the private areas that share the public shell (the admin's renderer previews).
  return `(function(){try{var d=document.documentElement,a=${JSON.stringify(active)};${choose}var p=location.pathname;if(p.indexOf("/admin")===0||p.indexOf("/ulaz7")===0)a=null;if(a)d.dataset.seasonalTheme=a;else delete d.dataset.seasonalTheme}catch(e){}})()`;
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
