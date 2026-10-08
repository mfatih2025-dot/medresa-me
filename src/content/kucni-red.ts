import type { Locale } from "@/i18n/config";

/**
 * Kućni red — the official house rules, transcribed from the Medresa's printed
 * document (the only source; the old medresa.me page is not used). The Bosnian
 * text is the document word for word, in its order, rules 1–15. The one change
 * is typographic: a space before „(12h)“ in rule 6.
 *
 * Albanian and English are translations of the Bosnian master. Every time is
 * kept exactly as written there, „h“ included.
 */

/** Exactly fifteen rules, in order. */
type Fifteen = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type KucniRedContent = {
  title: string;
  subtitle: string;
  rules: Fifteen;
  share: { label: string; copied: string; failed: string };
  description: string;
};

const bs: KucniRedContent = {
  title: "Kućni red",
  subtitle: "Vremenska zona računanja vremena zimi:",
  rules: [
    "Sabah namaz buđenje 20 minuta prije ezana.",
    "Doručak od 06:30h do 07:00h za učenike, a za učenice od 07:00h do 07:20h obavezno za sve učenice da budu zajedno u kuhinji.",
    "Zaključavanje internata u 07:20h muški internat, ženski internat u 07:00h.",
    "Nastava počinje u 07:30h.",
    "Izlazak iz prostorija medrese za vrijeme velikog odmora.",
    "Podne namaz (12h) obavezan za sve učenike i učenice. Učenice obavezne biti u mesdžidu iako nisu u prilici obaviti namaz iz šerijatskih razloga.",
    "Ručak za učenice iz ženskog internata u 13:45h do 14:15h. Za učenike iz muškog internata od 14:15h do 14:45h.",
    "Ikindija za učenike iz internata u 14:10h, za učenice u 15:00h.",
    "Odmor za učenike/ce iz internata od 14:30h do akšam namaza.",
    "Prva korepeticija od poslije akšama do jacije.",
    "Večera za učenice u 18:30h, za učenike u 19:00h.",
    "Druga korepeticija poslije večere (uz dogovor dežurnih odgajatelja/ica).",
    "Zaključavanje internata u 22:00h.",
    "Učenici/ce ne mogu koristiti telefon poslije 23h u internatu, ukoliko se desi da neko od spomenutih koristi telefon se oduzima do pred nastavu.",
    "Srijeda, slobodan dan za učenike iz muškog internata nakon časova do povečeri. Četvrtak, slobodan dan za učenice iz ženskog internata nakon nastave do 20h.",
  ],
  share: { label: "Podijeli", copied: "Link je kopiran", failed: "Kopiranje nije uspjelo" },
  description:
    "Kućni red Medrese „Mehmed Fatih“: dnevni raspored u internatima po zimskom računanju vremena.",
};

const sq: KucniRedContent = {
  title: "Rregullat e shtëpisë",
  subtitle: "Orari sipas kohës së dimrit:",
  rules: [
    "Zgjimi për namazin e sabahut: 20 minuta para ezanit.",
    "Mëngjesi për nxënësit nga 06:30h deri në 07:00h, ndërsa për nxënëset nga 07:00h deri në 07:20h; të gjitha nxënëset janë të detyruara të jenë së bashku në kuzhinë.",
    "Mbyllja e konviktit: konvikti i djemve në 07:20h, konvikti i vajzave në 07:00h.",
    "Mësimi fillon në 07:30h.",
    "Dalja nga ambientet e medresesë gjatë pushimit të madh.",
    "Namazi i drekës (12h) është i detyrueshëm për të gjithë nxënësit dhe nxënëset. Nxënëset janë të detyruara të jenë në mesxhid edhe kur nuk janë në gjendje ta falin namazin për arsye të sheriatit.",
    "Dreka për nxënëset e konviktit të vajzave nga 13:45h deri në 14:15h. Për nxënësit e konviktit të djemve nga 14:15h deri në 14:45h.",
    "Ikindia për nxënësit e konviktit në 14:10h, për nxënëset në 15:00h.",
    "Pushim për nxënësit dhe nxënëset e konviktit nga 14:30h deri në namazin e akshamit.",
    "Ora e parë e studimit të mbikëqyrur: pas akshamit deri në jaci.",
    "Darka për nxënëset në 18:30h, për nxënësit në 19:00h.",
    "Ora e dytë e studimit të mbikëqyrur pas darkës (në marrëveshje me edukatorët dhe edukatoret kujdestarë).",
    "Mbyllja e konviktit në 22:00h.",
    "Nxënësit dhe nxënëset nuk mund ta përdorin telefonin në konvikt pas orës 23h; nëse ndonjëri prej tyre e përdor telefonin, telefoni i merret deri para fillimit të mësimit.",
    "E mërkura: ditë e lirë për nxënësit e konviktit të djemve, pas orëve të mësimit deri në mbrëmje. E enjtja: ditë e lirë për nxënëset e konviktit të vajzave, pas mësimit deri në 20h.",
  ],
  share: { label: "Ndaj", copied: "Lidhja u kopjua", failed: "Kopjimi nuk u krye" },
  description:
    "Rregullat e shtëpisë së Medresesë “Mehmed Fatih”: orari ditor në konvikte sipas kohës së dimrit.",
};

const en: KucniRedContent = {
  title: "House Rules",
  subtitle: "Times are given in winter time:",
  rules: [
    "Wake-up for the Fajr (sabah) prayer: 20 minutes before the adhan.",
    "Breakfast for male students from 06:30h to 07:00h, and for female students from 07:00h to 07:20h; all female students are required to be in the kitchen together.",
    "Locking of the boarding houses: the boys’ boarding house at 07:20h, the girls’ boarding house at 07:00h.",
    "Classes begin at 07:30h.",
    "Leaving the Medresa premises during the long break.",
    "The Dhuhr (podne) prayer (12h) is obligatory for all male and female students. Female students are required to be in the masjid even when they are unable to perform the prayer for reasons recognised by the Sharia.",
    "Lunch for female students of the girls’ boarding house from 13:45h to 14:15h. For male students of the boys’ boarding house from 14:15h to 14:45h.",
    "The Asr (ikindija) prayer for male boarding students at 14:10h, for female students at 15:00h.",
    "Rest for boarding students, male and female, from 14:30h until the Maghrib (akšam) prayer.",
    "The first supervised study session: from after Maghrib (akšam) until Isha (jacija).",
    "Dinner for female students at 18:30h, for male students at 19:00h.",
    "The second supervised study session after dinner (as arranged with the tutors on duty).",
    "Locking of the boarding houses at 22:00h.",
    "Students may not use their phones in the boarding house after 23h; if any of them uses a phone, it is taken away until just before classes.",
    "Wednesday: a free day for male students of the boys’ boarding house, after classes until early evening. Thursday: a free day for female students of the girls’ boarding house, after classes until 20h.",
  ],
  share: { label: "Share", copied: "Link copied", failed: "Could not copy the link" },
  description:
    "House rules of the Medresa “Mehmed Fatih”: the daily schedule in the boarding houses, in winter time.",
};

export const kucniRedContent: Record<Locale, KucniRedContent> = { bs, sq, en };
