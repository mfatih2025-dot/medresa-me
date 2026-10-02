import { Admissions } from "@/components/sections/Admissions";
import { Alumni } from "@/components/sections/Alumni";
import { Closing } from "@/components/sections/Closing";
import { Education } from "@/components/sections/Education";
import { Glance } from "@/components/sections/Glance";
import { Hero } from "@/components/sections/Hero";
import { LifeStack } from "@/components/sections/LifeStack";
import { News } from "@/components/sections/News";
import { Social } from "@/components/sections/Social";
import { Story } from "@/components/sections/Story";
import { getDictionary } from "@/content";
import { defaultLocale } from "@/i18n/config";

export default function HomePage() {
  const dict = getDictionary(defaultLocale);
  return (
    <>
      <Hero dict={dict} />
      <News dict={dict} />
      <Alumni dict={dict} />
      <Glance dict={dict} />
      <Story dict={dict} />
      <Education dict={dict} />
      <LifeStack dict={dict} />
      <Social dict={dict} />
      <Admissions dict={dict} />
      <Closing dict={dict} />
    </>
  );
}
