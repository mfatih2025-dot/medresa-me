import type { Locale } from "@/i18n/config";

/*
 * Obavještenja — the Medresa's official announcements (src/app/[locale]/obavjestenja).
 *
 * Each announcement is plain data: its date, its title in each language, whether
 * it is pinned, and its documents — the original PDFs, unchanged, under
 * /public/dokumenti, with a preview of each one's first page rendered from that PDF
 * (pdftoppm) under /public/images/obavjestenja. A new announcement is a new entry
 * here; the page lays it out without changes. The shape is the one a later admin
 * (CMS) source would return, so this list can be replaced by it.
 *
 * Every document is offered on every language's page; `order` gives each page its
 * own order (the page's language first).
 */

export type AnnouncementDocument = {
  /** Stable key, e.g. "mne". */
  id: string;
  /** The language of the document, named in each page's language. */
  language: Record<Locale, string>;
  /** The original PDF, as published (public path). */
  file: string;
  /** The name the downloaded file is saved under. */
  downloadName: string;
  /** The PDF's size in bytes. */
  bytes: number;
  /** The first page, rendered from the PDF. */
  preview: { src: string; width: number; height: number };
};

export type Announcement = {
  /** Stable key (date and subject). */
  id: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  pinned: boolean;
  title: Record<Locale, string>;
  /** One sentence for search results and link previews. */
  summary: Record<Locale, string>;
  documents: readonly AnnouncementDocument[];
  /** Document ids in display order, per page language. */
  order: Record<Locale, readonly string[]>;
  /** The link preview image of the announcement, per language (1200 × 630). */
  share: Record<Locale, { src: string; width: number; height: number }>;
};

const DOCS = "/dokumenti/obavjestenja";
const IMGS = "/images/obavjestenja";

export const announcements: readonly Announcement[] = [
  {
    id: "2026-11-25-prijava-maturskih-ispita",
    date: "2026-11-25",
    pinned: true,
    title: {
      bs: "Prijava maturskih ispita za januarski ispitni rok",
      sq: "Paraqitja e provimeve të maturës për afatin e janarit",
      en: "Registration for the matura examinations, January session",
    },
    summary: {
      bs: "Prijava maturskih ispita za januarski ispitni rok: službeno obavještenje Medrese „Mehmed Fatih“, s dokumentima za preuzimanje.",
      sq: "Paraqitja e provimeve të maturës për afatin e janarit: njoftim zyrtar i Medresesë “Mehmed Fatih”, me dokumente për shkarkim.",
      en: "Registration for the matura examinations, January session: an official notice of the Medresa “Mehmed Fatih”, with documents to download.",
    },
    documents: [
      {
        id: "mne",
        language: { bs: "BS", sq: "BS", en: "BS" },
        file: `${DOCS}/2026-11-25/prijava-maturskih-ispita-januarski-rok-mne.pdf`,
        downloadName: "Medresa-Mehmed-Fatih-Prijava-maturskih-ispita-januarski-rok-MNE.pdf",
        bytes: 359761,
        preview: { src: `${IMGS}/2026-11-25/mne.jpg`, width: 900, height: 1284 },
      },
      {
        id: "alb",
        language: { bs: "SQ", sq: "SQ", en: "SQ" },
        file: `${DOCS}/2026-11-25/paraqitja-e-provimeve-te-matures-afati-i-janarit-alb.pdf`,
        downloadName: "Medreseja-Mehmed-Fatih-Paraqitja-e-provimeve-te-matures-afati-i-janarit-ALB.pdf",
        bytes: 387673,
        preview: { src: `${IMGS}/2026-11-25/alb.jpg`, width: 900, height: 1284 },
      },
    ],
    order: { bs: ["mne", "alb"], sq: ["alb", "mne"], en: ["mne", "alb"] },
    share: {
      bs: { src: `${IMGS}/2026-11-25/share-bs.jpg`, width: 1200, height: 630 },
      sq: { src: `${IMGS}/2026-11-25/share-sq.jpg`, width: 1200, height: 630 },
      en: { src: `${IMGS}/2026-11-25/share-en.jpg`, width: 1200, height: 630 },
    },
  },
];

/** Pinned first, then the newest. */
export const sortedAnnouncements = () =>
  [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));

/** The page's own words, per language. */
export const obavjestenjaText: Record<
  Locale,
  {
    title: string;
    eyebrow: string;
    description: string;
    pinned: string;
    download: string;
    documents: string;
    format: string;
    months: readonly string[];
  }
> = {
  bs: {
    title: "Obavještenja",
    eyebrow: "Medresa „Mehmed Fatih“",
    description: "Službena obavještenja Medrese „Mehmed Fatih“ s dokumentima za preuzimanje.",
    pinned: "Izdvojeno",
    download: "Preuzmi PDF",
    documents: "Dokumenti",
    format: "PDF",
    months: ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"],
  },
  sq: {
    title: "Njoftime",
    eyebrow: "Medreseja “Mehmed Fatih”",
    description: "Njoftimet zyrtare të Medresesë “Mehmed Fatih” me dokumente për shkarkim.",
    pinned: "E veçuar",
    download: "Shkarko PDF",
    documents: "Dokumentet",
    format: "PDF",
    months: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"],
  },
  en: {
    title: "Announcements",
    eyebrow: "Medresa “Mehmed Fatih”",
    description: "Official announcements of the Medresa “Mehmed Fatih”, with documents to download.",
    pinned: "Pinned",
    download: "Download PDF",
    documents: "Documents",
    format: "PDF",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
};

/** 25. novembar 2026. · 25 nëntor 2026 · 25 November 2026 */
export function formatDate(iso: string, locale: Locale) {
  const [y, m, d] = iso.split("-").map(Number);
  const month = obavjestenjaText[locale].months[m - 1];
  return locale === "bs" ? `${d}. ${month} ${y}.` : `${d} ${month} ${y}`;
}

/** The size in kilobytes, e.g. 351 KB. */
export function formatSize(bytes: number) {
  const kb = Math.round(bytes / 1024);
  return `${kb} KB`;
}
