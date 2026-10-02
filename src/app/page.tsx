import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { HeroStage } from "@/components/sections/HeroStage";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import { getDictionary } from "@/content";
import { defaultLocale } from "@/i18n/config";

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
