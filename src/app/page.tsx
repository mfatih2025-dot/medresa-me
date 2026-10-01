import { Admissions } from "@/components/sections/Admissions";
import { Closing } from "@/components/sections/Closing";
import { Education } from "@/components/sections/Education";
import { Generations } from "@/components/sections/Generations";
import { Glance } from "@/components/sections/Glance";
import { Hero } from "@/components/sections/Hero";
import { Life } from "@/components/sections/Life";
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
      <Glance dict={dict} />
      <Story dict={dict} />
      <Education dict={dict} />
      <Life dict={dict} />
      <Generations dict={dict} />
      <Social dict={dict} />
      <Admissions dict={dict} />
      <Closing dict={dict} />
    </>
  );
}
