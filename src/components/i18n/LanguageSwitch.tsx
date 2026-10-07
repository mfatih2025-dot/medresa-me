"use client";

import { usePathname } from "next/navigation";
import { localeNames, locales, rememberLocale, type Locale } from "@/i18n/config";
import { translatePath } from "@/i18n/routes";

/**
 * BS · SQ · EN in the header menu: real links to the same page in each
 * language, through the route map (/upis → /en/admissions, /sq/historiku →
 * /historijat), remembering the choice before leaving. Pages below a route (news articles) are matched
 * through their hreflang alternates. The current language is marked, not only coloured.
 */
export function LanguageSwitch({ label }: { label: string }) {
  const pathname = usePathname() || "/";
  const first = pathname.split("/")[1];
  const current: Locale = first === "sq" || first === "en" ? first : "bs";
  return (
    <nav aria-label={label} className="flex items-center gap-1">
      <span className="text-ivory/50">{label}:</span>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span aria-hidden className="text-ivory/30">
              ·
            </span>
          )}
          <a
            href={translatePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === current ? "true" : undefined}
            aria-label={localeNames[l].native}
            onClick={(e) => {
              rememberLocale(l);
              // A page outside the route map (a news article) names its own translations in the
              // head (hreflang alternates): go there, so the reader stays on the same story.
              const alt = document.head.querySelector<HTMLLinkElement>(
                `link[rel="alternate"][hreflang="${l}"]`,
              );
              const target = alt && new URL(alt.href).pathname;
              if (target && target !== e.currentTarget.getAttribute("href")) {
                e.preventDefault();
                window.location.assign(target);
              }
            }}
            className={`inline-flex min-h-11 items-center px-1.5 transition-colors duration-200 ${
              l === current ? "font-medium text-ivory" : "text-ivory/50 hover:text-ivory"
            }`}
          >
            {localeNames[l].short}
          </a>
        </span>
      ))}
    </nav>
  );
}
