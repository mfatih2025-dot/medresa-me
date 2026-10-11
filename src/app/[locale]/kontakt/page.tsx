import type { Metadata } from "next";
import { getDictionary } from "@/content";
import { site } from "@/content/site";
import { kontaktContent } from "@/content/kontakt";
import { Kontakt } from "@/components/kontakt/Kontakt";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { PageJsonLd } from "@/seo/jsonld";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = kontaktContent[locale];
  const { contact } = getDictionary(locale);
  return pageMetadata("kontakt", locale, {
    title: c.title,
    // „Kontaktirajte nas: Donji Milješ, Tuzi, Crna Gora · +382 20 513 363 · e-mail“ in each language.
    description: `${c.heading}: ${contact.address.join(", ")} · ${site.contact.phone} · ${site.contact.email}`,
  });
}

/** Kontakt: Tuzi and the Rožaje department, and the map. */
export default async function Page({ params }: Props) {
  const locale = asLocale((await params).locale);
  return (
    <>
      <PageJsonLd id="kontakt" locale={locale} />
      <Kontakt locale={locale} />
    </>
  );
}
