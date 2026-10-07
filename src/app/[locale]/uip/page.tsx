import type { Metadata } from "next";
import { uipContent } from "@/content/uip";
import { Directory } from "@/components/uip/Directory";
import { Service } from "@/components/uip/Service";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const { ui } = uipContent[locale];
  return pageMetadata("uip", locale, { title: ui.title, description: ui.description });
}

/** Uprava i profesori: leadership, the faculty by person and by subject, and the educational service. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <article className="bg-paper text-ink">
      <Directory locations={uipContent[locale].locations} service={<Service locale={locale} />} />
    </article>
  );
}
