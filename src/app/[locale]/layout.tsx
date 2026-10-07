import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, locales } from "@/i18n/config";

/** Every page exists in each locale; anything else under the first segment is a 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
  // The page's language for assistive technology and crawlers; `contents` keeps it out of layout.
  return (
    <div lang={locale} className="contents">
      {children}
    </div>
  );
}
