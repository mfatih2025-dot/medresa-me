import type { Metadata } from "next";
import { tiuContent } from "@/content/tiu";
import { Tiu } from "@/components/tiu/Tiu";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { PageJsonLd } from "@/seo/jsonld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = tiuContent[locale];
  return pageMetadata("tiu", locale, { title: c.title, description: c.intro });
}

/** Takmičenja i uspjesi: the students' achievements, year by year. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <>
      <PageJsonLd id="tiu" locale={locale} />
      <Tiu locale={locale} />
    </>
  );
}
