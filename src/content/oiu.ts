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

export const oiu = {
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
