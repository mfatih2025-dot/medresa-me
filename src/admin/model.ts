import type { Locale } from "@/i18n/config";
import type { NewsPhoto, NewsTopic } from "@/content/vijesti/types";

export type LocalizedText = Record<Locale, string>;
export type EditorialStatus = "draft" | "ready" | "published";
export const statusLabels: Record<EditorialStatus, string> = {
  draft: "Nacrt", ready: "Spremno", published: "Objavljeno",
};

/** One ordered structure shared by every language; no public styling fields. */
export type ContentBlock =
  | { id: string; type: "text" | "subheading" | "quote"; text: LocalizedText }
  | { id: string; type: "image"; assetId: string };

export type SharedImage = NewsPhoto & { id: string };
export type Review = { approved: boolean; reviewedRevision: number | null };
export type NewsDraft = {
  id: string;
  revision: number;
  status: EditorialStatus;
  date: string;
  topic: NewsTopic;
  title: LocalizedText;
  slug: LocalizedText;
  lead: LocalizedText;
  blocks: ContentBlock[];
  images: SharedImage[];
  coverImageId: string | null;
  review: Record<Locale, Review>;
  /** Immutable import provenance. Never an editor styling control. */
  legacy?: { original: import("@/content/vijesti/types").NewsArticle; blocks: ContentBlock[]; imageIds: string[] };
};

export type ManagedArticle = {
  draft: NewsDraft; archivedAt: string | null; deletedAt: string | null;
  createdAt: string | null; updatedAt: string | null; publishedAt: string | null;
  publishedRevision: number | null; source: "database" | "static";
  publications?: Partial<Record<Locale, LocalePublication>>;
  localePublishingReady?: boolean;
};
export type LocalePublication = { revision: number; publishedAt: string | null; snapshot: import("@/content/vijesti/types").NewsArticle };
export type BackendState = { state: "connected" | "not-connected" | "error"; message: string; writable: boolean; localePublishingReady?: boolean };
export type NewsListRow = {
  id: string; revision: number; title: LocalizedText; date: string; status: EditorialStatus;
  cover: SharedImage | null; complete: Record<Locale, boolean>;
  archivedAt: string | null; deletedAt: string | null; source: "database" | "static";
  localeStatus: Record<Locale, EditorialStatus>;
};

export function emptyText(): LocalizedText { return { bs: "", sq: "", en: "" }; }
export function newDraft(id: string): NewsDraft {
  return {
    id, revision: 0, status: "draft", date: "", topic: "school",
    title: emptyText(), slug: emptyText(), lead: emptyText(), blocks: [], images: [],
    coverImageId: null,
    review: { bs: { approved: false, reviewedRevision: null }, sq: { approved: false, reviewedRevision: null }, en: { approved: false, reviewedRevision: null } },
  };
}

/** Content used by one locale; unrelated translation edits cannot invalidate its review. */
export function localeContent(draft: NewsDraft, locale: Locale): string {
  return JSON.stringify({ title: draft.title[locale], slug: draft.slug[locale], lead: draft.lead[locale], date: draft.date, topic: draft.topic,
    cover: draft.coverImageId, blocks: draft.blocks.map(b => b.type === "image" ? b : { id: b.id, type: b.type, text: b.text[locale] }),
    images: draft.images.map(({ alt, ...image }) => ({ ...image, alt: alt[locale] })) });
}

/** Shared changes invalidate every affected locale; unchanged locales carry review forward. */
export function revise(draft: NewsDraft, patch: Partial<NewsDraft>): NewsDraft {
  const next = { ...draft, ...patch, revision: draft.revision + 1, status: "draft" as const, review: newDraft(draft.id).review };
  for (const l of ["bs", "sq", "en"] as const) if (draft.review[l].approved && draft.review[l].reviewedRevision === draft.revision && localeContent(draft, l) === localeContent(next, l)) {
    next.review[l] = { approved: true, reviewedRevision: next.revision };
  }
  return next;
}

export function moveBlock(blocks: ContentBlock[], from: number, to: number): ContentBlock[] {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const result = [...blocks];
  const [block] = result.splice(from, 1);
  result.splice(to, 0, block);
  return result;
}

export type ExamPublication = {
  id: string; status: EditorialStatus; schoolYear: string;
  document: { assetId: string; url: string; mime: "application/pdf"; bytes: number };
  title: LocalizedText; action: LocalizedText;
  hero: { kicker: LocalizedText; label: LocalizedText };
  publishedAt: string | null;
};
export type Campaign = {
  id: string; status: EditorialStatus;
  kind: "kurban" | "bajram" | "admissions" | "campaign" | "announcement";
  title: LocalizedText; text: LocalizedText; link: LocalizedText;
  startsAt: string | null; endsAt: string | null;
};
export type AnalyticsPeriod = 7 | 30 | 60 | 90;
export type AnalyticsSource = "website" | "instagram" | "facebook" | "youtube";
export type AnalyticsResult =
  | { state: "not-connected" | "loading" | "empty"; source: AnalyticsSource }
  | { state: "error"; source: AnalyticsSource; message: string }
  | { state: "ready"; source: AnalyticsSource; period: AnalyticsPeriod; total: number; daily: { date: string; visits: number }[]; today: number | null; previousDay: number | null };
