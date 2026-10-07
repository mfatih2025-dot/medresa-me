import type { Locale } from "@/i18n/config";
import type { AnalyticsPeriod, AnalyticsResult, AnalyticsSource, Campaign, ExamPublication, NewsDraft, SharedImage } from "./model";
import type { TranslationDraft } from "./translation";

/** No adapter is connected in Phase 1. Implement these only in server modules. */
export interface NewsRepository {
  getDraft(id: string): Promise<NewsDraft | null>;
  saveDraft(draft: NewsDraft, expectedRevision: number): Promise<NewsDraft>;
  slugAvailable(slug: string, locale: Locale, excludingId: string): Promise<boolean>;
  /** Atomic three-language snapshot + audit event; rerun validation and authorization. */
  publishAll(id: string, expectedRevision: number, actorId: string): Promise<void>;
}
export interface MediaStorage {
  uploadImage(file: Blob, actorId: string): Promise<SharedImage>;
  uploadPdf(file: Blob, actorId: string): Promise<ExamPublication["document"]>;
}
export interface TranslationProvider {
  /** Server-side only; preserve IDs/order/assets and names. Return unapproved text drafts. */
  draftFromBosnian(draft: NewsDraft, terminology: readonly string[]): Promise<TranslationDraft>;
}
export interface CampaignRepository { saveDraft(campaign: Campaign, actorId: string): Promise<void> }
export interface ExamRepository { publish(document: ExamPublication, actorId: string): Promise<void> }
export interface AnalyticsProvider { read(source: AnalyticsSource, period: AnalyticsPeriod): Promise<AnalyticsResult> }
