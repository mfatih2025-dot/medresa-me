import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { isPageId, pageBySlug, parsePath, slugs, translatePath } from "@/i18n/routes";

/*
 * Locale routing (see src/i18n/config.ts and src/i18n/routes.ts).
 *
 *   /…  (unprefixed)       Bosnian — rewritten to /bs/… internally, URL unchanged —
 *                          unless the visitor chose sq or en: then 307 to the
 *                          same page in that language (/upis → /en/admissions)
 *   /sq/…, /en/…           each language's own slugs, served from the page's
 *                          folder (/en/admissions → app/[locale]/upis); a page
 *                          reached by another language's slug is sent to its
 *                          own (308: /en/upis, /en/regjistrimi → /en/admissions)
 *   /bs/…                  308 to the unprefixed URL (rewrites into /bs are internal
 *                          and do not pass through here again)
 *
 * Redirects only ever go from an unprefixed URL to a prefixed one, or from a
 * prefixed URL to the same language's slug, so a loop is impossible.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const parts = pathname.split("/");
  const first = parts[1];

  if (isLocale(first)) {
    const seg = parts[2];
    // Bosnian has no prefix in public: /bs/… is the same page at /… (one URL per page).
    if (first === "bs") {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(3) || "/";
      url.search = search;
      return NextResponse.redirect(url, 308);
    }
    if (!seg) return NextResponse.next();
    const tail = parts.slice(3).join("/");
    const id = pageBySlug(seg, first);
    if (id) {
      if (id === seg) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/${id}${tail ? `/${tail}` : ""}`;
      return NextResponse.rewrite(url);
    }
    // Another language's slug (/en/upis, /en/regjistrimi) → this language's own.
    const other = isPageId(seg) ? seg : (pageBySlug(seg, "sq") ?? pageBySlug(seg, "en"));
    if (other) {
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/${slugs[other][first]}${tail ? `/${tail}` : ""}`;
      url.search = search;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  if (preferred === "sq" || preferred === "en") {
    const url = request.nextUrl.clone();
    // A known page goes to its own slug; anything else keeps its path (and 404s there).
    url.pathname =
      parsePath(pathname).id === undefined ? `/${preferred}${pathname}` : translatePath(pathname, preferred);
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/bs" : `/bs${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: not Next internals, the image optimiser, or files (anything with a dot).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
