import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { LOCALE_COOKIE } from "@/i18n/config";
import { Gateway } from "@/components/i18n/Gateway";
import { Header } from "@/components/layout/Header";
import { chromeOf, dictionaries, getDictionary } from "@/content";
import { SkipLink } from "@/components/i18n/SkipLink";
import { site } from "@/content/site";
import { defaultLocale, locales } from "@/i18n/config";
import "./globals.css";
import { CampaignPopup } from "@/components/campaigns/CampaignPopup";

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

const dict = getDictionary(defaultLocale);

/** Header, menu, search and footer in every language: they follow the URL (see Header/Footer). */
const chrome = Object.fromEntries(locales.map((l) => [l, chromeOf(dictionaries[l])])) as Record<
  (typeof locales)[number],
  ReturnType<typeof chromeOf>
>;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: dict.meta.title, template: `%s · ${site.name}` },
  description: dict.meta.description,
  applicationName: site.name,
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    siteName: dict.meta.title,
    locale: "bs_BA",
    type: "website",
    images: [{ url: "/images/hero-campus.jpg", width: 1627, height: 1080 }],
  },
  twitter: {
    card: "summary_large_image",
    title: dict.meta.title,
    description: dict.meta.description,
    images: ["/images/hero-campus.jpg"],
  },
  icons: { icon: site.logo.src, apple: site.logo.src },
};

/**
 * Structured data: the Medresa as an educational organization. Branded for
 * Montenegro; the postal address is the school's seat in Tuzi.
 */
const organization = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "HighSchool"],
  name: site.name,
  alternateName: dict.meta.title,
  description: dict.meta.description,
  url: site.url,
  logo: new URL(site.logo.src, site.url).href,
  image: new URL("/images/hero-campus.jpg", site.url).href,
  foundingDate: "2008-10-06",
  telephone: site.contact.phone,
  email: site.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Donji Milješ",
    addressLocality: "Tuzi",
    addressCountry: "ME",
  },
  areaServed: { "@type": "Country", name: "Crna Gora" },
  sameAs: site.social.map((s) => s.href),
};

export const viewport: Viewport = {
  themeColor: "#f3f4f3",
  width: "device-width",
  initialScale: 1,
};

/**
 * Homepage, no remembered language, not a crawler → show the gateway. `?intro`
 * forces it (for testing). Runs before first paint, so there is no flash.
 */
const gatewayScript = `(function(){try{var d=document.documentElement,l=location,s=l.pathname.split("/")[1];if(s==="sq"||s==="en")d.lang=s;if(l.pathname!=="/")return;var chosen=/(?:^|;\\s*)${LOCALE_COOKIE}=(bs|sq|en)(?:;|$)/.test(document.cookie);var bot=/bot|crawl|spider|slurp|facebookexternalhit|lighthouse/i.test(navigator.userAgent);if(!bot&&(!chosen||/[?&]intro\\b/.test(l.search)))d.dataset.gateway="1"}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script below may set data-gateway on <html>.
    <html lang={dict.lang} className={kanit.variable} suppressHydrationWarning>
      <head>
        <script
          // Static, build-time code only: decides before first paint whether the
          // first-visit language gateway is shown (see components/i18n/Gateway.tsx).
          dangerouslySetInnerHTML={{ __html: gatewayScript }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Static, build-time data only (no user input).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
        />
        <SkipLink labels={{ bs: chrome.bs.ui.skip, sq: chrome.sq.ui.skip, en: chrome.en.ui.skip }} />
        <Header dicts={chrome} />
        <main id="main">{children}</main>
        <Footer dicts={chrome} />
        <Gateway />
        {process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel" && <CampaignPopup />}
      </body>
    </html>
  );
}
