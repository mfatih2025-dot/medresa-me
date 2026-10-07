import type { Metadata } from "next";
import { misijaContent } from "@/content/misija";
import { Misija } from "@/components/misija/Misija";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = misijaContent[locale];
  return pageMetadata("misija", locale, { title: c.title, description: c.mission.paragraphs[0] });
}

/** Misija i vizija: the institution's statement of purpose, signed by the Reis. */
export default async function Page({ params }: Props) {
  return <Misija locale={asLocale((await params).locale)} />;
}
