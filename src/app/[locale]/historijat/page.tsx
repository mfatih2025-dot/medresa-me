import type { Metadata } from "next";
import { historijatContent } from "@/content/historijat";
import { History } from "@/components/historijat/History";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = historijatContent[locale];
  return pageMetadata("historijat", locale, { title: c.title, description: c.chapters.founding.text });
}

/** Historijat: the history of the Medresa, told along its own timeline. */
export default async function Page({ params }: Props) {
  return <History locale={asLocale((await params).locale)} />;
}
