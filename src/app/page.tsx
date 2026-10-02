import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import { getDictionary } from "@/content";
import { defaultLocale } from "@/i18n/config";

export default function HomePage() {
  const dict = getDictionary(defaultLocale);
  return (
    <>
      <Hero dict={dict} />
      <News dict={dict} />
      <Alumni dict={dict} />
      <LifeStack dict={dict} />
      <Closing dict={dict} />
    </>
  );
}
