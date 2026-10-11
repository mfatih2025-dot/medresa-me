import type { Metadata } from "next";
import { donacijeContent } from "@/content/donacije";
import { Donacije } from "@/components/donacije/Donacije";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { PageJsonLd } from "@/seo/jsonld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = donacijeContent[locale];
  return pageMetadata("donacije", locale, { title: c.title, description: c.intro[0] });
}

/** Donacije: why supporting the Medresa matters, and how to do it. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <>
      <PageJsonLd id="donacije" locale={locale} />
      <Donacije locale={locale} />
    </>
  );
}
