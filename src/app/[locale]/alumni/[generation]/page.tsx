import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  alumniContent,
  generationBySlug,
  generationPath,
  generationPaths,
  generationSlug,
  generations,
} from "@/content/alumni";
import { GenerationPage } from "@/components/alumni/GenerationPage";
import { asLocale, localizedMetadata } from "@/i18n/metadata";
import { pathFor } from "@/i18n/routes";
import { breadcrumbs, JsonLd } from "@/seo/jsonld";

type Params = { locale: string; generation: string };
type Props = { params: Promise<Params> };

/*
 * A generation's own page, in each language:
 *   /alumni/generacija-vii  ·  /sq/alumni/gjenerata-vii  ·  /en/alumni/generation-vii
 * The printed QR code on each pano opens the Bosnian one; the language switch
 * keeps the generation (hreflang alternates). A generation reached by another
 * language's slug is sent to this language's (308); anything else is a 404.
 */

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}): Pick<Params, "generation">[] {
  const locale = asLocale(params.locale);
  return generations.map((g) => ({ generation: generationSlug(g, locale) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, generation: slug } = await params;
  const locale = asLocale(l);
  const found = generationBySlug(slug, locale);
  if (!found?.exact) return {};
  const g = found.generation;
  const a = alumniContent[locale];
  return localizedMetadata(generationPaths(g), locale, {
    title: `${a.label} ${g.roman} · ${a.title}`,
    description: a.intro,
    image: {
      url: g.pano.src,
      width: g.pano.width,
      height: g.pano.height,
      alt: `${a.ui.pano}: ${a.label} ${g.roman}`,
    },
  });
}

export default async function Page({ params }: Props) {
  const { locale: l, generation: slug } = await params;
  const locale = asLocale(l);
  const found = generationBySlug(slug, locale);
  if (!found) notFound();
  if (!found.exact) permanentRedirect(generationPath(found.generation, locale));
  const g = found.generation;
  const a = alumniContent[locale];
  return (
    <>
      <JsonLd
        data={breadcrumbs(locale, [
          { name: a.title, path: pathFor("alumni", locale) },
          { name: `${a.label} ${g.roman}`, path: generationPath(g, locale) },
        ])}
      />
      <GenerationPage locale={locale} number={g.number} />
    </>
  );
}
