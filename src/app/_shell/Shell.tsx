import { Kanit } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Gateway } from "@/components/i18n/Gateway";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/i18n/SkipLink";
import { chromeOf, dictionaries } from "@/content";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import "../globals.css";

/*
 * The document every page is rendered in: <html> in the page's own language
 * (so Albanian and English pages are served as lang="sq"/"en", not "bs"),
 * the header, main, footer and the first-visit language gateway. Used by the
 * locale root layout (app/[locale]/layout.tsx) and by the global 404.
 */

// Only the weights/styles in use are loaded (no synthesized bold or italic):
// 300 body · 400 sub-headings, navigation, statistics · 500 headings, buttons, labels ·
// 600 the hero identity.
const kanit = Kanit({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-kanit",
  display: "swap",
});

/** Header, menu, search and footer in every language: they follow the URL (see Header/Footer). */
const chrome = Object.fromEntries(locales.map((l) => [l, chromeOf(dictionaries[l])])) as Record<
  Locale,
  ReturnType<typeof chromeOf>
>;

/**
 * Homepage, no remembered language, not a crawler → show the gateway. `?intro`
 * forces it (for testing). Runs before first paint, so there is no flash.
 */
const gatewayScript = `(function(){try{var d=document.documentElement,l=location,s=l.pathname.split("/")[1];if(s==="sq"||s==="en")d.lang=s;if(l.pathname!=="/")return;var chosen=/(?:^|;\\s*)${LOCALE_COOKIE}=(bs|sq|en)(?:;|$)/.test(document.cookie);var bot=/bot|crawl|spider|slurp|facebookexternalhit|lighthouse/i.test(navigator.userAgent);if(!bot&&(!chosen||/[?&]intro\\b/.test(l.search)))d.dataset.gateway="1"}catch(e){}})()`;

export function Shell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script below may set data-gateway on <html>.
    <html lang={dictionaries[locale].lang} className={kanit.variable} suppressHydrationWarning>
      <head>
        <script
          // Static, build-time code only: decides before first paint whether the
          // first-visit language gateway is shown (see components/i18n/Gateway.tsx).
          dangerouslySetInnerHTML={{ __html: gatewayScript }}
        />
      </head>
      <body>
        <SkipLink labels={{ bs: chrome.bs.ui.skip, sq: chrome.sq.ui.skip, en: chrome.en.ui.skip }} />
        <Header dicts={chrome} />
        <main id="main">{children}</main>
        <Footer dicts={chrome} />
        <Gateway />
      </body>
    </html>
  );
}
