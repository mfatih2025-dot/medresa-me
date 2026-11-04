import type { Locale } from "@/i18n/config";
import { previewAllowed, seasonalSettings } from "./config";
import { collectionName, hadithReady, hadiths } from "./hadiths";
import { RamadanCardBorder } from "./RamadanCardBorder";

const labels: Record<Locale, { region: string; label: string; day: string; draft: string }> = {
  bs: { region: "Ramazanski hadis dana", label: "Ramazanski hadis", day: "Dan", draft: "Nacrt prijevoda – za stručni pregled" },
  sq: { region: "Hadithi i ditës së ramazanit", label: "Hadithi i ramazanit", day: "Dita", draft: "Draft përkthimi – për shqyrtim" },
  en: { region: "Ramadan hadith of the day", label: "Ramadan hadith", day: "Day", draft: "Draft translation – for review" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/*
 * Ramadan edition, in the hero: the hadith of the day, in place of the admissions
 * card (which stays in the page, unchanged, and returns whenever this is not shown).
 *
 * Every day's hadith is in the page; the pre-paint script picks today's
 * (data-ramadan-day on <html>, from the Ramadan calendar in src/seasonal/config.ts)
 * and the stylesheet shows that one alone. So the day is the same on the server and
 * in the browser, the same in every language, and nothing is decided after the
 * page has drawn. The whole hadith is shown: the card grows upward with its text.
 *
 * On production it appears only once every hadith and its translation in this
 * language are approved (hadithReady); previews show the drafts, marked as such.
 */
export function RamadanHadith({ locale }: { locale: Locale }) {
  const preview = previewAllowed();
  if (!preview && !hadithReady(locale)) return null;
  const t = labels[locale];
  const total = seasonalSettings.ramadan.days;
  return (
    <div className="rmd rmd-hadith" role="group" aria-label={t.region}>
      <RamadanCardBorder />
      {hadiths.map((h) => (
        <article key={h.day} className="rmd-hadith-day" data-day={h.day}>
          <p className="rmd-hadith-label">
            <span>
              {t.label} · {t.day} {pad(h.day)}
            </span>
            <span aria-hidden className="rmd-hadith-count">
              {pad(h.day)} / {total}
            </span>
          </p>
          <blockquote className="rmd-hadith-text" lang={locale}>
            <p>{h.text[locale]}</p>
          </blockquote>
          <p className="rmd-hadith-source">
            {collectionName[h.collection][locale]} · {h.reference}
            {preview && h.translation[locale].status === "draft" && (
              <span className="rmd-hadith-draft"> · {t.draft}</span>
            )}
          </p>
        </article>
      ))}
    </div>
  );
}
