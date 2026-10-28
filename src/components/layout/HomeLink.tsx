"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "@/components/ui/icons";
import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";

/**
 * „← Početna“ · „← Ballina“ · „← Home“: the way back to the homepage of the
 * page's own language, on every internal page. The same quiet link as the news
 * article's „Sve vijesti“ (green, a turned arrow that nudges back on hover),
 * in the same place: on the content's left edge, just below the header bar and
 * clear of the emblem.
 *
 * Laid over the page (absolute), so no page moves for it. Not shown on the
 * homepages, nor on a page with its own way back in that place, so a page never
 * has two: a news article (its „Sve vijesti“; recognised by its address, the
 * article renderer stays untouched), and pages marked data-back-nav (a
 * generation's „Alumni“, the 404's button).
 */
export function HomeLink({ labels }: { labels: Record<Locale, string> }) {
  const locale = useLocale();
  const home = pathFor(null, locale);
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";
  if (pathname === home || pathname === "/bs" || isArticle(pathname, locale)) return null;
  return (
    <div className="home-link wrap pointer-events-none absolute inset-x-0 top-[4.75rem] z-20 md:top-[6.5rem]">
      <Link
        href={home}
        className="group pointer-events-auto -ml-1 inline-flex min-h-11 items-center gap-2 px-1 text-[0.8125rem] font-medium tracking-[0.01em] text-green md:text-[0.875rem]"
      >
        <ArrowRight
          aria-hidden
          className="size-4 rotate-180 transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:-translate-x-[4px] group-focus-visible:-translate-x-[4px]"
        />
        {labels[locale]}
      </Link>
    </div>
  );
}

/** /vijesti/<article>, /sq/lajme/<article>, /en/news/<article>; not an archive page (/vijesti/2). */
function isArticle(pathname: string, locale: Locale) {
  const rest = pathname.slice(pathFor("vijesti", locale).length);
  return pathname.startsWith(pathFor("vijesti", locale) + "/") && !/^\/\d+$/.test(rest);
}
