import type { Locale } from "@/i18n/config";

/*
 * TEMPORARY — shown only on /sq and /en until their translations exist.
 * Says plainly, in the visitor's language, that the content is still Bosnian,
 * so nothing is presented as a translation. Remove a locale's entry (and add it
 * to `translated`) once its dictionary ships.
 */
const NOTICE: Partial<Record<Locale, string>> = {
  sq: "Versioni në shqip është në përgatitje. Përmbajtja tani shfaqet në boshnjakisht.",
  en: "The English version is in preparation. Content is currently shown in Bosnian.",
};

export function LocaleNotice({ locale }: { locale: Locale }) {
  const text = NOTICE[locale];
  if (!text) return null;
  return (
    <p
      role="note"
      lang={locale}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-[34rem] rounded-full border border-ink/10 bg-paper/95 px-5 py-2.5 text-center text-[0.8125rem] leading-[1.4] text-ink-soft shadow-[0_8px_24px_-12px_rgb(10_42_33/0.35)]"
    >
      {text}
    </p>
  );
}
