import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Takmičenja i uspjesi — the text of medresa.me/tiu, word for word and in the
 * source's chronological order. Only typography follows this site: „…“
 * quotation marks, a dash bound to the word before it, an unbreakable score,
 * and the closing list's typed dashes rendered as list markup.
 *
 * Each year keeps its source lines in order. A year's lines are grouped into
 * the achievements they describe (2025 and 2024 have two each); within an
 * achievement the first line states it, the next ones add to it.
 *
 * `emphasis` names phrases already in a line (names, results) that are set a
 * little stronger; the wording is never changed.
 */
export type Line = { text: string; emphasis?: readonly string[] };
export type Achievement = readonly Line[];
export type Year = { year: string; achievements: readonly Achievement[] };

const bs = {
  /** The page's title (its banner and menu label) and the heading under it. */
  title: "Takmičenja i uspjesi",
  heading: "Najveća postignuća učenika Medrese „Mehmed Fatih“",
  intro:
    "Od svog osnivanja 2008. godine, Medresa „Mehmed Fatih“ iz Tuzi predstavlja snažan spoj duhovnog obrazovanja i savremenih znanja. Tokom posljednjih godina, učenici ove škole postigli su brojne uspjehe na državnim i međunarodnim takmičenjima, donoseći priznanja kako svojoj školi, tako i Islamskoj zajednici u Crnoj Gori. U nastavku donosimo hronološki pregled najznačajnijih rezultata:",

  years: [
    {
      year: "2025",
      achievements: [
        [
          {
            text: "Učenici Medrese „Mehmed Fatih“ osvojili su prvo mjesto na međumedresanskom fudbalskom turniru, ostvarivši jedno od značajnih postignuća Medrese u 2025. godini. U finalnoj utakmici savladali su ekipu Elči Ibrahim-pašine medrese iz Travnika rezultatom 6 : 3, pokazavši izuzetnu igru i snažan timski duh.",
            emphasis: ["prvo mjesto"],
          },
        ],
        [
          {
            text: "Povodom 17 godina postojanja Medrese, organizovana je svečana akademija na kojoj su maturanti predstavili svoje završne projekte, istraživačke radove i vannastavna postignuća.",
            emphasis: ["17 godina"],
          },
          {
            text: "Ovaj jubilej bio je prilika da se podsjetimo na više od 700 svršenika škole, koji danas studiraju i djeluju širom regiona i svijeta.",
          },
        ],
      ],
    },
    {
      year: "2024",
      achievements: [
        [
          {
            text: "Ekipa Medrese osvojila je zlatnu medalju na međunarodnom džudo turniru „Tivat Open“, u seniorskoj kategoriji, u konkurenciji klubova iz više zemalja regiona.",
            emphasis: ["zlatnu medalju"],
          },
          {
            text: "Bio je to historijski trenutak – prva zlatna medalja jednog tima iz medrese u Crnoj Gori na ovom prestižnom sportskom događaju.",
          },
        ],
        [
          {
            text: "Učenici Ilhan Osmanović, Amina Kačar, Medina Mustafić i Elisa Micović ostvarili su izvanredan uspjeh na državnom takmičenju iz engleskog jezika, osvojivši prvo mjesto ekipno, dok je Ilhan zauzeo drugo mjesto pojedinačno.",
            emphasis: ["Ilhan Osmanović, Amina Kačar, Medina Mustafić i Elisa Micović", "prvo mjesto ekipno"],
          },
          {
            text: "Zahvaljujući ovom uspjehu, izabrani su da predstavljaju Crnu Goru na regionalnoj jezičkoj olimpijadi.",
          },
        ],
      ],
    },
    {
      year: "2023",
      achievements: [
        [
          {
            text: "Debatni klub Medrese – Ahmed Bektešević, Ajla Orahovac i Dina Toskić, pod mentorstvom prof. Elmaza Osmanovića, osvojio je prvo mjesto u emisiji „Mislionica“ na RTCG-u, čime su postali nacionalni šampioni u debatovanju za školsku godinu 2022/23.",
            emphasis: ["Ahmed Bektešević, Ajla Orahovac i Dina Toskić", "nacionalni šampioni"],
          },
          {
            text: "Pobjednički niz uključivao je debate protiv renomiranih gimnazija iz Podgorice, Budve, Pljevalja i Bijelog Polja.",
          },
        ],
      ],
    },
    {
      year: "2022",
      achievements: [
        [
          {
            text: "Ekipa „Plan B“ – Dina Škepović, Mensura Drešević i Eman Almafalha – osvojila prvo mjesto na opštinskom takmičenju iz prve pomoći u organizaciji Crvenog krsta Tuzi, te ostvarila plasman na državno finale.",
            emphasis: ["Dina Škepović, Mensura Drešević i Eman Almafalha", "prvo mjesto"],
          },
          {
            text: "Nakon višenedjeljne stručne obuke, učenici su pokazali izuzetnu spremnost, znanje i timsku koordinaciju.",
          },
        ],
      ],
    },
    {
      year: "2021",
      achievements: [
        [
          {
            text: "Adela Bašini – osvojila prvo mjesto na državnom takmičenju iz filozofije, te predstavljala Crnu Goru na 27. UNESCO-voj Međunarodnoj filozofskoj olimpijadi u Rimu.",
            emphasis: ["Adela Bašini", "prvo mjesto"],
          },
          {
            text: "Na ovom prestižnom svjetskom skupu mladih mislilaca, Adela je pokazala izvanredno umijeće argumentacije, kritičkog mišljenja i poznavanja etike.",
          },
        ],
      ],
    },
  ] satisfies Year[],

  closing: {
    heading: "POBJEDNICI KOJI OSTAVLJAJU TRAG",
    lead: "Uspjesi učenika Medrese „Mehmed Fatih“ nisu ograničeni samo na učionicu. Oni se redovno takmiče i ostvaruju priznanja u:",
    items: [
      "hifzu i tilavetu Kur’ana,",
      "ilahijama i duhovnoj muzici,",
      "literarnim i esejističkim konkursima,",
      "sportskim i humanitarnim projektima,",
      "međunarodnim debatnim forumima i programima liderstva.",
    ],
  },
} as const;

export type TiuContent = Localized<typeof bs>;
const N = " ";

/** English: the medresa.me English page (Weglot), revised („the Medresa“, names untouched). */
const en: TiuContent = {
  title: "Competitions and Achievements",
  heading: "The greatest achievements of the students of the Medresa “Mehmed Fatih”",
  intro:
    "Since its founding in 2008, the Medresa “Mehmed Fatih” in Tuzi has been a strong union of spiritual education and contemporary knowledge. In recent years its students have won numerous successes at national and international competitions, bringing recognition both to their school and to the Islamic Community in Montenegro. Below is a chronological overview of the most significant results:",
  years: [
    {
      year: "2025",
      achievements: [
        [
          {
            text: `Students of the Medresa “Mehmed Fatih” won first place at the inter-medresa football tournament, one of the Medresa’s significant achievements in 2025. In the final they defeated the team of the Elči Ibrahim-pasha Medresa from Travnik 6${N}:${N}3, showing outstanding play and strong team spirit.`,
            emphasis: ["first place"],
          },
        ],
        [
          {
            text: "To mark 17 years of the Medresa, a ceremonial academy was held at which the graduates presented their final projects, research papers and extracurricular achievements.",
            emphasis: ["17 years"],
          },
          {
            text: "The jubilee was an occasion to remember the more than 700 graduates of the school, who today study and work throughout the region and the world.",
          },
        ],
      ],
    },
    {
      year: "2024",
      achievements: [
        [
          {
            text: "The Medresa team won the gold medal at the international judo tournament “Tivat Open”, in the senior category, competing with clubs from several countries of the region.",
            emphasis: ["the gold medal"],
          },
          {
            text: `It was a historic moment${N}– the first gold medal for a team from a medresa in Montenegro at this prestigious sporting event.`,
          },
        ],
        [
          {
            text: "Students Ilhan Osmanović, Amina Kačar, Medina Mustafić and Elisa Micović achieved outstanding success at the national English language competition, winning first place as a team, while Ilhan took second place individually.",
            emphasis: [
              "Ilhan Osmanović, Amina Kačar, Medina Mustafić and Elisa Micović",
              "first place as a team",
            ],
          },
          {
            text: "Thanks to this success, they were chosen to represent Montenegro at the regional language olympiad.",
          },
        ],
      ],
    },
    {
      year: "2023",
      achievements: [
        [
          {
            text: `The Medresa debate club${N}– Ahmed Bektešević, Ajla Orahovac and Dina Toskić, mentored by Prof. Elmaz Osmanović, won first place on the RTCG programme “Mislionica”, becoming national debating champions for the 2022/23 school year.`,
            emphasis: ["Ahmed Bektešević, Ajla Orahovac and Dina Toskić", "national debating champions"],
          },
          {
            text: "Their winning run included debates against renowned grammar schools from Podgorica, Budva, Pljevlja and Bijelo Polje.",
          },
        ],
      ],
    },
    {
      year: "2022",
      achievements: [
        [
          {
            text: `The team “Plan B”${N}– Dina Škepović, Mensura Drešević and Eman Almafalha${N}– won first place at the municipal first aid competition organised by the Red Cross Tuzi, and qualified for the national final.`,
            emphasis: ["Dina Škepović, Mensura Drešević and Eman Almafalha", "first place"],
          },
          {
            text: "After several weeks of professional training, the students showed exceptional readiness, knowledge and teamwork.",
          },
        ],
      ],
    },
    {
      year: "2021",
      achievements: [
        [
          {
            text: `Adela Bašini${N}– won first place at the national philosophy competition, and represented Montenegro at the 27th UNESCO International Philosophy Olympiad in Rome.`,
            emphasis: ["Adela Bašini", "first place"],
          },
          {
            text: "At this prestigious world gathering of young thinkers, Adela showed exceptional skill in argument, critical thinking and knowledge of ethics.",
          },
        ],
      ],
    },
  ],
  closing: {
    heading: "WINNERS WHO LEAVE A MARK",
    lead: "The successes of the students of the Medresa “Mehmed Fatih” are not limited to the classroom. They regularly compete and win recognition in:",
    items: [
      "hifz and the recitation of the Qur’an,",
      "ilahis and spiritual music,",
      "literary and essay competitions,",
      "sports and humanitarian projects,",
      "international debate forums and leadership programmes.",
    ],
  },
};

/** Shqip: the medresa.me Albanian page (Weglot), revised („nxënës“, names untouched). */
const sq: TiuContent = {
  title: "Garat dhe sukseset",
  heading: "Arritjet më të mëdha të nxënësve të Medresesë “Mehmed Fatih”",
  intro:
    "Që nga themelimi në vitin 2008, Medreseja “Mehmed Fatih” nga Tuzi përfaqëson një ndërthurje të fortë të arsimit shpirtëror dhe dijeve bashkëkohore. Gjatë viteve të fundit, nxënësit e kësaj shkolle kanë arritur suksese të shumta në gara shtetërore dhe ndërkombëtare, duke sjellë mirënjohje si për shkollën e tyre, ashtu edhe për Bashkësinë Islame në Mal të Zi. Më poshtë sjellim një pasqyrë kronologjike të rezultateve më të rëndësishme:",
  years: [
    {
      year: "2025",
      achievements: [
        [
          {
            text: `Nxënësit e Medresesë “Mehmed Fatih” fituan vendin e parë në turneun e futbollit ndërmedreseve, një nga arritjet e rëndësishme të Medresesë në vitin 2025. Në ndeshjen finale mundën ekipin e Medresesë Elçi Ibrahim-pasha nga Travniku me rezultat 6${N}:${N}3, duke treguar lojë të jashtëzakonshme dhe frymë të fortë ekipore.`,
            emphasis: ["vendin e parë"],
          },
        ],
        [
          {
            text: "Me rastin e 17 vjetëve të ekzistimit të Medresesë, u organizua një akademi solemne në të cilën maturantët prezantuan projektet e tyre përfundimtare, punimet kërkimore dhe arritjet jashtëmësimore.",
            emphasis: ["17 vjetëve"],
          },
          {
            text: "Ky jubile ishte rast për të kujtuar më shumë se 700 të diplomuarit e shkollës, të cilët sot studiojnë dhe veprojnë në mbarë rajonin dhe botën.",
          },
        ],
      ],
    },
    {
      year: "2024",
      achievements: [
        [
          {
            text: "Ekipi i Medresesë fitoi medaljen e artë në turneun ndërkombëtar të xhudos “Tivat Open”, në kategorinë e seniorëve, në konkurrencë me klube nga disa vende të rajonit.",
            emphasis: ["medaljen e artë"],
          },
          {
            text: `Ishte një moment historik${N}– medalja e parë e artë e një ekipi nga një medrese në Mal të Zi në këtë ngjarje prestigjioze sportive.`,
          },
        ],
        [
          {
            text: "Nxënësit Ilhan Osmanović, Amina Kačar, Medina Mustafić dhe Elisa Micović arritën sukses të jashtëzakonshëm në garën shtetërore të gjuhës angleze, duke fituar vendin e parë si ekip, ndërsa Ilhani zuri vendin e dytë individualisht.",
            emphasis: [
              "Ilhan Osmanović, Amina Kačar, Medina Mustafić dhe Elisa Micović",
              "vendin e parë si ekip",
            ],
          },
          {
            text: "Falë këtij suksesi, ata u zgjodhën të përfaqësojnë Malin e Zi në olimpiadën rajonale të gjuhëve.",
          },
        ],
      ],
    },
    {
      year: "2023",
      achievements: [
        [
          {
            text: `Klubi i debatit i Medresesë${N}– Ahmed Bektešević, Ajla Orahovac dhe Dina Toskić, nën mentorimin e prof. Elmaz Osmanović, fitoi vendin e parë në emisionin “Mislionica” të RTCG-së, duke u bërë kampionë kombëtarë të debatit për vitin shkollor 2022/23.`,
            emphasis: ["Ahmed Bektešević, Ajla Orahovac dhe Dina Toskić", "kampionë kombëtarë"],
          },
          {
            text: "Seria fituese përfshiu debate kundër gjimnazeve të njohura nga Podgorica, Budva, Pljevlja dhe Bijelo Polje.",
          },
        ],
      ],
    },
    {
      year: "2022",
      achievements: [
        [
          {
            text: `Ekipi “Plan B”${N}– Dina Škepović, Mensura Drešević dhe Eman Almafalha${N}– fitoi vendin e parë në garën komunale të ndihmës së parë, të organizuar nga Kryqi i Kuq i Tuzit, dhe u kualifikua në finalen shtetërore.`,
            emphasis: ["Dina Škepović, Mensura Drešević dhe Eman Almafalha", "vendin e parë"],
          },
          {
            text: "Pas disa javësh trajnimi profesional, nxënësit treguan gatishmëri, njohuri dhe koordinim ekipor të jashtëzakonshëm.",
          },
        ],
      ],
    },
    {
      year: "2021",
      achievements: [
        [
          {
            text: `Adela Bašini${N}– fitoi vendin e parë në garën shtetërore të filozofisë dhe përfaqësoi Malin e Zi në Olimpiadën e 27-të Ndërkombëtare të Filozofisë të UNESCO-s në Romë.`,
            emphasis: ["Adela Bašini", "vendin e parë"],
          },
          {
            text: "Në këtë tubim prestigjioz botëror të mendimtarëve të rinj, Adela tregoi aftësi të jashtëzakonshme në argumentim, mendim kritik dhe njohje të etikës.",
          },
        ],
      ],
    },
  ],
  closing: {
    heading: "FITUES QË LËNË GJURMË",
    lead: "Sukseset e nxënësve të Medresesë “Mehmed Fatih” nuk kufizohen vetëm në klasë. Ata garojnë rregullisht dhe fitojnë mirënjohje në:",
    items: [
      "hifz dhe tilavet të Kuranit,",
      "ilahi dhe muzikë shpirtërore,",
      "konkurse letrare dhe të eseve,",
      "projekte sportive dhe humanitare,",
      "forume ndërkombëtare debati dhe programe lidershipi.",
    ],
  },
};

export const tiuContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const tiu = bs;
