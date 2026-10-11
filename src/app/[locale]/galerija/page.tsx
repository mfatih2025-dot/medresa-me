import type { Metadata } from "next";
import { galerijaContent } from "@/content/galerija";
import { Galerija } from "@/components/galerija/Galerija";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { PageJsonLd } from "@/seo/jsonld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = galerijaContent[locale];
  return pageMetadata("galerija", locale, { title: c.title, description: c.intro });
}

/** Galerija: the Medresa complex in its own photographs. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <>
      <PageJsonLd id="galerija" locale={locale} />
      <Galerija locale={locale} />
    </>
  );
}
