import type { Locale } from "@/i18n/config";

/** The news pages' own words (labels only; the stories are the content). */
export const newsUi = {
  bs: {
    title: "Vijesti",
    description:
      "Vijesti Medrese „Mehmed Fatih“ u Tuzima: posjete, obilježavanja, donacije i život škole, od najnovijih ka starijim.",
    read: "Pročitaj vijest",
    back: "Sve vijesti",
    published: "Objavljeno",
    photos: "Fotografije",
    photoCount: (n: number) =>
      `${n} ${n % 10 === 1 && n % 100 !== 11 ? "fotografija" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "fotografije" : "fotografija"}`,
    newer: "Novija vijest",
    older: "Starija vijest",
    pages: "Stranice arhive",
    page: (n: number) => `Stranica ${n}`,
    newerPage: "Novije vijesti",
    olderPage: "Starije vijesti",
    pageTitle: (n: number) => `Vijesti — stranica ${n}`,
    lightbox: {
      open: "Otvori fotografiju",
      viewer: "Fotografija {n} od {total}",
      close: "Zatvori",
      prev: "Prethodna fotografija",
      next: "Sljedeća fotografija",
    },
  },
  sq: {
    title: "Lajme",
    description:
      "Lajmet e Medresesë “Mehmed Fatih” në Tuz: vizita, shënime, donacione dhe jeta e shkollës, nga më të rejat te më të vjetrat.",
    read: "Lexo lajmin",
    back: "Të gjitha lajmet",
    published: "Publikuar",
    photos: "Fotografi",
    photoCount: (n: number) => `${n} ${n === 1 ? "fotografi" : "fotografi"}`,
    newer: "Lajmi më i ri",
    older: "Lajmi më i vjetër",
    pages: "Faqet e arkivit",
    page: (n: number) => `Faqja ${n}`,
    newerPage: "Lajme më të reja",
    olderPage: "Lajme më të vjetra",
    pageTitle: (n: number) => `Lajme — faqja ${n}`,
    lightbox: {
      open: "Hap fotografinë",
      viewer: "Fotografia {n} nga {total}",
      close: "Mbyll",
      prev: "Fotografia e mëparshme",
      next: "Fotografia e radhës",
    },
  },
  en: {
    title: "News",
    description:
      "News from the Medresa “Mehmed Fatih” in Tuzi: visits, occasions, donations and school life, newest first.",
    read: "Read the story",
    back: "All news",
    published: "Published",
    photos: "Photographs",
    photoCount: (n: number) => `${n} ${n === 1 ? "photograph" : "photographs"}`,
    newer: "Newer story",
    older: "Older story",
    pages: "Archive pages",
    page: (n: number) => `Page ${n}`,
    newerPage: "Newer stories",
    olderPage: "Older stories",
    pageTitle: (n: number) => `News — page ${n}`,
    lightbox: {
      open: "Open photograph",
      viewer: "Photograph {n} of {total}",
      close: "Close",
      prev: "Previous photograph",
      next: "Next photograph",
    },
  },
} satisfies Record<Locale, unknown>;

export type NewsUi = (typeof newsUi)["bs"];
