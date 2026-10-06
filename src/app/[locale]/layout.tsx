import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, locales, translated } from "@/i18n/config";
import { LocaleNotice } from "@/components/i18n/LocaleNotice";

/** Every page exists in each locale; anything else under the first segment is a 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Untranslated locales show Bosnian content: keep them out of search results;
  // each page's canonical already points to its Bosnian URL.
  return isLocale(locale) && !translated.includes(locale) ? { robots: { index: false, follow: true } } : {};
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      {children}
      {!translated.includes(locale) && <LocaleNotice locale={locale} />}
    </>
  );
}
