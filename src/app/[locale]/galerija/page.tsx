import type { Metadata } from "next";
import { galerijaContent } from "@/content/galerija";
import { Galerija } from "@/components/galerija/Galerija";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = galerijaContent[locale];
  return pageMetadata("galerija", locale, { title: c.title, description: c.intro });
}

/** Galerija: the Medresa complex in its own photographs. */
export default async function Page({ params }: Props) {
  return <Galerija locale={asLocale((await params).locale)} />;
}
