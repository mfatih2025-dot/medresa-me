import type { Metadata } from "next";
import { nastavaContent } from "@/content/nastava";
import { Nastava } from "@/components/nastava/Nastava";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = nastavaContent[locale];
  return pageMetadata("nastava", locale, { title: c.title, description: c.intro[0] });
}

/** Nastava i predmeti: the two pillars of the programme, and what they lead to. */
export default async function Page({ params }: Props) {
  return <Nastava locale={asLocale((await params).locale)} />;
}
