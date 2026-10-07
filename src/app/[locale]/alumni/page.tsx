import type { Metadata } from "next";
import { alumniContent } from "@/content/alumni";
import { Alumni } from "@/components/alumni/Alumni";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = alumniContent[locale];
  return pageMetadata("alumni", locale, { title: c.title, description: c.intro });
}

/** Alumni: every generation of the Medresa, each with its pano. */
export default async function Page({ params }: Props) {
  return <Alumni locale={asLocale((await params).locale)} />;
}
