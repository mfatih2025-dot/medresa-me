import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/app/_shell/Shell";
import { getDictionary } from "@/content";
import { site } from "@/content/site";
import { isLocale, locales } from "@/i18n/config";
import { asLocale, siteNames } from "@/i18n/metadata";
import { googleVerification, indexable, ogLocale, siteUrl } from "@/seo/config";

/**
 * The root layout, one per language: every page is served with <html lang>
 * in its own language. Every page exists in each locale; an unknown locale is
 * a 404 (below). Pages under a locale may still answer addresses not generated
 * ahead — the news pages redirect another language's article slug, and
 * old-site article addresses, to the right page.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

/** Defaults for every page in a language; each page sets its own title, description, canonical and alternates. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const { meta } = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: meta.title, template: `%s · ${siteNames[locale]}` },
    description: meta.description,
    applicationName: siteNames[locale],
    ...(indexable
      ? { robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { robots: { index: false, follow: false } }),
    openGraph: { siteName: siteNames[locale], locale: ogLocale[locale], type: "website" },
    twitter: { card: "summary_large_image" },
    icons: { icon: site.logo.src, apple: site.logo.src },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#f3f4f3",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Shell locale={locale}>{children}</Shell>;
}
