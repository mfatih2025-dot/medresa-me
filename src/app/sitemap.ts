import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { locales } from "@/i18n/config";
import { alternatesFor, pageIds, pathFor, type PageId } from "@/i18n/routes";

/*
 * Every public page in its three languages, each entry listing the others as
 * alternates (hreflang). Pages still waiting for their content (Kućni red) are
 * left out until they are written. Groundwork for the final SEO pass.
 */
const pending: PageId[] = ["kucni-red"];

export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (path: string) => new URL(path, site.url).toString();
  const ids: (PageId | null)[] = [null, ...pageIds.filter((id) => !pending.includes(id))];
  return ids.flatMap((id) => {
    const languages = Object.fromEntries(
      Object.entries(alternatesFor(id)).map(([l, path]) => [l, abs(path)]),
    );
    return locales.map((locale) => ({
      url: abs(pathFor(id, locale)),
      alternates: { languages },
    }));
  });
}
