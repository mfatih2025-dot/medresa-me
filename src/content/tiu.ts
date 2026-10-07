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

export const tiu = {
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
