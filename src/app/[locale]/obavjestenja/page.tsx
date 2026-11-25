import type { Metadata } from "next";
import { obavjestenjaText, sortedAnnouncements } from "@/content/obavjestenja";
import { Obavjestenja } from "@/components/obavjestenja/Obavjestenja";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { PageJsonLd } from "@/seo/jsonld";

type Props = { params: Promise<{ locale: string }> };

/** Shared links show the pinned announcement, in the page's language. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = obavjestenjaText[locale];
  const [lead] = sortedAnnouncements();
  return pageMetadata("obavjestenja", locale, {
    title: lead ? `${t.title}: ${lead.title[locale]}` : t.title,
    description: lead ? lead.summary[locale] : t.description,
    image: lead ? { url: lead.share[locale].src, width: lead.share[locale].width, height: lead.share[locale].height, alt: lead.title[locale] } : undefined,
  });
}

/** Obavještenja: the Medresa's official announcements, pinned first. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <>
      <PageJsonLd id="obavjestenja" locale={locale} />
      <Obavjestenja locale={locale} />
    </>
  );
}
