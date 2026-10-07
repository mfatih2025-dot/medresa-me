import type { Metadata } from "next";
import { oiuContent } from "@/content/oiu";
import { Oiu } from "@/components/oiu/Oiu";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = oiuContent[locale];
  return pageMetadata("oiu", locale, { title: c.title, description: c.intro[0] });
}

/** Objekat i uslovi: the building and its spaces, in photographs. */
export default async function Page({ params }: Props) {
  return <Oiu locale={asLocale((await params).locale)} />;
}
