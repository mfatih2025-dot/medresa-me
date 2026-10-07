import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";
import { href as pageHref, pageTitles, type PageSlug } from "./site";
import { homeNews } from "./vijesti/home";

type Link = { label: string; href: string };

/** Imagery lives in /public/images — swap a file or its `src` here, nothing else. */
export type Img = { src: string; alt: string; placeholder?: boolean; position?: string };

const img = (src: string, alt: string, position = "50% 50%", placeholder = false): Img => ({
  src: `/images/${src}.jpg`,
  alt,
  position,
  placeholder,
});

/** Photographs of the Medresa for a homepage story that has no image of its own. */
export const newsFallbacks: readonly Img[] = [
  img("news-a", "Kameni portal Medrese s lukovima", "50% 50%", true),
  img("news-b", "Dvorište Medrese s maslinom i kamenim zgradama", "50% 50%", true),
];

/** A page link in a language: its title there and its URL there. */
export const linkFor =
  (locale: Locale) =>
  (slug: PageSlug): Link => ({ label: pageTitles[locale][slug], href: pageHref(slug, locale) });

const link = linkFor("bs");
const href = (slug: PageSlug) => pageHref(slug, "bs");

/**
 * One generation panel. Generation n finished (2007 + n)–(2011 + n), as printed on every
 * official panel; from the fifth generation on, the panel also shows the maturantice.
 * It opens that generation's chapter on the Alumni page, in the same language.
 */
export const genFor =
  (locale: Locale, alt: (numeral: string, n: number, years: string) => string) =>
  (numeral: string, n: number) => {
    const years = `${2007 + n}–${2011 + n}`;
    return {
      numeral,
      years,
      href: `${pathFor("alumni", locale)}#generacija-${n}`,
      image: img(`generacije/generacija-${String(n).padStart(2, "0")}`, alt(numeral, n, years)),
    };
  };

const gen = genFor(
  "bs",
  (numeral, n, years) =>
    `Tablo ${numeral}. generacije ${n >= 5 ? "maturanata i maturantica" : "maturanata"} Medrese „Mehmed Fatih“, ${years}.`,
);

export const bs = {
  lang: "bs",
  meta: {
    title: "Medresa „Mehmed Fatih“ – Crna Gora",
    description:
      "Zvanična stranica Medrese „Mehmed Fatih“ u Crnoj Gori. Spoj islamskih vrijednosti, savremenog obrazovanja i odgoja za život.",
  },
  ui: {
    skip: "Preskoči na sadržaj",
    menu: "Meni",
    closeMenu: "Zatvori meni",
    search: "Pretraga",
    searchPlaceholder: "Pretražite stranice i vijesti",
    searchEmpty: "Nema rezultata.",
    close: "Zatvori",
    language: "Jezik",
    languageSoon: "Albanski i engleski uskoro",
    comingSoon: "Ova stranica je u izradi.",
    comingSoonBody: "Sadržaj Medrese „Mehmed Fatih“ uskoro stiže u novom izdanju.",
    backHome: "Nazad na početnu",
    scrollDown: "Pomaknite se prema dolje",
    navLeft: "Glavna navigacija, lijevo",
    navRight: "Glavna navigacija, desno",
    home: "početna",
    notFound: "Stranica nije pronađena.",
    playGenerations: "Pokreni kretanje generacija",
    pauseGenerations: "Zaustavi kretanje generacija",
    generation: "Generacija",
    prevPost: "Prethodna objava",
    nextPost: "Sljedeća objava",
    /** Locale for dates and sorting (Intl). */
    intl: "bs-BA",
  },
  /** The Medresa's contact details as written in this language (numbers and e-mail are in site.ts). */
  contact: {
    address: ["Donji Milješ, Tuzi", "Crna Gora"],
    hours: "Pon – Pet / 08:00 – 17:00",
    branch: { name: "Područno odjeljenje Rožaje", address: "Ulica Raduna Đukića 1, Rožaje" },
  },
  nav: {
    left: [link("historijat"), link("nastava"), link("oiu")],
    right: [link("alumni"), link("vijesti"), link("upis")],
    groups: [
      { title: "Medresa", items: [link("historijat"), link("misija"), link("uip"), link("oiu")] },
      {
        title: "Učenici i alumni",
        items: [link("nastava"), link("tiu"), link("alumni"), link("galerija"), link("kucni-red")],
      },
      {
        title: "Aktuelno",
        items: [link("vijesti"), link("upis"), link("donacije"), link("kontakt")],
      },
    ],
  },
  hero: {
    // Identity: small pre-title, the name on one line (never broken), a quiet signature.
    pre: "MEDRESA",
    name: "MEHMED FATIH",
    signature: "Zvanična stranica",
    admissions: { kicker: "Prijemni 2026", label: "Rezultati prijemnog ispita", href: href("upis") },
    // Not rendered in the hero composition; kept for reuse elsewhere.
    eyebrow: ["Znanje", "Vrijednosti", "Odgovornost"],
    lead: "Spoj islamskih vrijednosti, savremenog obrazovanja i odgoja za život.",
    video: { label: "Pogledajte video", href: "https://www.youtube.com/@medresacg" },
    // The original campus photograph with a light neutral contrast lift only (natural colour).
    image: img(
      "hero-campus-natural",
      "Zgrada Medrese „Mehmed Fatih“ u Tuzima sa minaretima i kupolom, u podnožju brda",
      "34% 50%",
    ),
  },
  glance: {
    label: "Medresa ukratko",
    items: [
      { value: "2008.", label: "Početak rada", note: "6. oktobra 2008." },
      { value: "800+", label: "Svršenika", note: "svršenih učenika i učenica" },
      { value: "6.000 m²", label: "Savremeni objekat", note: "sa svim pratećim sadržajima" },
      { value: "Internat", label: "200+ učenika", note: "dvije odvojene zgrade" },
      { value: "Biblioteka", label: "i amfiteatar", note: "hifz učionice, Book Caffe" },
    ],
  },
  story: {
    eyebrow: "Naša priča",
    heading: ["Više od škole.", "Zajednica za cijeli život."],
    body: [
      "Naša medresa je dom odgoja, učenja i služenja zajednici. Njeni učenici ne uče samo kako da znaju – već kako da budu.",
      "Prva savremena islamska srednjoškolska ustanova u Crnoj Gori, osnovana pod okriljem Mešihata Islamske zajednice u Crnoj Gori.",
    ],
    pull: "Medresa „Mehmed Fatih“ – gdje znanje postaje amanet.",
    cta: { label: "Saznajte više", href: href("historijat") },
    main: img("story-dome", "Kupola i zgrada Medrese uz cvjetajući oleander", "50% 55%"),
    detail: img("story-arch", "Ulaz s lukom i minaretom u dvorištu Medrese", "40% 50%"),
    facts: [
      { value: "360+", label: "učenika i učenica" },
      { value: "2015.", label: "akreditacija programa" },
    ],
    links: [link("misija"), link("uip")],
  },
  education: {
    eyebrow: "Obrazovanje",
    heading: ["Vjera i znanje,", "jedan put."],
    lead: "Obrazovni program temelji se na harmoničnom spoju islamskog i opšteobrazovnog kurikuluma, s ciljem formiranja cjelovite ličnosti – duhovno izgrađene, moralno usmjerene i akademski kompetentne.",
    pillars: [
      {
        title: "Islamski predmeti",
        text: "Duhovna svijest, islamski identitet i osjetljivost prema društvenim i etičkim pitanjima.",
        items: [
          "Kur’an i tedžvid",
          "Akaid",
          "Fikh",
          "Hadis",
          "Tefsir",
          "Arapski jezik",
          "Povijest islama",
          "Etika i ahlak",
        ],
      },
      {
        title: "Opšteobrazovni predmeti",
        text: "Svi obavezni predmeti propisani za srednje škole u Crnoj Gori.",
        items: [
          "Jezik i književnost",
          "Engleski, arapski i turski",
          "Matematika",
          "Biologija, fizika, hemija",
          "Istorija i geografija",
          "Informatika",
        ],
      },
    ],
    facts: [
      "Četverogodišnja srednja škola internatskog tipa",
      "Dvojezična nastava – bosanski i albanski",
      "Nastavni plan usklađen sa standardima Ministarstva prosvjete",
    ],
    cta: { label: "Nastava i predmeti", href: href("nastava") },
    image: img("education-arches", "Tri kamena luka na ulazu u Medresu", "50% 50%"),
    image2: img("education-classroom", "Učionica s drvenim klupama u toplom svjetlu", "50% 50%"),
  },
  life: {
    eyebrow: "Život u Medresi",
    heading: ["Dom, ne samo", "školska zgrada."],
    lead: "Internat, biblioteka, amfiteatar, sportska sala i vannastavne aktivnosti – svakodnevica u kojoj učenici rastu u ambijentu koji njeguje znanje, vjeru i etičke vrijednosti.",
    items: [
      {
        title: "Internat",
        text: "Dvije odvojene zgrade za učenike i učenice, s čitaonicama i prostorima za učenje i odmor.",
        image: img("life-dormitory", "Zgrada internata Medrese uz maslinu u zalasku sunca", "50% 50%", true),
      },
      {
        title: "Biblioteka",
        text: "Bogat fond islamske i opšte literature te posebne učionice za hifz.",
        image: img("life-library", "Svijetla čitaonica s velikim prozorima", "50% 50%", true),
      },
      {
        title: "Amfiteatar",
        text: "Za predavanja, prezentacije, radionice i javne nastupe učenika i gostiju.",
        image: img(
          "life-amphitheatre",
          "Prostor sa stepenastim sjedenjem i zajedničkim stolom",
          "50% 50%",
          true,
        ),
      },
      {
        title: "Sportska sala",
        text: "Košarka, odbojka, mali fudbal i druge timske igre.",
        image: img("life-sports", "Pogled iz zraka na sportski teren kampusa", "50% 50%", true),
      },
      {
        title: "Vannastavne aktivnosti",
        text: "Hor, recitatorske, dramske, literarne i debatne sekcije, hafiske grupe i humanitarne akcije.",
        image: img("life-calligraphy", "Kaligrafija na unutrašnjosti kupole", "50% 50%", true),
      },
    ],
    cta: { label: "Objekat i uslovi", href: href("oiu") },
    // Homepage stack: one green card, photographs of everyday life layered behind it.
    stack: {
      heading: "Više od nastave.",
      text: "Nastava, internat, biblioteka, sport i druženje – svakodnevica u kojoj učenici rastu uz znanje, vjeru i prijateljstva.",
      cta: { label: "Istraži život u Medresi", href: href("oiu") },
      // Official photographs from medresa.me/oiu, one per facility (ids map to the
      // card placements in LifeStack.tsx).
      cards: [
        {
          id: "biblioteka",
          label: "Biblioteka",
          image: img("zivot/biblioteka", "Biblioteka Medrese: police s islamskom i opštom literaturom"),
        },
        {
          id: "sportska-sala",
          label: "Sportska sala",
          image: img("zivot/sportska-sala", "Sportska sala Medrese s košem i golom u popodnevnom svjetlu"),
        },
        {
          id: "internat",
          label: "Internat",
          image: img("zivot/internat", "Soba u internatu Medrese s krevetima na sprat i ormarima"),
        },
        {
          id: "amfiteatar",
          label: "Amfiteatar",
          image: img(
            "zivot/amfiteatar",
            "Amfiteatar Medrese sa stepenastim redovima sjedišta i stolom za govornike",
          ),
        },
      ],
    },
  },
  generations: {
    eyebrow: "Generacije",
    words: ["Znanje.", "Karakter.", "Zajednica.", "Bolji ljudi."],
    lead: "Od 6. oktobra 2008. godine, generacije svršenika i svršenica nose Medresu dalje – na univerzitete u zemlji i svijetu i u svoje zajednice.",
    total: "800+",
    totalLabel: "svršenika i svršenica",
    numerals: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"],
    cta: { label: "Alumni", href: href("alumni") },
    image: img("generations-aerial", "Pogled iz zraka na kampus Medrese", "50% 50%", true),
  },
  // Homepage Generacije gallery. Images, links and years are the official alumni panels
  // from medresa.me/alumni; the years are printed on each panel.
  alumni: {
    eyebrow: "Generacije",
    heading: ["Generacije koje ostavljaju trag."],
    link: { label: "Alumni", href: href("alumni") },
    galleryLabel: "Generacije maturanata Medrese, od I do XV",
    open: "otvori pano",
    items: [
      gen("I", 1),
      gen("II", 2),
      gen("III", 3),
      gen("IV", 4),
      gen("V", 5),
      gen("VI", 6),
      gen("VII", 7),
      gen("VIII", 8),
      gen("IX", 9),
      gen("X", 10),
      gen("XI", 11),
      gen("XII", 12),
      gen("XIII", 13),
      gen("XIV", 14),
      gen("XV", 15),
    ],
  },
  news: {
    eyebrow: "Aktuelno",
    heading: "Vijesti",
    all: { label: "Pogledaj sve vijesti", href: href("vijesti") },
    // Interface labels for the news layouts and the /vijesti archive.
    read: "Pročitaj",
    archive: "Arhiva",
    filterAll: "Sve",
    more: "Prikaži starije vijesti",
    // The newest stories, from the news archive (src/content/vijesti).
    items: homeNews("bs", newsFallbacks),
  },
  // Homepage social stack (below Riječ direktora).
  feed: {
    eyebrow: "Pratite život Medrese",
    heading: "Medresa iz dana u dan.",
    lead: "Trenuci, događaji i priče iz života naše Medrese.",
    platforms: { instagram: "Instagram", facebook: "Facebook" },
    /** The profile cards (shown until a post is available): their line and photo description. */
    profiles: {
      instagram: {
        text: "Fotografije i kratki trenuci iz svakodnevice Medrese – iz učionica, internata i sa takmičenja.",
        alt: "Kaligrafija na unutrašnjosti kupole u Medresi",
      },
      facebook: {
        text: "Vijesti, obavještenja i događaji iz Medrese, prvo na našoj Facebook stranici.",
        alt: "Ulaz s lukom i minaretom u dvorištu Medrese",
      },
    },
    open: { post: "Pogledaj objavu", profile: "Posjetite profil" },
  },
  social: {
    eyebrow: "Zajednica",
    heading: "Medresa iz dana u dan.",
    body: "Trenuci iz učionica, internata i sa takmičenja – uskoro i ovdje.",
    soon: "Uskoro",
    channels: [
      { label: "Instagram", handle: "@medresacg", href: "https://www.instagram.com/medresacg/" },
      { label: "Facebook", handle: "medresacg", href: "https://www.facebook.com/medresacg" },
      { label: "YouTube", handle: "@medresacg", href: "https://www.youtube.com/@medresacg" },
    ],
  },
  admissions: {
    eyebrow: "Upis i prijemni",
    heading: ["Dobro došli", "u naš svijet učenja."],
    body: "Kandidat treba da ima završenu osnovnu školu, primjerno vladanje i interesovanje za opšte i islamske nauke. Upis uključuje provjeru osnovnog znanja, razgovor sa komisijom i predaju potrebne dokumentacije.",
    status: "Upis za školsku 2026/2027. godinu je završen.",
    primary: { label: "Rezultati upisa 26/27", href: href("upis") },
    secondary: { label: "Kontaktirajte nas", href: href("kontakt") },
  },
  closing: {
    line: ["Znanje je", "svjetlo koje", "ostaje."],
    // "Riječ direktora", verbatim from the official medresa.me homepage.
    letter: {
      eyebrow: "Riječ direktora",
      paragraphs: [
        "Naša misija je jasna: odgojiti generacije koje će voljeti svoju vjeru, poštovati druge i služiti zajednici. U vremenu izazova, Medresa ostaje svjetionik koji svojim učenicima pruža sigurnost, smisao i pravac.",
        "Ponosni smo na našu tradiciju, ali jednako posvećeni budućnosti. Na ovom putu, svako znanje je amanet, a svaki učenik – povjerenje koje čuvamo s ljubavlju i predanošću.",
      ],
      thanks: "Hvala vam na povjerenju.",
      role: "Direktor Medrese,",
      name: "Amer Šukurica",
      // The Director's signature as used on medresa.me, re-inked ivory for the dark section.
      signature: {
        src: "/images/potpis-direktora.png",
        alt: "Potpis direktora Amera Šukurice",
        width: 406,
        height: 480,
      },
    },
    image: img("closing-minaret", "Minaret Medrese na plavom nebu", "50% 40%"),
  },
  footer: {
    tagline: "Medresa „Mehmed Fatih“ – gdje znanje postaje amanet.",
    contact: "Kontakt",
    explore: "Medresa",
    follow: "Pratite nas",
    rights: "Medresa „Mehmed Fatih“ – Crna Gora. Sva prava zadržana.",
    links: [
      link("historijat"),
      link("misija"),
      link("nastava"),
      link("upis"),
      link("vijesti"),
      link("galerija"),
      link("donacije"),
      link("kontakt"),
    ],
    support: {
      label: "Projekat podržao",
      href: "https://www.fzm.me/",
      // The Fund's own logo, unaltered (from medresa.me; white type for dark grounds).
      logo: {
        src: "/brand/fond-manjinska-prava.png",
        alt: "Fond za zaštitu i ostvarivanje manjinskih prava Crne Gore",
        width: 300,
        height: 200,
      },
      // Wording exactly as on medresa.me.
      note: "Projekat je podržan od strane Fonda za zaštitu i ostvarivanje manjinskih prava. Fond ne snosi odgovornost za sadržaj, iznesene stavove i interpretacije, koje su u potpunosti u nadležnosti autora i realizatora projekta.",
    },
  },
};

export type Dictionary = typeof bs;
