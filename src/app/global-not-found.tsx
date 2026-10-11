import type { Metadata } from "next";
import { Shell } from "@/app/_shell/Shell";
import NotFound from "@/app/[locale]/not-found";
import { siteNames } from "@/i18n/metadata";
import { dictionaries } from "@/content";

/*
 * A 404 for addresses outside every route (the locale root layout handles the
 * rest): the same page as app/[locale]/not-found.tsx, in the same document,
 * with a real 404 status and kept out of search results.
 */
export const metadata: Metadata = {
  title: `${dictionaries.bs.ui.notFound} · ${siteNames.bs}`,
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <Shell locale="bs">
      <NotFound />
    </Shell>
  );
}
