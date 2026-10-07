import type { Metadata } from "next";
import { kontaktContent } from "@/content/kontakt";
import { Kontakt } from "@/components/kontakt/Kontakt";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = kontaktContent[locale];
  return pageMetadata("kontakt", locale, {
    title: c.title,
    description: `${c.heading}: ${c.tuzi.address}, ${c.tuzi.fields[0].value}`,
  });
}

/** Kontakt: Tuzi and the Rožaje department, and the map. */
export default async function Page({ params }: Props) {
  return <Kontakt locale={asLocale((await params).locale)} />;
}
