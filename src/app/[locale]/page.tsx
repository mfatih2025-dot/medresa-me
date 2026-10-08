import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { HeroStage } from "@/components/sections/HeroStage";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import { SocialFeed } from "@/components/sections/SocialFeed";
import type { Metadata } from "next";
import { publicHomeDictionary } from "@/server/public/news";
import { getDictionary } from "@/content";
import { asLocale, pageMetadata } from "@/i18n/metadata";

// The homepage is regenerated at most every 30 minutes (latest Instagram post).
export const revalidate = 1800;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const { meta } = getDictionary(locale);
  const m = pageMetadata(null, locale, { description: meta.description });
  return {
    ...m,
    title: { absolute: meta.title },
    openGraph: { ...m.openGraph, title: meta.title, siteName: meta.title },
  };
}

export default async function HomePage({ params }: Props) {
  const dict = await publicHomeDictionary(asLocale((await params).locale));
  return (
    <>
      <HeroStage hero={<Hero dict={dict} />}>
        <News dict={dict} />
        <Alumni dict={dict} />
      </HeroStage>
      <LifeStack dict={dict} />
      <Closing dict={dict} />
      <SocialFeed dict={dict} />
    </>
  );
}
