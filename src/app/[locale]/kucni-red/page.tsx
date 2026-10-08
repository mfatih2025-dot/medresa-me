import type { Metadata } from "next";
import { kucniRedContent } from "@/content/kucni-red";
import { KucniRed } from "@/components/kucni-red/KucniRed";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = kucniRedContent[locale];
  return pageMetadata("kucni-red", locale, { title: c.title, description: c.description });
}

/** Kućni red: the official house rules, rules 1–15. */
export default async function Page({ params }: Props) {
  return <KucniRed locale={asLocale((await params).locale)} />;
}
