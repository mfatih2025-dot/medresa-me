/** Language-neutral institutional facts and routes (source: medresa.me). */

export const site = {
  name: "Medresa „Mehmed Fatih“",
  shortName: "Medresa",
  /** Seat of the Medresa (Tuzi, Montenegro); never Podgorica. */
  place: "Tuzi",
  url: "https://www.medresa.me",
  eMedresa: "https://www.e-medresa.me/",
  logo: { src: "/brand/medresa-logo.png", width: 640, height: 640 },
  contact: {
    address: ["Donji Milješ, Tuzi", "Crna Gora"],
    phone: "+382 20 513 363",
    phoneHref: "tel:+38220513363",
    email: "medresapg@gmail.com",
    hours: "Pon – Pet / 08:00 – 17:00",
    branch: {
      name: "Područno odjeljenje Rožaje",
      address: "Ulica Raduna Đukića 1, Rožaje",
    },
  },
  social: [
    { label: "Instagram", href: "https://www.instagram.com/medresacg/" },
    { label: "Facebook", href: "https://www.facebook.com/medresacg" },
    { label: "YouTube", href: "https://www.youtube.com/@medresacg" },
  ],
  facts: {
    founded: "2008.",
    foundedLong: "6. oktobra 2008.",
    graduates: "800+",
    area: "6.000 m²",
    dormCapacity: "200+",
    generations: 15,
  },
} as const;

export type PageSlug =
  | "historijat"
  | "misija"
  | "uip"
  | "oiu"
  | "nastava"
  | "tiu"
  | "alumni"
  | "galerija"
  | "kucni-red"
  | "donacije"
  | "vijesti"
  | "upis"
  | "kontakt";

/** Existing medresa.me slugs are preserved so future redirects stay trivial. */
export const pages: Record<PageSlug, { title: string; group: "medresa" | "ucenici" | "aktuelno" }> = {
  historijat: { title: "Historijat", group: "medresa" },
  misija: { title: "Misija i vizija", group: "medresa" },
  uip: { title: "Uprava i profesori", group: "medresa" },
  oiu: { title: "Objekat i uslovi", group: "medresa" },
  nastava: { title: "Nastava i predmeti", group: "ucenici" },
  tiu: { title: "Takmičenja i uspjesi", group: "ucenici" },
  alumni: { title: "Alumni", group: "ucenici" },
  galerija: { title: "Galerija", group: "ucenici" },
  "kucni-red": { title: "Kućni red", group: "ucenici" },
  donacije: { title: "Donacije", group: "aktuelno" },
  vijesti: { title: "Vijesti", group: "aktuelno" },
  upis: { title: "Upis i prijemni", group: "aktuelno" },
  kontakt: { title: "Kontakt", group: "aktuelno" },
};

export const pageSlugs = Object.keys(pages) as PageSlug[];

export const href = (slug: PageSlug) => `/${slug}`;
