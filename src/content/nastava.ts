import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Nastava i predmeti — the text of medresa.me/nastava, word for word and in the
 * source's order. Only typography follows this site: „…“ quotation marks, a
 * dash bound to the word before it, and the source's typed list dashes („–“,
 * „-“) rendered as list markup instead of characters.
 *
 * Media: the page's one photograph (the Medresa's arcaded courtyard), unaltered.
 * The title banner's textbook background is decorative and not used.
 */
const bs = {
  /** The page's title (its banner and menu label) and the heading under it. */
  title: "Nastava i predmeti",
  heading: "Nastava i program Medrese „Mehmed Fatih“",

  intro: [
    "Obrazovni program Medrese „Mehmed Fatih“ temelji se na harmoničnom spoju islamskog i opšteobrazovnog kurikuluma, sa ciljem formiranja cjelovite ličnosti – učenika i učenica koji su duhovno izgrađeni, moralno usmjereni i akademski kompetentni.",
    "Medresa funkcioniše kao četverogodišnja srednja škola internatskog tipa, a nastavni plan usklađen je sa standardima Ministarstva prosvjete Crne Gore i Nacionalnog savjeta za obrazovanje.",
  ],

  pillarsLead: "Dva osnovna stuba našeg obrazovanja su:",

  pillars: [
    {
      id: "opsteobrazovni",
      heading: "Opšteobrazovni predmeti",
      lead: "Učenici i učenice pohađaju sve obavezne predmete propisane za srednje škole u Crnoj Gori, uključujući:",
      subjects: [
        "jezik i književnost (bosanski, crnogorski, hrvatski, srpski i albanski jezik)",
        "strani jezici (engleski, arapski, turski)",
        "matematiku, biologiju, fiziku, hemiju",
        "istoriju, geografiju, informatiku",
        "fizičko i zdravstveno obrazovanje",
      ],
      closing: null,
    },
    {
      id: "islamski",
      heading: "Islamski predmeti",
      lead: "Posebno mjesto u kurikulumu zauzimaju predmeti iz islamskih nauka, kao što su:",
      subjects: [
        "Kur’an i tedžvid",
        "Akaid (islamsko vjerovanje)",
        "Fikh (islamsko pravo)",
        "Hadis (Poslanikova tradicija)",
        "Tefsir (tumačenje Kur’ana)",
        "Arapski jezik",
        "Povijest islama",
        "Etika i ahlak (moral)",
      ],
      closing:
        "Ovi predmeti imaju za cilj razvijanje duhovne svijesti, islamskog identiteta i osjetljivosti prema društvenim i etičkim pitanjima.",
    },
  ],

  image: {
    src: "/images/nastava/dvoriste.jpg",
    width: 1536,
    height: 1024,
    alt: "Dvorište Medrese „Mehmed Fatih“ s arkadama, zelenilom i stazom prema ulazu",
  },

  language: {
    heading: "Nastava i jezik",
    // As on the source (it ends without a full stop).
    text: "Nastava se odvija dvojezično – na bosanskom i albanskom jeziku – kako bi se osigurala inkluzivnost i razumijevanje u multikulturalnom i višejezičnom okruženju. Posebna pažnja posvećena je razvijanju komunikacijskih vještina i afirmaciji vlastitog kulturnog identiteta",
  },

  activities: {
    heading: "Praktična nastava i vannastavne aktivnosti",
    items: [
      "učenje Kur’ana i hafiske grupe",
      "hor i recitatorske sekcije",
      "dramska, literarna i debatna sekcija",
      "učešće na takmičenjima, seminarima i manifestacijama",
      "društveno-korisni rad i humanitarne akcije",
    ],
  },

  goals: {
    heading: "Cilj programa",
    items: [
      "moralno stabilne i duhovno svjesne osobe",
      "obrazovani i odgovorni pojedinci spremni za nastavak visokog obrazovanja",
      "aktivni i korisni članovi svojih zajednica",
    ],
  },

  faq: {
    heading: "Često postavljana pitanja",
    items: [
      {
        q: "Koji su uslovi za upis u prvi razred medrese?",
        a: [
          "Upis u prvi razred Medrese „Mehmed Fatih“ vrši se prema jasno definisanim kriterijima. Kandidat/kinja treba da ima završenu osnovnu školu, primjerno vladanje i interesovanje za opšte i islamske nauke.",
          "Upis uključuje provjeru osnovnog znanja, razgovor sa komisijom i predaju potrebne dokumentacije u skladu sa godišnjim konkursom.",
        ],
      },
      {
        q: "Da li Medresa nudi smještaj za učenike koji dolaze iz drugih gradova?",
        a: [
          "Da. Medresa obezbjeđuje smještaj u internatu za učenike iz drugih gradova i država.",
          "Smještaj uključuje organizovan odgojno-obrazovni ambijent, nadzor odgajatelja, ishranu i uslove za učenje i slobodne aktivnosti. Cilj internatskog života je kreiranje sigurnog, disciplinovanog i podsticajnog okruženja za obrazovanje i lični razvoj učenika.",
        ],
      },
      {
        q: "Kako mogu doći do dodatnih informacija ili postaviti pitanje?",
        a: [
          "Dodatne informacije dostupne su putem zvanične web stranice, telefona ili e-maila medrese.",
          "Učenici i roditelji mogu postaviti pitanja o upisu, programu školovanja, internatu i vannastavnim aktivnostima. Stručna služba medrese odgovara u najkraćem roku.",
        ],
      },
    ],
  },

  /** The regional department, as the source closes the page with it. */
  rozaje: {
    heading: "Područno odjeljenje u Rožajama",
    address: "Ulica Raduna Đukića 1, Rožaje",
    contactLabel: "Kontakt",
    contacts: [
      { role: "Upravnik", name: "R. Murić", phone: "+382/67-546-307" },
      { role: "Sekretar", name: "R. Luboder", phone: "+382/69-5250-750" },
    ],
    email: "ramizluboder@gmail.com",
  },
} as const;

export type NastavaContent = Localized<typeof bs>;
const [gen0, isl0] = bs.pillars;
const [boss, sec] = bs.rozaje.contacts;

/** English: the medresa.me English page (Weglot), revised („the Medresa“, subject names). */
const en: NastavaContent = {
  title: "Teaching and Subjects",
  heading: "Teaching and the Programme of the Medresa “Mehmed Fatih”",
  intro: [
    "The educational programme of the Medresa “Mehmed Fatih” rests on a harmonious union of the Islamic and the general curriculum, with the aim of forming a whole person – male and female students who are spiritually grounded, morally oriented and academically competent.",
    "The Medresa is a four-year boarding secondary school, and its curriculum is aligned with the standards of the Ministry of Education of Montenegro and the National Council for Education.",
  ],
  pillarsLead: "The two fundamental pillars of our education are:",
  pillars: [
    {
      id: gen0.id,
      heading: "General education subjects",
      lead: "Male and female students attend all compulsory subjects prescribed for secondary schools in Montenegro, including:",
      subjects: [
        "language and literature (Bosnian, Montenegrin, Croatian, Serbian and Albanian)",
        "foreign languages (English, Arabic, Turkish)",
        "mathematics, biology, physics, chemistry",
        "history, geography, computer science",
        "physical and health education",
      ],
      closing: null,
    },
    {
      id: isl0.id,
      heading: "Islamic subjects",
      lead: "A special place in the curriculum belongs to subjects of the Islamic sciences, such as:",
      subjects: [
        "Qur’an and Tajweed",
        "Aqidah (Islamic creed)",
        "Fiqh (Islamic law)",
        "Hadith (the Prophet’s tradition)",
        "Tafsir (interpretation of the Qur’an)",
        "Arabic",
        "History of Islam",
        "Ethics and akhlaq (morals)",
      ],
      closing:
        "These subjects aim to develop spiritual awareness, Islamic identity and sensitivity to social and ethical questions.",
    },
  ],
  image: {
    ...bs.image,
    alt: "The courtyard of the Medresa “Mehmed Fatih” with arcades, greenery and a path to the entrance",
  },
  language: {
    heading: "Teaching and language",
    text: "Lessons are taught bilingually – in Bosnian and Albanian – to ensure inclusion and understanding in a multicultural and multilingual environment. Particular attention is given to developing communication skills and affirming one’s own cultural identity",
  },
  activities: {
    heading: "Practical lessons and extracurricular activities",
    items: [
      "learning the Qur’an and hafiz groups",
      "choir and recitation sections",
      "drama, literary and debate sections",
      "taking part in competitions, seminars and events",
      "community service and humanitarian projects",
    ],
  },
  goals: {
    heading: "Programme goals",
    items: [
      "morally steadfast and spiritually aware people",
      "educated and responsible individuals ready to continue into higher education",
      "active and useful members of their communities",
    ],
  },
  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        q: "What are the requirements for enrolling in the first year of the Medresa?",
        a: [
          "Enrolment in the first year of the Medresa “Mehmed Fatih” follows clearly defined criteria. Candidates must have completed primary school, show exemplary conduct and an interest in general and Islamic sciences.",
          "Enrolment includes a test of basic knowledge, an interview with the committee and submission of the required documents, in line with the annual call for applications.",
        ],
      },
      {
        q: "Does the Medresa offer accommodation for students coming from other towns?",
        a: [
          "Yes. The Medresa provides boarding accommodation for students from other towns and countries.",
          "Accommodation includes an organised educational environment, supervision by tutors, meals, and conditions for study and free-time activities. The aim of boarding life is to create a safe, disciplined and encouraging environment for the education and personal development of students.",
        ],
      },
      {
        q: "How can I get more information or ask a question?",
        a: [
          "More information is available through the Medresa’s official website, by phone or by e-mail.",
          "Students and parents can ask about enrolment, the school programme, boarding and extracurricular activities. The Medresa’s staff will reply as soon as possible.",
        ],
      },
    ],
  },
  rozaje: {
    heading: "Regional Department in Rožaje",
    address: "Raduna Đukića Street 1, Rožaje",
    contactLabel: "Contact",
    contacts: [
      { ...boss, role: "Head" },
      { ...sec, role: "Secretary" },
    ],
    email: bs.rozaje.email,
  },
};

/** Shqip: the medresa.me Albanian page (Weglot), revised („nxënës“, subject names, „lëndë“). */
const sq: NastavaContent = {
  title: "Mësimi dhe lëndët",
  heading: "Mësimi dhe programi i Medresesë “Mehmed Fatih”",
  intro: [
    "Programi arsimor i Medresesë “Mehmed Fatih” mbështetet në një ndërthurje harmonike të kurrikulës islame dhe asaj të arsimit të përgjithshëm, me qëllim formimin e një personaliteti të plotë – nxënës dhe nxënëse të ndërtuar shpirtërisht, të orientuar moralisht dhe të aftë akademikisht.",
    "Medreseja funksionon si shkollë e mesme katërvjeçare me konvikt, ndërsa plani mësimor është në përputhje me standardet e Ministrisë së Arsimit të Malit të Zi dhe të Këshillit Kombëtar për Arsim.",
  ],
  pillarsLead: "Dy shtyllat themelore të arsimit tonë janë:",
  pillars: [
    {
      id: gen0.id,
      heading: "Lëndët e arsimit të përgjithshëm",
      lead: "Nxënësit dhe nxënëset ndjekin të gjitha lëndët e detyrueshme të përcaktuara për shkollat e mesme në Mal të Zi, duke përfshirë:",
      subjects: [
        "gjuhën dhe letërsinë (boshnjake, malazeze, kroate, serbe dhe shqipe)",
        "gjuhët e huaja (anglisht, arabisht, turqisht)",
        "matematikën, biologjinë, fizikën, kiminë",
        "historinë, gjeografinë, informatikën",
        "edukatën fizike dhe shëndetësore",
      ],
      closing: null,
    },
    {
      id: isl0.id,
      heading: "Lëndët islame",
      lead: "Një vend të veçantë në kurrikulë zënë lëndët e shkencave islame, si:",
      subjects: [
        "Kurani dhe texhvidi",
        "Akaidi (besimi islam)",
        "Fikhu (e drejta islame)",
        "Hadithi (tradita e Pejgamberit)",
        "Tefsiri (komentimi i Kuranit)",
        "Gjuha arabe",
        "Historia e Islamit",
        "Etika dhe ahlaku (morali)",
      ],
      closing:
        "Këto lëndë synojnë zhvillimin e vetëdijes shpirtërore, identitetit islam dhe ndjeshmërisë ndaj çështjeve shoqërore dhe etike.",
    },
  ],
  image: {
    ...bs.image,
    alt: "Oborri i Medresesë “Mehmed Fatih” me arkada, gjelbërim dhe shteg drejt hyrjes",
  },
  language: {
    heading: "Mësimi dhe gjuha",
    text: "Mësimi zhvillohet në dy gjuhë – në boshnjakisht dhe në shqip – për të siguruar gjithëpërfshirje dhe mirëkuptim në një mjedis shumëkulturor dhe shumëgjuhësh. Vëmendje e veçantë i kushtohet zhvillimit të aftësive të komunikimit dhe afirmimit të identitetit kulturor të secilit",
  },
  activities: {
    heading: "Mësimi praktik dhe aktivitetet jashtëmësimore",
    items: [
      "mësimi i Kuranit dhe grupet e hafizëve",
      "kori dhe seksionet e recitimit",
      "seksioni i dramës, letërsisë dhe debatit",
      "pjesëmarrja në gara, seminare dhe manifestime",
      "puna shoqërore e dobishme dhe aksionet humanitare",
    ],
  },
  goals: {
    heading: "Qëllimi i programit",
    items: [
      "persona moralisht të qëndrueshëm dhe shpirtërisht të vetëdijshëm",
      "individë të arsimuar dhe të përgjegjshëm, të gatshëm për të vazhduar arsimin e lartë",
      "anëtarë aktivë dhe të dobishëm të bashkësive të tyre",
    ],
  },
  faq: {
    heading: "Pyetje të shpeshta",
    items: [
      {
        q: "Cilat janë kushtet për regjistrim në klasën e parë të Medresesë?",
        a: [
          "Regjistrimi në klasën e parë të Medresesë “Mehmed Fatih” bëhet sipas kritereve të përcaktuara qartë. Kandidati/kandidatja duhet të ketë përfunduar shkollën fillore, të ketë sjellje shembullore dhe interes për shkencat e përgjithshme dhe islame.",
          "Regjistrimi përfshin verifikimin e njohurive bazë, bisedën me komisionin dhe dorëzimin e dokumentacionit të nevojshëm në përputhje me konkursin vjetor.",
        ],
      },
      {
        q: "A ofron Medreseja akomodim për nxënësit që vijnë nga qytete të tjera?",
        a: [
          "Po. Medreseja siguron akomodim në konvikt për nxënësit nga qytete dhe shtete të tjera.",
          "Akomodimi përfshin një mjedis të organizuar edukativo-arsimor, mbikëqyrjen e edukatorëve, ushqimin dhe kushtet për mësim dhe aktivitete të lira. Qëllimi i jetës në konvikt është krijimi i një mjedisi të sigurt, të disiplinuar dhe nxitës për arsimimin dhe zhvillimin personal të nxënësve.",
        ],
      },
      {
        q: "Si mund të marr informacione shtesë ose të bëj një pyetje?",
        a: [
          "Informacione shtesë janë të disponueshme përmes faqes zyrtare të internetit, telefonit ose e-mailit të Medresesë.",
          "Nxënësit dhe prindërit mund të bëjnë pyetje për regjistrimin, programin shkollor, konviktin dhe aktivitetet jashtëmësimore. Shërbimi profesional i Medresesë përgjigjet në afatin më të shkurtër.",
        ],
      },
    ],
  },
  rozaje: {
    heading: "Njësia rajonale në Rozhajë",
    address: "Rruga Raduna Đukića 1, Rožaje",
    contactLabel: "Kontakti",
    contacts: [
      { ...boss, role: "Drejtues" },
      { ...sec, role: "Sekretar" },
    ],
    email: bs.rozaje.email,
  },
};

export const nastavaContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const nastava = bs;
