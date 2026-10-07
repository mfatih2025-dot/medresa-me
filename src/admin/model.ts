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

/** Any content/ordering change invalidates review. A backend must enforce this too. */
export function revise(draft: NewsDraft, patch: Partial<NewsDraft>): NewsDraft {
  return { ...draft, ...patch, revision: draft.revision + 1, status: "draft", review: newDraft(draft.id).review };
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
