"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";

/** The 404 text in the language of the URL that was asked for. */
export function NotFoundBody({ text }: { text: Record<Locale, { title: string; back: string }> }) {
  const locale = useLocale();
  return (
    <div className="wrap">
      <p className="eyebrow mb-6 text-gold-deep">404</p>
      <h1 className="display h-section text-green">{text[locale].title}</h1>
      <Link href={pathFor(null, locale)} className="btn btn-green mt-10">
        {text[locale].back}
      </Link>
    </div>
  );
}
