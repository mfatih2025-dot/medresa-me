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
 *   closing    an optional short closing note (none at present)
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
  /** A short, quiet closing note under the document (null: none). */
  closing: { text: readonly string[] } | null;
};

export const upis: UpisContent = {
  /** „Upis i prijemni ispit“, as the two lines it resolves into. */
  title: ["Upis i prijemni", "ispit"],

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

  // The welcome sentences and Qur'anic quotation of an earlier version are not on
  // the current source page, so none is shown; a short closing note can be set here.
  closing: null,
};
