"use client";

import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

/** The first focusable element: „skip to content“ in the page's language. */
export function SkipLink({ labels }: { labels: Record<Locale, string> }) {
  const locale = useLocale();
  return (
    <a
      href="#main"
      className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-gold px-5 py-3 text-sm font-medium text-green-deep transition-transform focus:translate-y-0"
    >
      {labels[locale]}
    </a>
  );
}
