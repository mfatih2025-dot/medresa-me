import type { Metadata } from "next";
import { upisContent } from "@/content/upis";
import { Upis } from "@/components/upis/Upis";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = upisContent[locale];
  return pageMetadata("upis", locale, {
    title: c.title.join(" "),
    description: `${c.status.before} ${c.status.word}${c.status.after}`,
  });
}

/** Upis i prijemni: the admission status and its documents. */
export default async function Page({ params }: Props) {
  return <Upis locale={asLocale((await params).locale)} />;
}
