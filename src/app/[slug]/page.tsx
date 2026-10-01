import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content";
import { pages, pageSlugs, type PageSlug } from "@/content/site";
import { defaultLocale } from "@/i18n/config";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return pageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: pages[slug as PageSlug]?.title ?? "Medresa" };
}

/**
 * Placeholder for the real pages (Historijat, Upis, Alumni, Kontakt …). Each
 * slug mirrors the current medresa.me route; replace per page as it is built.
 */
export default async function PlaceholderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = pages[slug as PageSlug];
  if (!page) notFound();
  const { ui } = getDictionary(defaultLocale);
  return (
    <section className="geo bg-ivory pb-32 pt-36 md:pt-48">
      <div className="wrap">
        <p className="eyebrow mb-6 text-gold-deep">{ui.comingSoon}</p>
        <h1 className="display h-section text-green">{page.title}</h1>
        <p className="lead mt-8 max-w-[32em] text-ink-soft">{ui.comingSoonBody}</p>
        <Link href="/" className="btn btn-green mt-10">
          {ui.backHome}
        </Link>
      </div>
    </section>
  );
}
