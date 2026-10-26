/** Fixed public scope; never derive trusted domains from Host/forwarded headers. */
export const PUBLIC_ANALYTICS_HOST = "www.medresa.me";
export const WEBSITE_SOURCE = "Vercel Web Analytics · www.medresa.me";
export const WEBSITE_SCOPE = "production_canonical";
export function publicAnalyticsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const path = decodeURIComponent(url.pathname).replace(/\/+/g, "/").toLowerCase();
    const withoutLocale = path.replace(/^\/(?:bs|sq|en)(?=\/|$)/, "");
    return url.protocol === "https:" && url.host === PUBLIC_ANALYTICS_HOST && !url.username && !url.password
      && !/^\/(?:admin|ulaz7|api)/.test(withoutLocale);
  } catch { return false; }
}
