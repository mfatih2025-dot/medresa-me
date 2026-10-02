import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { HeroStage } from "@/components/sections/HeroStage";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import type { Metadata } from "next";
import { getDictionary } from "@/content";
import { defaultLocale } from "@/i18n/config";

// Canonical only here: set in the layout it would be inherited by every subpage.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // A page-level openGraph replaces the layout's, so the shared fields are repeated.
  openGraph: {
    url: "/",
    siteName: getDictionary(defaultLocale).meta.title,
    type: "website",
    locale: "bs_BA",
    images: [{ url: "/images/hero-campus.jpg", width: 1627, height: 1080 }],
  },
};

export default function HomePage() {
  const dict = getDictionary(defaultLocale);
  return (
    <>
      <HeroStage hero={<Hero dict={dict} />}>
        <News dict={dict} />
        <Alumni dict={dict} />
      </HeroStage>
      <LifeStack dict={dict} />
      <Closing dict={dict} />
    </>
  );
}
