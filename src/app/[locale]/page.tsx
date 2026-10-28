import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { pdfModuleEnabled } from "@/server/admin/results/maintenance";
import { admissionText } from "@/admin/results/admissions";
import { Hero } from "@/components/sections/Hero";
import { HeroStage } from "@/components/sections/HeroStage";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import { SocialFeed } from "@/components/sections/SocialFeed";
import type { Metadata } from "next";
import { getDictionary } from "@/content";
import { publicHomeDictionary } from "@/server/public/news";
import { asLocale, pageMetadata, siteNames } from "@/i18n/metadata";
import { placeName } from "@/seo/config";
import { JsonLd, organization, website } from "@/seo/jsonld";

// The homepage is regenerated at most every 30 minutes (latest Instagram post).
export const revalidate = 1800;

type Props = { params: Promise<{ locale: string }> };

/** The homepage establishes the institution and its seat: Medresa „Mehmed Fatih“ – Tuzi, Crna Gora. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const { meta } = getDictionary(locale);
  return pageMetadata(null, locale, {
    title: `${siteNames[locale]} – ${placeName[locale]}`,
    absoluteTitle: true,
    description: meta.description,
  });
}

export default async function HomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const original = await publicHomeDictionary(locale);
  const closed = admissionText("closed", locale);
  const label = `${closed.before} ${closed.word}`;
  const dict = pdfModuleEnabled() ? original : { ...original, hero: { ...original.hero, admissions: { ...original.hero.admissions, label } }, admissions: { ...original.admissions, primary: { ...original.admissions.primary, label } } };
  return (
    <>
      <JsonLd data={[organization(locale), website(locale)]} />
      <HeroStage hero={<Hero dict={dict} resultsEnabled={pdfModuleEnabled()} />}>
        <News dict={dict} />
        <Alumni dict={dict} />
      </HeroStage>
      <LifeStack dict={dict} reference={locale === "bs" ? undefined : { heading: getDictionary("bs").life.stack.heading, text: getDictionary("bs").life.stack.text }} />
      <Closing dict={dict} />
      <SocialFeed dict={dict} />
    </>
  );
}
