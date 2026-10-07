/**
 * Upis i prijemni — Bosnian only (the source's Albanian lines belong to the
 * future SQ page).
 *
 * The page is data-driven so a later admin panel can change it without code:
 *
 *   status     the admission state as one sentence; `word` is the part the page
 *              lifts out as the answer („otvoren“, later e.g. „završen“)
 *   documents  official documents, in order: instructions now, the results of
 *              the entrance exam later. `href: null` = prepared, not yet linked
 *              (the action is shown but does nothing)
 *   closing    the welcome; `quran` is rendered only when it has text
 *
 * The wording here follows the brief for this page (from the earlier version of
 * medresa.me/upis). The live source now reads „…godinu je završen.“ with
 * „Rezultati za upis učenika i učenica za školsku 2026 - 2027.“ /
 * „Preuzmi rezultate u PDF“ — switching to that is a change of the values below.
 */
export type UpisDocument = {
  /** The document's own title, as published. */
  title: string;
  /** The action's label. */
  action: string;
  /** The PDF's URL; null while the document is prepared but not yet linked. */
  href: string | null;
};

export type UpisContent = {
  title: readonly string[];
  status: { before: string; word: string; after: string };
  documents: readonly UpisDocument[];
  closing: {
    welcome: string;
    rest: string;
    since: string;
    quran: { text: string; source: string } | null;
  };
};

export const upis: UpisContent = {
  /** „Upis i prijemni ispit“, as its three resolving lines. */
  title: ["Upis", "i prijemni", "ispit"],

  status: {
    before: "Upis učenika u Medresu „Mehmed Fatih“ za školsku 2026/2027. godinu je",
    word: "otvoren",
    after: ".",
  },

  documents: [
    {
      title: "Uputstvo za upis učenika i učenica za školsku 2026–2027.",
      action: "Preuzmi uputstvo u PDF",
      href: null,
    },
  ],

  closing: {
    welcome: "Dobro došli",
    rest: "u Medresu „Mehmed Fatih“ – školu znanja, odgoja i vrijednosti.",
    since: "Od 2008. godine odgajamo generacije koje misle srcem, a djeluju znanjem.",
    // The Qur'anic quotation from the earlier source: to be added with its exact text.
    quran: null,
  },
};
