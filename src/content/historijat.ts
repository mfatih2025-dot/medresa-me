import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
import type { Img } from "./bs";

/**
 * Historijat Medrese „Mehmed Fatih“.
 *
 * Every sentence, number and date below is the text of medresa.me/historijat,
 * word for word (only the quotation marks follow this site's „…“ convention).
 * The chapters follow the history's own dates; chapter labels are descriptive
 * and add no facts. Photographs: the two aerial views published on that page,
 * the first generation's panel (2008.–2012.) and the Medresa's own photographs.
 */

const photo = (src: string, alt: string, position = "50% 50%"): Img => ({
  src: `/images/${src}.jpg`,
  alt,
  position,
});

const bs = {
  title: "Historijat",
  /** Small labels beside the hero. */
  labels: { seat: "Sjedište", founded: "Početak rada" },
  hero: {
    eyebrow: "Historijat",
    heading: ["Historijat Medrese", "„Mehmed Fatih“"],
    place: "Donji Milješ, Tuzi",
    date: { label: "6. oktobra 2008.", iso: "2008-10-06" },
    image: photo(
      "historijat/medresa-zrak",
      "Zgrada Medrese „Mehmed Fatih“ u Donjem Milješu, iz zraka",
      "50% 62%",
    ),
    caption: "Medresa „Mehmed Fatih“, Donji Milješ, Tuzi",
  },

  chapters: {
    founding: {
      marker: "2008",
      label: "Osnivanje",
      date: { label: "6. oktobra 2008.", iso: "2008-10-06" },
      text: "Medresa „Mehmed Fatih“ sa sjedištem u Donjem Milješu, opština Tuzi, osnovana je kao prva savremena islamska srednjoškolska ustanova u Crnoj Gori, s ciljem da pruži kvalitetno obrazovanje mladim muslimanima u duhu vjere, znanja i odgovornosti. Zvanično je otpočela sa radom 6. oktobra 2008. godine, pod okriljem Mešihata Islamske zajednice u Crnoj Gori.",
      image: photo("story-arch", "Ulaz s lukom i minaretom u dvorištu Medrese", "40% 50%"),
    },
    figures: {
      label: "Od tada do danas",
      items: [
        { value: "800 +", label: "svršenih učenika/učenica" },
        { value: "10 000 +", label: "spremljenih obroka u školskoj menzi" },
        { value: "15 700 +", label: "održanih školskih časova" },
      ],
    },
    accreditation: {
      marker: "2015",
      label: "Svršenici i akreditacija",
      text: "Od tada do danas, Medresa je iznjedrila preko osam stotina svršenika i svršenica koji su nastavili svoje školovanje na domaćim i međunarodnim univerzitetima, te postali prepoznatljivi nosioci moralnih i intelektualnih vrijednosti u svojoj zajednici. Program Medrese od 2015. godine ima zvaničnu akreditaciju Nacionalnog savjeta za obrazovanje Crne Gore, čime su diplome ove škole potpuno priznate i ravnopravne s gimnazijskim i stručnim školama. To je omogućilo učenicima direktan pristup univerzitetima u Crnoj Gori, regionu i šire.",
      image: photo(
        "generacije/generacija-01",
        "Prva generacija maturanata Medrese „Mehmed Fatih“, 2008.–2012.",
      ),
      caption: "Prva generacija maturanata, 2008.–2012.",
    },
    women: {
      label: "Žensko odjeljenje u Tuzima",
      text: "U okviru matične škole u Tuzima razvijeno je i žensko odjeljenje Medrese, u kojoj djevojke pohađaju nastavu, borave u internatu i imaju pristup svim resursima i programima škole – kako vjerskim tako i općeobrazovnim. Time je otvoren prostor za obrazovanje muslimanki u ambijentu koji njeguje islamski moral, pedagošku pažnju i savremene obrazovne standarde.",
      image: photo(
        "historijat/zensko-odjeljenje",
        "Žensko odjeljenje Medrese „Mehmed Fatih“ u Tuzima",
        "55% 55%",
      ),
    },
    rozaje: {
      marker: ["28. 9.", "2015."],
      date: { label: "28. septembra 2015.", iso: "2015-09-28" },
      label: "Područno žensko odjeljenje",
      place: "Rožaje",
      text: "Kao odgovor na potrebe muslimanske zajednice u sjevernim krajevima zemlje, 28. septembra 2015. godine, otvoreno je Područno žensko odjeljenje Medrese „Mehmed Fatih“ u Rožajama. Smješteno u obnovljenoj vakufskoj zgradi, ovo odjeljenje je rezultat posvećenosti Islamske zajednice, podrške turske razvojne agencije TIKA i lokalnih dobrotvora. Od samog početka, škola u Rožajama prati pedagoške i duhovne standarde matične škole u Tuzima, nudeći besplatno i kvalitetno školovanje djevojkama iz tog regiona.",
    },
    today: {
      marker: "Danas",
      figure: { value: "360 +", label: "učenika i učenica" },
      text: "Danas Medresa „Mehmed Fatih“ broji preko 360 učenika i učenica, raspoređenih u muškom odjeljenju u Tuzima, ženskom odjeljenju u Tuzima i ženskom odjeljenju u Rožajama. Nastava se izvodi dvojezično – na bosanskom i albanskom jeziku – a internatski život organiziran je tako da učenici i učenice imaju potpunu brigu, nadzor i vođenje kroz odgojno-obrazovni proces.",
      image: photo(
        "historijat/kampus-zrak",
        "Kampus Medrese „Mehmed Fatih“ u Tuzima s džamijom, iz zraka",
        "50% 45%",
      ),
    },
  },

  closing: {
    bs: {
      welcome: "Dobro došli u Medresu „Mehmed Fatih“ – školu znanja, odgoja i vrijednosti.",
      since: "Od 2008. godine odgajamo generacije koje misle srcem, a djeluju znanjem.",
      verse: "Reci: „Zar su isti oni koji znaju i oni koji ne znaju?“",
      source: "Kur’an, Ez-Zumer, 9",
    },
  },
} as const;

type HistorijatContent = Localized<typeof bs>;
const ch = bs.chapters;

/** English: the medresa.me English page (Weglot), revised („Meshihat“, not „Mosque“; „the Medresa“). */
const en: HistorijatContent = {
  title: "History",
  labels: { seat: "Seat", founded: "Founded" },
  hero: {
    eyebrow: "History",
    heading: ["History of the Medresa", "“Mehmed Fatih”"],
    place: bs.hero.place,
    date: { ...bs.hero.date, label: "6 October 2008" },
    image: { ...bs.hero.image, alt: "The Medresa “Mehmed Fatih” building in Donji Milješ, from the air" },
    caption: "Medresa “Mehmed Fatih”, Donji Milješ, Tuzi",
  },
  chapters: {
    founding: {
      marker: ch.founding.marker,
      label: "Founding",
      date: { ...ch.founding.date, label: "6 October 2008" },
      text: "The Medresa “Mehmed Fatih”, with its seat in Donji Milješ in the municipality of Tuzi, was founded as the first contemporary Islamic secondary school in Montenegro, with the aim of giving young Muslims a quality education in the spirit of faith, knowledge and responsibility. It officially began its work on 6 October 2008, under the auspices of the Meshihat of the Islamic Community in Montenegro.",
      image: { ...ch.founding.image, alt: "An arched entrance and a minaret in the Medresa courtyard" },
    },
    figures: {
      label: "From then until today",
      items: [
        { value: "800 +", label: "male and female graduates" },
        { value: "10 000 +", label: "meals prepared in the school canteen" },
        { value: "15 700 +", label: "school lessons held" },
      ],
    },
    accreditation: {
      marker: ch.accreditation.marker,
      label: "Graduates and accreditation",
      text: "Since then, the Medresa has produced more than eight hundred male and female graduates who have continued their education at universities at home and abroad, and have become recognised bearers of moral and intellectual values in their communities. Since 2015 the Medresa’s programme has been officially accredited by the National Council for Education of Montenegro, so the school’s diplomas are fully recognised and equal to those of grammar and vocational schools. This has given students direct access to universities in Montenegro, the region and beyond.",
      image: {
        ...ch.accreditation.image,
        alt: "The first generation of graduates of the Medresa “Mehmed Fatih”, 2008–2012",
      },
      caption: "The first generation of graduates, 2008–2012",
    },
    women: {
      label: "The girls’ department in Tuzi",
      text: "Within the main school in Tuzi, a girls’ department of the Medresa has also been developed, where girls attend lessons, live in the boarding house and have access to all of the school’s resources and programmes – both religious and general. This opened a space for the education of Muslim women in a setting that nurtures Islamic morals, pedagogical care and contemporary educational standards.",
      image: { ...ch.women.image, alt: "The girls’ department of the Medresa “Mehmed Fatih” in Tuzi" },
    },
    rozaje: {
      marker: ["28 Sep", "2015"],
      date: { ...ch.rozaje.date, label: "28 September 2015" },
      label: "Regional girls’ department",
      place: ch.rozaje.place,
      text: "In response to the needs of the Muslim community in the northern parts of the country, the Regional Girls’ Department of the Medresa “Mehmed Fatih” in Rožaje was opened on 28 September 2015. Housed in a renovated waqf building, the department is the result of the dedication of the Islamic Community, the support of the Turkish development agency TIKA and local benefactors. From the very beginning, the school in Rožaje has followed the pedagogical and spiritual standards of the main school in Tuzi, offering girls from the region a free, quality education.",
    },
    today: {
      marker: "Today",
      figure: { value: "360 +", label: "male and female students" },
      text: "Today the Medresa “Mehmed Fatih” has more than 360 male and female students, in the boys’ department in Tuzi, the girls’ department in Tuzi and the girls’ department in Rožaje. Lessons are taught bilingually – in Bosnian and Albanian – and boarding life is organised so that students receive full care, supervision and guidance throughout their education and upbringing.",
      image: {
        ...ch.today.image,
        alt: "The Medresa “Mehmed Fatih” campus in Tuzi with the mosque, from the air",
      },
    },
  },
  closing: {
    bs: {
      welcome: "Welcome to the Medresa “Mehmed Fatih” – a school of knowledge, upbringing and values.",
      since:
        "Since 2008 we have been raising generations who think with their hearts and act with knowledge.",
      verse: "Say: “Are those who know equal to those who do not know?”",
      source: "Qur’an, Az-Zumar, 9",
    },
  },
};

/** Shqip: the medresa.me Albanian page (Weglot), revised („Mesihati“, „nxënës“); the closing is the source's own Albanian. */
const sq: HistorijatContent = {
  title: "Historiku",
  labels: { seat: "Selia", founded: "Fillimi i punës" },
  hero: {
    eyebrow: "Historiku",
    heading: ["Historiku i Medresesë", "“Mehmed Fatih”"],
    place: "Donji Milješ, Tuz",
    date: { ...bs.hero.date, label: "6 tetor 2008" },
    image: { ...bs.hero.image, alt: "Ndërtesa e Medresesë “Mehmed Fatih” në Donji Milješ, nga ajri" },
    caption: "Medreseja “Mehmed Fatih”, Donji Milješ, Tuz",
  },
  chapters: {
    founding: {
      marker: ch.founding.marker,
      label: "Themelimi",
      date: { ...ch.founding.date, label: "6 tetor 2008" },
      text: "Medreseja “Mehmed Fatih”, me seli në Donji Milješ, komuna e Tuzit, u themelua si institucioni i parë bashkëkohor islam i arsimit të mesëm në Mal të Zi, me qëllim që t’u ofrojë të rinjve myslimanë arsim cilësor në frymën e besimit, dijes dhe përgjegjësisë. Zyrtarisht filloi punën më 6 tetor 2008, nën kujdesin e Mesihatit të Bashkësisë Islame në Mal të Zi.",
      image: { ...ch.founding.image, alt: "Hyrje me hark dhe minare në oborrin e Medresesë" },
    },
    figures: {
      label: "Nga atëherë e deri sot",
      items: [
        { value: "800 +", label: "maturantë dhe maturante" },
        { value: "10 000 +", label: "vakte të përgatitura në mensën e shkollës" },
        { value: "15 700 +", label: "orë mësimore të mbajtura" },
      ],
    },
    accreditation: {
      marker: ch.accreditation.marker,
      label: "Maturantët dhe akreditimi",
      text: "Nga atëherë e deri sot, Medreseja ka nxjerrë mbi tetëqind maturantë dhe maturante që kanë vazhduar shkollimin në universitete vendase dhe ndërkombëtare, duke u bërë bartës të njohur të vlerave morale dhe intelektuale në bashkësinë e tyre. Që nga viti 2015, programi i Medresesë ka akreditimin zyrtar të Këshillit Kombëtar për Arsim të Malit të Zi, me çka diplomat e kësaj shkolle janë plotësisht të njohura dhe të barabarta me ato të gjimnazeve dhe shkollave profesionale. Kjo u ka mundësuar nxënësve qasje të drejtpërdrejtë në universitete në Mal të Zi, në rajon dhe më gjerë.",
      image: {
        ...ch.accreditation.image,
        alt: "Gjenerata e parë e maturantëve të Medresesë “Mehmed Fatih”, 2008–2012",
      },
      caption: "Gjenerata e parë e maturantëve, 2008–2012",
    },
    women: {
      label: "Paralelja e vajzave në Tuz",
      text: "Në kuadër të shkollës amë në Tuz është zhvilluar edhe paralelja e vajzave e Medresesë, ku vajzat ndjekin mësimin, qëndrojnë në konvikt dhe kanë qasje në të gjitha burimet dhe programet e shkollës – si fetare, ashtu edhe të arsimit të përgjithshëm. Me këtë u hap hapësirë për arsimimin e grave myslimane në një mjedis që kultivon moralin islam, kujdesin pedagogjik dhe standardet bashkëkohore arsimore.",
      image: { ...ch.women.image, alt: "Paralelja e vajzave e Medresesë “Mehmed Fatih” në Tuz" },
    },
    rozaje: {
      marker: ch.rozaje.marker,
      date: { ...ch.rozaje.date, label: "28 shtator 2015" },
      label: "Paralelja rajonale e vajzave",
      place: "Rozhajë",
      text: "Si përgjigje ndaj nevojave të bashkësisë myslimane në pjesët veriore të vendit, më 28 shtator 2015 u hap Paralelja rajonale e vajzave e Medresesë “Mehmed Fatih” në Rozhajë. E vendosur në një ndërtesë vakëfi të rinovuar, kjo paralele është rezultat i përkushtimit të Bashkësisë Islame, mbështetjes së agjencisë turke për zhvillim TIKA dhe bamirësve vendas. Që nga fillimi, shkolla në Rozhajë ndjek standardet pedagogjike dhe shpirtërore të shkollës amë në Tuz, duke u ofruar vajzave nga ai rajon shkollim falas dhe cilësor.",
    },
    today: {
      marker: "Sot",
      figure: { value: "360 +", label: "nxënës dhe nxënëse" },
      text: "Sot Medreseja “Mehmed Fatih” numëron mbi 360 nxënës dhe nxënëse, të shpërndarë në paralelen e djemve në Tuz, paralelen e vajzave në Tuz dhe paralelen e vajzave në Rozhajë. Mësimi zhvillohet në dy gjuhë – në boshnjakisht dhe në shqip – ndërsa jeta në konvikt është e organizuar në mënyrë që nxënësit dhe nxënëset të kenë kujdes, mbikëqyrje dhe udhëheqje të plotë gjatë procesit edukativo-arsimor.",
      image: { ...ch.today.image, alt: "Kampusi i Medresesë “Mehmed Fatih” në Tuz me xhaminë, nga ajri" },
    },
  },
  closing: {
    bs: {
      welcome: "Mirë se erdhët në Medresenë “Mehmed Fatih” – shkollë e dijes, edukatës dhe vlerave.",
      since: "Që nga viti 2008, ne edukojmë breza që mendojnë me zemër dhe veprojnë me dije.",
      verse: "Thuaj: “A janë të barabartë ata që dinë me ata që nuk dinë?”",
      source: "Kurani, Ez-Zumer, 9",
    },
  },
};

export const historijatContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const historijat = bs;
