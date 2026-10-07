import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";
import type { UpisDocument } from "@/content/upis";
import type { ExamPublication } from "./model";

/** Future read adapter; it does not connect to or modify public admissions content. */
export function examPublicData(exam: ExamPublication, locale: Locale): { document: UpisDocument; hero: { kicker: string; label: string; href: string } } {
  if (exam.status !== "published" || !exam.publishedAt || exam.document.mime !== "application/pdf" || !/^https:\/\//.test(exam.document.url)) throw new Error("Only an approved published PDF can be exposed publicly");
  if (!exam.title[locale].trim() || !exam.action[locale].trim() || !exam.hero.kicker[locale].trim() || !exam.hero.label[locale].trim()) throw new Error("Missing localized exam content");
  return {
    document: { title: exam.title[locale], action: exam.action[locale], href: exam.document.url },
    hero: { kicker: exam.hero.kicker[locale], label: exam.hero.label[locale], href: pathFor("upis", locale) },
  };
}
