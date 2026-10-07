import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Objekat i uslovi — the text of medresa.me/oiu, word for word, in the source's
 * order (only the quotation marks follow this site's „…“ convention, and a
 * dash is bound to the word before it).
 *
 * Every photograph is the authentic one from that page, in the section it
 * belongs to there:
 *   potkrovlje   the page's title banner (only its unfaded upper part)
 *   dzamija      beside the introduction (the central mosque)
 *   internat … sala   one per space, as on the source
 */
export type OiuImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** object-position when the frame crops the photograph. */
  position?: string;
};

export type OiuSpace = {
  id: string;
  heading: string;
  text: string;
  image: OiuImage;
};

const img = (name: string, width: number, height: number, alt: string, position?: string): OiuImage => ({
  src: `/images/oiu/${name}.jpg`,
  width,
  height,
  alt,
  position,
});

const bs = {
  title: "Objekat i uslovi",
  eyebrow: "Medresa „Mehmed Fatih“",

  banner: img(
    "potkrovlje",
    1420,
    280,
    "Prostorija u potkrovlju s drvenim stubovima, visećim svjetiljkama i stolovima",
    "40% 50%",
  ),

  intro: [
    "Medresa „Mehmed Fatih“ raspolaže savremenim prostorijama koje omogućavaju kvalitetno obrazovanje i udoban boravak učenika. Nastava se odvija u moderno opremljenim učionicama, stručnim kabinetima, laboratorijama za prirodne nauke i informatičkom centru.",
    "Centralna džamija Medrese čini duhovno središte ustanove i obogaćuje svakodnevni život učenika. Naš cilj je da učenici rastu u ambijentu koji podjednako njeguje znanje, vjeru i etičke vrijednosti.",
  ],

  mosque: img("dzamija", 1014, 1116, "Džamija Medrese „Mehmed Fatih“ s minaretom", "50% 40%"),

  /** The figures as the source sets them: value, then its unit, then the label. */
  figures: [
    { value: "200", unit: "+", label: "Internatski smještaj učenika" },
    { value: "24/7", unit: "", label: "Videonadzor u svim zajedničkim prostorijama" },
    {
      value: "6 000",
      unit: "m²",
      label: "Sa svim pratećim sadržajima: internat, amfiteatar, sportska sala i učionice",
    },
  ],

  spaces: [
    {
      id: "internat",
      heading: "Internatski smještaj",
      text: "Organizovan je u dvije odvojene zgrade – za muške i ženske učenike – s udobnim sobama, čitaonicama, prostorijama za rekreaciju i zajedničkim prostorima za učenje i odmor. Posebna pažnja posvećena je ishrani, higijeni i sigurnosti učenika.",
      image: img("internat", 1536, 1024, "Soba u internatu s krevetima na sprat i ormarima", "50% 55%"),
    },
    {
      id: "biblioteka",
      heading: "Biblioteka",
      text: "Nudi bogat fond islamske i opšte literature, a posebne učionice za hifz pružaju prostor za predan rad na pamćenju Kur’ana.",
      image: img("biblioteka", 1536, 1024, "Police s knjigama u biblioteci Medrese", "50% 40%"),
    },
    {
      id: "amfiteatar",
      heading: "Amfiteatar",
      text: "Namijenjen za predavanja, prezentacije, radionice i javne nastupe učenika i gostiju.",
      image: img("amfiteatar", 1536, 1024, "Amfiteatar Medrese s redovima crvenih sjedišta", "50% 58%"),
    },
    {
      id: "book-caffe",
      heading: "Book caffe",
      text: "U okviru medrese funkcioniše i Book Caffe – višenamjenski prostor koji služi kao kutak za čitanje, učenje, druženje i organizaciju manjih kulturnih programa.",
      image: img(
        "book-caffe",
        1536,
        1024,
        "Book Caffe s pultom, stolom za čitanje i policama s knjigama",
        "55% 50%",
      ),
    },
    {
      id: "sala",
      heading: "Sala",
      text: "Sportska sala je namijenjena učenicima i učenicama za redovne fizičke aktivnosti i vannastavne sportske sadržaje. Sala je prilagođena za više sportova – košarku, odbojku, mali fudbal i druge timske igre.",
      image: img("sala", 1536, 1024, "Sportska sala s parketom, košem i golom", "50% 60%"),
    },
  ] satisfies OiuSpace[],
} as const;

type OiuContent = Localized<typeof bs>;
const im = (i: OiuImage, alt: string): OiuImage => ({ ...i, alt });
const [sp0, sp1, sp2, sp3, sp4] = bs.spaces;

/** English: the medresa.me English page (Weglot), revised („the Medresa“, Book Caffe kept as its name). */
const en: OiuContent = {
  title: "Campus and Facilities",
  eyebrow: "Medresa “Mehmed Fatih”",
  banner: im(bs.banner, "An attic room with wooden pillars, pendant lamps and tables"),
  intro: [
    "The Medresa “Mehmed Fatih” has contemporary premises that make quality education and a comfortable stay possible for its students. Lessons take place in modernly equipped classrooms, specialist rooms, natural science laboratories and a computer centre.",
    "The central mosque of the Medresa is the spiritual heart of the institution and enriches the students’ everyday life. Our aim is for students to grow up in a setting that nurtures knowledge, faith and ethical values alike.",
  ],
  mosque: im(bs.mosque, "The mosque of the Medresa “Mehmed Fatih” with its minaret"),
  figures: [
    { value: "200", unit: "+", label: "Students in boarding accommodation" },
    { value: "24/7", unit: "", label: "Video surveillance in all common areas" },
    {
      value: "6,000",
      unit: "m²",
      label: "With all its facilities: boarding house, amphitheatre, sports hall and classrooms",
    },
  ],
  spaces: [
    {
      id: sp0.id,
      heading: "Boarding accommodation",
      text: "It is organised in two separate buildings – for male and female students – with comfortable rooms, reading rooms, recreation rooms and shared spaces for study and rest. Particular care is given to the students’ nutrition, hygiene and safety.",
      image: im(sp0.image, "A boarding room with bunk beds and wardrobes"),
    },
    {
      id: sp1.id,
      heading: "Library",
      text: "It offers a rich collection of Islamic and general literature, and dedicated hifz classrooms provide space for devoted work on memorising the Qur’an.",
      image: im(sp1.image, "Bookshelves in the Medresa library"),
    },
    {
      id: sp2.id,
      heading: "Amphitheatre",
      text: "Intended for lectures, presentations, workshops and public appearances by students and guests.",
      image: im(sp2.image, "The Medresa amphitheatre with rows of red seats"),
    },
    {
      id: sp3.id,
      heading: "Book Caffe",
      text: "The Medresa also has its Book Caffe – a multipurpose space that serves as a corner for reading, studying, spending time together and holding smaller cultural events.",
      image: im(sp3.image, "The Book Caffe with a counter, a reading table and bookshelves"),
    },
    {
      id: sp4.id,
      heading: "Sports hall",
      text: "The sports hall is intended for male and female students for regular physical activity and extracurricular sport. It is suited to several sports – basketball, volleyball, futsal and other team games.",
      image: im(sp4.image, "The sports hall with a parquet floor, a basket and a goal"),
    },
  ],
};

/** Shqip: the medresa.me Albanian page (Weglot), revised („nxënës“, Book Caffe as its name). */
const sq: OiuContent = {
  title: "Objekti dhe kushtet",
  eyebrow: "Medreseja “Mehmed Fatih”",
  banner: im(bs.banner, "Hapësirë në papafingo me shtylla druri, llamba të varura dhe tavolina"),
  intro: [
    "Medreseja “Mehmed Fatih” disponon ambiente bashkëkohore që mundësojnë arsim cilësor dhe qëndrim të rehatshëm për nxënësit. Mësimi zhvillohet në klasa të pajisura në mënyrë moderne, kabinete profesionale, laboratorë të shkencave natyrore dhe qendër informatike.",
    "Xhamia qendrore e Medresesë është zemra shpirtërore e institucionit dhe pasuron jetën e përditshme të nxënësve. Qëllimi ynë është që nxënësit të rriten në një mjedis që kultivon njëlloj dijen, besimin dhe vlerat etike.",
  ],
  mosque: im(bs.mosque, "Xhamia e Medresesë “Mehmed Fatih” me minare"),
  figures: [
    { value: "200", unit: "+", label: "Nxënës në akomodim në konvikt" },
    { value: "24/7", unit: "", label: "Mbikëqyrje me video në të gjitha hapësirat e përbashkëta" },
    {
      value: "6.000",
      unit: "m²",
      label: "Me të gjitha përmbajtjet përcjellëse: konvikt, amfiteatër, sallë sportive dhe klasa",
    },
  ],
  spaces: [
    {
      id: sp0.id,
      heading: "Akomodimi në konvikt",
      text: "Është i organizuar në dy ndërtesa të veçanta – për nxënës dhe nxënëse – me dhoma komode, salla leximi, hapësira për rekreacion dhe hapësira të përbashkëta për mësim dhe pushim. Vëmendje e veçantë i kushtohet ushqyerjes, higjienës dhe sigurisë së nxënësve.",
      image: im(sp0.image, "Dhomë në konvikt me shtretër marinarë dhe dollapë"),
    },
    {
      id: sp1.id,
      heading: "Biblioteka",
      text: "Ofron një fond të pasur të literaturës islame dhe të përgjithshme, ndërsa klasat e veçanta për hifz ofrojnë hapësirë për punë të përkushtuar në mësimin përmendësh të Kuranit.",
      image: im(sp1.image, "Rafte me libra në bibliotekën e Medresesë"),
    },
    {
      id: sp2.id,
      heading: "Amfiteatri",
      text: "I destinuar për ligjërata, prezantime, punëtori dhe paraqitje publike të nxënësve dhe mysafirëve.",
      image: im(sp2.image, "Amfiteatri i Medresesë me rreshta ulësesh të kuqe"),
    },
    {
      id: sp3.id,
      heading: "Book Caffe",
      text: "Në kuadër të Medresesë funksionon edhe Book Caffe – hapësirë shumëfunksionale që shërben si kënd për lexim, mësim, shoqërim dhe organizimin e programeve më të vogla kulturore.",
      image: im(sp3.image, "Book Caffe me banak, tavolinë leximi dhe rafte librash"),
    },
    {
      id: sp4.id,
      heading: "Salla",
      text: "Salla sportive është e destinuar për nxënësit dhe nxënëset për aktivitete të rregullta fizike dhe përmbajtje sportive jashtëmësimore. Salla është e përshtatur për disa sporte – basketboll, volejboll, futboll të vogël dhe lojëra të tjera ekipore.",
      image: im(sp4.image, "Salla sportive me parket, kosh dhe portë"),
    },
  ],
};

export const oiuContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const oiu = bs;
