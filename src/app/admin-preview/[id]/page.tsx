import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { articles } from "@/content/vijesti";
import { Article } from "@/components/vijesti/Article";
import { isLocale } from "@/i18n/config";
import { cookieName, verifySession } from "@/server/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privatni pregled članka", robots: { index: false, follow: false }, alternates: { canonical: null, languages: {} } };
/** The actual locked renderer, not an approximation. Read-only existing articles in Phase 1. */
export default async function AdminPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ locale?: string }> }) {
  if (!verifySession((await cookies()).get(cookieName())?.value)) redirect("/admin/login");
  const { id } = await params;
  const { locale: requested } = await searchParams;
  const locale = isLocale(requested) ? requested : "bs";
  const article = articles.find(a => a.id === id);
  if (!article) notFound();
  return <div lang={locale}><Article a={article} locale={locale} /></div>;
}
