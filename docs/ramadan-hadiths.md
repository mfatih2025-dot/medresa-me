# Ramazansko izdanje: 30 dnevnih hadisa — izvještaj o provjeri

Skup podataka: `src/seasonal/hadiths.ts`. Prikaz: `src/seasonal/RamadanHadith.tsx`.

## Kako je provjereno

- Svaki hadis je provjeren po referenci u standardnim izdanjima zbirki (numeracija kao na sunnah.com;
  Muslim po Abdul-Baqiju, sa slovom predaje, npr. 804a), preko otvorenog skupa podataka
  *hadith-api* (fawazahmed0, preko jsDelivr CDN-a). Iz njega su preuzeti arapski izvornik
  (s lancem prenosilaca), objavljeni engleski prijevod i, za Tirmizija, ocjene vjerodostojnosti.
- sunnah.com je iza Cloudflare zaštite i nije bio dostupan za automatsku provjeru; numeracija i
  tekstovi odgovaraju tom izdanju, ali preporučuje se ručna kontrola svih 30 referenci na sunnah.com.
- Za Muslima, skup koristi redne brojeve; tačan unos je pronađen po tekstu, a standardni broj
  preuzet iz polja izvornika (npr. 804.01 = 804a, 233.03 = 233c, 1164.01 = 1164a).
- Nijedan hadis, prenosilac, broj ni ocjena nisu izmišljeni. Nijedan hadis se ne ponavlja.

## Prijevodi

- **Engleski**: objavljeni prijevodi iz istog izdanja (Buhari: M. Muhsin Khan; Muslim: Abdul Hamid
  Siddiqui; Tirmizi: Abu Khaliyl, Darussalam). Izmijenjena je samo završna interpunkcija (izvornik je
  nema), a kod 14. dana izostavljena je urednička napomena „(See Hadith No. 56 (B) Vol…)“.
- **Bosanski i albanski**: **nacrti prijevoda** napravljeni za ovu stranicu prema arapskom izvorniku
  i engleskom prijevodu. Nisu objavljeni prijevodi i **moraju ih pregledati stručna lica** prije
  javne upotrebe. Na Previewu su na kartici označeni kao nacrt.

## Objava

Na produkciji se kartica hadisa ne prikazuje dok svi hadisi nisu odobreni (`approved: true`) i
dok prijevod na tom jeziku nije `published` ili `approved` (`hadithReady`). Do tada, i s uključenim
ramazanskim izdanjem, ostaje prikazana originalna kartica upisa.

## Posebne napomene

- **Dan 25 (Tirmizi 3513)**: ocjene se razlikuju — Ahmad Shakir: sahih; Al-Albani: sahih;
  Bashar Awad Maarouf: hasan sahih; Zubair Ali Zai: daif. Riječ „kerim“ u dovi je zadržana u
  uglastim zagradama, kako je navedena u izvoru (dodatak koji nema u svim izdanjima). Stručno mišljenje je poželjno prije objave.
- **Dan 10 (Tirmizi 807)**: sve navedene ocjene su sahih / hasan sahih.
- **Dan 3**: Buharijin 1909 je izabran umjesto 1894, jer 1894 i 1904 (dan 4) imaju veliki
  zajednički dio teksta.
- **Datum početka ramazana 1448. h. (2027)** u `src/seasonal/config.ts` (8. februar 2027, 30 dana)
  je očekivani datum; mora se potvrditi prema objavi Islamske zajednice.

## Pregled

| Dan | Tema | Zbirka i broj | U zbirci | Prenosilac | Vjerodostojnost | EN | BS | SQ |
|---|---|---|---|---|---|---|---|---|
| 1 | Ramazan | Sahih al-Bukhari 1899 | knjiga 30, hadis 9 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 2 | Post | Sahih al-Bukhari 38 | knjiga 2, hadis 31 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 3 | Mlađak | Sahih al-Bukhari 1909 | knjiga 30, hadis 19 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 4 | Vrijednost posta | Sahih al-Bukhari 1904 | knjiga 30, hadis 14 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 5 | Vrijednost posta | Sahih al-Bukhari 1896 | knjiga 30, hadis 6 | Sehl b. Sa’d | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 6 | Čistoća posta | Sahih al-Bukhari 1903 | knjiga 30, hadis 13 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 7 | Sehur | Sahih al-Bukhari 1923 | knjiga 30, hadis 32 | Enes b. Malik | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 8 | Iftar | Sahih al-Bukhari 1957 | knjiga 30, hadis 64 | Sehl b. Sa’d | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 9 | Post | Sahih al-Bukhari 1933 | knjiga 30, hadis 40 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 10 | Iftar | Jami` at-Tirmidhi 807 | knjiga 8, hadis 126 | Zejd b. Halid el-Džuheni | Ahmad Muhammad Shakir: Sahih; Al-Albani: Sahih; Bashar Awad Maarouf: Hasan Sahih; Zubair Ali Zai: Isnaad Sahih | objavljen (Abu Khaliyl (Darussalam)) | nacrt | nacrt |
| 11 | Darežljivost | Sahih al-Bukhari 6 | knjiga 1, hadis 6 | Ibn Abbas | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 12 | Sadaka | Sahih Muslim 2588 | knjiga 45, hadis 90 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (Abdul Hamid Siddiqui) | nacrt | nacrt |
| 13 | Sadaka | Sahih al-Bukhari 1417 | knjiga 24, hadis 21 | Adij b. Hatim | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 14 | Lijep ahlak | Sahih al-Bukhari 3559 | knjiga 61, hadis 68 | Abdullah b. Amr | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 15 | Lijep ahlak | Sahih al-Bukhari 6018 | knjiga 78, hadis 49 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 16 | Strpljenje i samokontrola | Sahih al-Bukhari 6114 | knjiga 78, hadis 141 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 17 | Strpljenje i zahvalnost | Sahih Muslim 2999 | knjiga 55, hadis 82 | Suhejb | Sahih (u zbirci Sahih) | objavljen (Abdul Hamid Siddiqui) | nacrt | nacrt |
| 18 | Kur'an | Sahih al-Bukhari 5027 | knjiga 66, hadis 49 | Osman | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 19 | Kur'an | Sahih Muslim 804a | knjiga 6, hadis 302 | Ebu Umame | Sahih (u zbirci Sahih) | objavljen (Abdul Hamid Siddiqui) | nacrt | nacrt |
| 20 | Dova | Sahih al-Bukhari 1145 | knjiga 19, hadis 26 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 21 | Posljednjih deset noći | Sahih al-Bukhari 2024 | knjiga 32, hadis 11 | Aiša | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 22 | Posljednjih deset noći | Sahih al-Bukhari 2025 | knjiga 33, hadis 1 | Abdullah b. Omer | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 23 | Lejletul-kadr | Sahih al-Bukhari 2017 | knjiga 32, hadis 4 | Aiša | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 24 | Lejletul-kadr | Sahih al-Bukhari 35 | knjiga 2, hadis 28 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 25 | Lejletul-kadr i dova | Jami` at-Tirmidhi 3513 | knjiga 48, hadis 144 | Aiša | Ahmad Muhammad Shakir: Sahih; Al-Albani: Sahih; Bashar Awad Maarouf: Hasan Sahih; Zubair Ali Zai: Daif | objavljen (Abu Khaliyl (Darussalam)) | nacrt | nacrt |
| 26 | Noćni namaz u ramazanu | Sahih al-Bukhari 37 | knjiga 2, hadis 30 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 27 | Oprost i pročišćenje | Sahih Muslim 233c | knjiga 2, hadis 19 | Ebu Hurejre | Sahih (u zbirci Sahih) | objavljen (Abdul Hamid Siddiqui) | nacrt | nacrt |
| 28 | Iskrenost namjere | Sahih al-Bukhari 1 | knjiga 1, hadis 1 | Omer b. el-Hattab | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 29 | Postojanost u dobru | Sahih al-Bukhari 6464 | knjiga 81, hadis 53 | Aiša | Sahih (u zbirci Sahih) | objavljen (M. Muhsin Khan) | nacrt | nacrt |
| 30 | Nakon ramazana | Sahih Muslim 1164a | knjiga 13, hadis 264 | Ebu Ejjub el-Ensari | Sahih (u zbirci Sahih) | objavljen (Abdul Hamid Siddiqui) | nacrt | nacrt |
