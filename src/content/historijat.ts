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

export const historijat = {
  title: "Historijat",
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
