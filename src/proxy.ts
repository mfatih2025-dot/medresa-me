import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";

/*
 * Locale routing (see src/i18n/config.ts).
 *
 *   /sq/…, /en/…, /bs/…   served as they are (an explicit locale always wins)
 *   /…  (unprefixed)       Bosnian — rewritten to /bs/… internally, URL unchanged —
 *                          unless the visitor chose sq or en, then 307 → /sq/… or /en/…
 *
 * Redirects only ever go from an unprefixed URL to a prefixed one, and prefixed
 * URLs are never redirected, so a loop is impossible.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  if (preferred === "sq" || preferred === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${preferred}` : `/${preferred}${pathname}`;
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
