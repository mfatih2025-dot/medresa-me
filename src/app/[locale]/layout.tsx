import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, locales } from "@/i18n/config";

/**
 * Every page exists in each locale; an unknown locale is a 404 (below). Pages under a
 * locale may still answer addresses not generated ahead — the news pages redirect another
 * language's article slug, and old-site article addresses, to the right page.
 */
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
