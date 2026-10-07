import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Upis i prijemni — Bosnian only (the source's Albanian lines belong to the
 * future SQ page).
 *
 * The page is data-driven so a later admin panel can change it without code:
 *
 *   status     the admission state as one sentence; `word` is the part the page
 *              lifts out as the answer („otvoren“, later e.g. „završen“)
 *   documents  official documents, in order: the admission results now.
 *              `href: null` = prepared, not yet linked (the action is shown but
 *              does nothing until the PDF is set)
 *   closing    an optional short closing note (none at present)
 *
 * The document wording is the source's: „Rezultati za upis učenika i učenica
 * za školsku 2026 - 2027.“ / „Preuzmi rezultate u PDF“. The status sentence
 * follows the brief („…je otvoren.“; the live source reads „…je završen.“).
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
  /** Phones: the title's size (vw) that keeps it on one line in this language. */
  titleFit: number;
  /** Phones: set the title in its two lines (as on larger screens) when one line would be too small. */
  phoneSplit: boolean;
  /** The status section's name for assistive technology. */
  statusLabel: string;
  status: { before: string; word: string; after: string };
  documents: readonly UpisDocument[];
  /** A short, quiet closing note under the document (null: none). */
  closing: { text: readonly string[] } | null;
};

const bs: UpisContent = {
  /** „Upis i prijemni ispit“, as the two lines it resolves into. */
  title: ["Upis i prijemni", "ispit"],
  titleFit: 9.6,
  phoneSplit: false,
  statusLabel: "Status upisa",

  status: {
    before: "Upis učenika u Medresu „Mehmed Fatih“ za školsku 2026/2027. godinu je",
    word: "otvoren",
    after: ".",
  },

  documents: [
    {
      title: "Rezultati za upis učenika i učenica za školsku 2026 - 2027.",
      action: "Preuzmi rezultate u PDF",
      href: null,
    },
  ],

  // The welcome sentences and Qur'anic quotation of an earlier version are not on
  // the current source page, so none is shown; a short closing note can be set here.
  closing: null,
};

/** English: written for this page (the medresa.me English page is a garbled machine translation). */
const en: Localized<typeof bs> = {
  title: ["Admissions and", "entrance exam"],
  titleFit: 10.4,
  phoneSplit: true,
  statusLabel: "Admission status",
  status: {
    before: "Enrolment of students at the Medresa “Mehmed Fatih” for the 2026/2027 school year is",
    word: "open",
    after: ".",
  },
  documents: [
    {
      title: "Admission results for male and female students, school year 2026 - 2027.",
      action: "Download the results as PDF",
      href: bs.documents[0].href,
    },
  ],
  closing: null,
};

/** Shqip: the official Albanian lines of medresa.me/upis („Regjistrimi i nxënësve…“, „Shkarkoni rezultatet në PDF“). */
const sq: Localized<typeof bs> = {
  title: ["Regjistrimi dhe", "provimi pranues"],
  titleFit: 10.4,
  phoneSplit: true,
  statusLabel: "Statusi i regjistrimit",
  status: {
    before: "Regjistrimi i nxënësve në Medresenë “Mehmed Fatih” për vitin shkollor 2026/2027 është",
    word: "i hapur",
    after: ".",
  },
  documents: [
    {
      title: "Rezultatet e regjistrimit të nxënësve dhe nxënëseve për vitin shkollor 2026 - 2027.",
      action: "Shkarkoni rezultatet në PDF",
      href: bs.documents[0].href,
    },
  ],
  closing: null,
};

export const upisContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const upis = bs;
