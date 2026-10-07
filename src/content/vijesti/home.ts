import type { Locale } from "@/i18n/config";
import type { Img } from "../bs";
import { articlePath, articles, excerpt, formatDate, imageOf, topicLabels } from "./index";

/** How many stories the homepage's news section shows (the lead and one beside it, then the notice). */
const HOME_COUNT = 2;

/**
 * The homepage's news items, newest first, in the shape its (unchanged) news
 * section reads. A story without any image falls back to a photograph of the
 * Medresa, flagged as a placeholder.
 */
export function homeNews(locale: Locale, fallbacks: readonly Img[]) {
  return articles.slice(0, HOME_COUNT).map((a, i) => {
    const v = a[locale];
    const photo = imageOf(a);
    const image: Img = photo
      ? { src: photo.src, alt: photo.alt[locale], position: photo.focus ?? "50% 50%" }
      : fallbacks[i % fallbacks.length];
    return {
      category: topicLabels[locale][a.topic],
      date: a.date,
      dateLabel: formatDate(a.date, locale),
      title: v.title,
      excerpt: excerpt(v, 200),
      href: articlePath(a, locale),
      image,
    };
  });
}
