import type { Locale } from "@/i18n/config";

/*
 * The shape of one news article — the contract between whoever publishes news
 * (today: the migrated archive in this folder; later: the Admin) and the one
 * fixed template that renders it. An editor supplies only what is here; the
 * design is never part of the content.
 *
 * One article = one identity, shared photographs and a date, with a version
 * in each language. Bosnian is written first; Albanian and English are its
 * translations (in the Admin: machine drafts, reviewed by a person, then
 * published together).
 */

/** A photograph of the article: uploaded once, shared by all languages. */
export type NewsPhoto = {
  /** Path under /public (migrated archive) or a storage URL (Admin uploads). */
  src: string;
  width: number;
  height: number;
  /** A tiny blurred preview (data URL) shown while the photograph loads. */
  blur?: string;
  /** Described in each language. */
  alt: Record<Locale, string>;
  /** CSS object-position for crops in listings, when the subject is off centre. */
  focus?: string;
  /**
   * A graphic rather than a photograph (a poster, an anniversary card):
   * shown whole, never cropped, and never used as a listing's photographic moment.
   */
  graphic?: boolean;
};

/** One language version of an article. */
export type NewsVersion = {
  /** The article's address in this language (after /vijesti/, /sq/lajme/, /en/news/). */
  slug: string;
  title: string;
  /** Optional standfirst, when the author wrote one; set larger above the body. */
  lead?: string;
  /**
   * The text, in a small, editor-safe Markdown subset (see lib/newsBody.ts):
   * paragraphs, "## " subheadings, "- " / "1. " lists, "> " quotations,
   * **strong**, *emphasis*, [links](url), and "![](n)" to place photograph n
   * (1-based) inside the text. Photographs not placed in the text follow it.
   */
  body: string;
};

export type NewsArticle = {
  /** Stable identity, independent of language and title: yyyy-mm-dd-key. */
  id: string;
  /** Publication date, yyyy-mm-dd. Orders the archive (newest first). */
  date: string;
  /** In order; the first is the lead photograph. May be empty. */
  photos: NewsPhoto[];
  /**
   * Topic for the homepage's story column (a fixed list, chosen by the editor;
   * see topics in ./index.ts). Never shown on the news pages.
   */
  topic: NewsTopic;
  bs: NewsVersion;
  sq: NewsVersion;
  en: NewsVersion;
  /** Where the article was first published (migrated archive only). */
  source?: string;
};

export type NewsTopic = "visits" | "donations" | "school" | "events" | "notices" | "sport";
