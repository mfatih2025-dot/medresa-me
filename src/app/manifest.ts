import type { MetadataRoute } from "next";
import { getDictionary } from "@/content";
import { site } from "@/content/site";
import { defaultLocale } from "@/i18n/config";

export default function manifest(): MetadataRoute.Manifest {
  const { meta, lang } = getDictionary(defaultLocale);
  return {
    name: meta.title,
    short_name: site.shortName,
    description: meta.description,
    lang,
    start_url: "/",
    display: "browser",
    background_color: "#f7f3ea",
    theme_color: "#f3f4f3",
    icons: [{ src: site.logo.src, sizes: `${site.logo.width}x${site.logo.height}`, type: "image/png" }],
  };
}
