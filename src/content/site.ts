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

import type { Locale } from "@/i18n/config";
import { pathFor, pageIds, type PageId } from "@/i18n/routes";

/** A page's identity (its Bosnian slug); see src/i18n/routes.ts. */
export type PageSlug = PageId;

type PageInfo = { title: string; group: "medresa" | "ucenici" | "aktuelno" };

const groups: Record<PageId, PageInfo["group"]> = {
  historijat: "medresa",
  misija: "medresa",
  uip: "medresa",
  oiu: "medresa",
  nastava: "ucenici",
  tiu: "ucenici",
  alumni: "ucenici",
  galerija: "ucenici",
  "kucni-red": "ucenici",
  donacije: "aktuelno",
  vijesti: "aktuelno",
  upis: "aktuelno",
  kontakt: "aktuelno",
};

/** Page titles as they appear in menus and the browser tab, per language. */
export const pageTitles: Record<Locale, Record<PageId, string>> = {
  bs: {
    historijat: "Historijat",
    misija: "Misija i vizija",
    uip: "Uprava i profesori",
    oiu: "Objekat i uslovi",
    nastava: "Nastava i predmeti",
    tiu: "Takmičenja i uspjesi",
    alumni: "Alumni",
    galerija: "Galerija",
    "kucni-red": "Kućni red",
    donacije: "Donacije",
    vijesti: "Vijesti",
    upis: "Upis i prijemni",
    kontakt: "Kontakt",
  },
  sq: {
    historijat: "Historiku",
    misija: "Misioni dhe vizioni",
    uip: "Drejtoria dhe profesorët",
    oiu: "Objekti dhe kushtet",
    nastava: "Mësimi dhe lëndët",
    tiu: "Garat dhe sukseset",
    alumni: "Alumni",
    galerija: "Galeria",
    "kucni-red": "Rregullat e shtëpisë",
    donacije: "Donacionet",
    vijesti: "Lajme",
    upis: "Regjistrimi dhe provimi pranues",
    kontakt: "Kontakti",
  },
  en: {
    historijat: "History",
    misija: "Mission and Vision",
    uip: "Administration and Teachers",
    oiu: "Campus and Facilities",
    nastava: "Teaching and Subjects",
    tiu: "Competitions and Achievements",
    alumni: "Alumni",
    galerija: "Gallery",
    "kucni-red": "House Rules",
    donacije: "Donations",
    vijesti: "News",
    upis: "Admissions and Entrance Exam",
    kontakt: "Contact",
  },
};

/** Bosnian titles and groups (kept for existing callers). */
export const pages: Record<PageId, PageInfo> = Object.fromEntries(
  pageIds.map((id) => [id, { title: pageTitles.bs[id], group: groups[id] }]),
) as Record<PageId, PageInfo>;

export const pageSlugs = [...pageIds] as PageId[];

/** A page's URL in a language (Bosnian by default). */
export const href = (slug: PageId, locale: Locale = "bs") => pathFor(slug, locale);
