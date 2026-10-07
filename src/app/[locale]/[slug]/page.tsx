import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getDictionary } from "@/content";
import { articleByAnySlug, articlePath } from "@/content/vijesti";
import { pageTitles } from "@/content/site";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { isPageId, pathFor, type PageId } from "@/i18n/routes";

type Params = { locale: string; slug: string };

/** Pages not built yet; every other page has its own route (app/[locale]/<page>/page.tsx). */
const placeholders: PageId[] = ["kucni-red"];

export function generateStaticParams(): Pick<Params, "slug">[] {
  return placeholders.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  if (!isPageId(slug)) return {};
  return pageMetadata(slug, locale, { title: pageTitles[locale][slug] });
}

/** Placeholder for the pages still to be built (Kućni red). */
export default async function PlaceholderPage({ params }: { params: Promise<Params> }) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  if (!isPageId(slug)) {
    // An article's address on the old site (medresa.me/<slug>/, /sq/<slug>/, /en/<slug>/) → its page here.
    const article = articleByAnySlug(slug);
    if (article) permanentRedirect(articlePath(article, locale));
    notFound();
  }
  if (!placeholders.includes(slug)) notFound();
  const { ui } = getDictionary(locale);
  return (
    <section className="geo bg-ivory pb-32 pt-36 md:pt-48">
      <div className="wrap">
        <p className="eyebrow mb-6 text-gold-deep">{ui.comingSoon}</p>
        <h1 className="display h-section text-green">{pageTitles[locale][slug]}</h1>
        <p className="lead mt-8 max-w-[32em] text-ink-soft">{ui.comingSoonBody}</p>
        <Link href={pathFor(null, locale)} className="btn btn-green mt-10">
          {ui.backHome}
        </Link>
      </div>
    </section>
  );
}
