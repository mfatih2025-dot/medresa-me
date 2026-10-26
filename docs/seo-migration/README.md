# SEO migracija: stari WordPress medresa.me → novi Next.js/Vercel

Audit na razvojnoj grani `claude/seo-migration-audit`, oktobar 2026. Produkcija, DNS i dizajn nisu mijenjani.

## Izvori starih URL-ova

1. **Sitemap starog sajta** (All in One SEO, `/sitemap.xml` i svi podređeni), sa `hreflang` alternativama `/sq/` i `/en/`.
2. **WordPress REST API**: sve javne objave (17), stranice (32) i mediji (510 javnih).
3. **Linkovi koje stari sajt sam objavljuje**: stranice generacija (`/generacija/…`) i demo unosi teme, kojih nema u sitemap-u ni u REST-u.

Uzeti su samo URL-ovi koje stari server vraća sa **HTTP 200**. Nijedan URL nije izmišljen.

## Stranice, vijesti i PDF dokumenti: 409 starih URL-ova

bs 143 · sq 133 · en 133

| Vrsta | Ukupno | Tačan ekvivalent | Ista tema | Vanjski | 410 Gone | Bez preusmjeravanja |
|---|---|---|---|---|---|---|
| Vijesti | 51 | 51 | 0 | 0 | 0 | 0 |
| Stranice | 95 | 50 | 6 | 3 | 36 | 0 |
| Generacije (Alumni) | 45 | 45 | 0 | 0 | 0 | 0 |
| Kategorije | 12 | 0 | 12 | 0 | 0 | 0 |
| Paginacija vijesti | 9 | 0 | 9 | 0 | 0 | 0 |
| Događaji (Events Calendar) | 21 | 0 | 6 | 0 | 15 | 0 |
| Demo sadržaj teme | 171 | 0 | 0 | 0 | 171 | 0 |
| PDF dokumenti | 5 | 0 | 0 | 0 | 0 | 5 |
| **Ukupno** | **409** | **146** | **33** | **3** | **222** | **5** |

- **Tačan ekvivalent** (146): ista stranica, isti članak ili ista generacija, u istom jeziku. 6 adresa postoji nepromijenjeno; **140** idu preko 301/308.
- **Ista tema** (33): stare kategorije, paginacija, kategorija događaja „alumni“ i stare stranice za uplatu/donatore → arhiva vijesti, Alumni, Donacije. Nikad naslovna.
- **Vanjski** (3): stranica o e-learning platformi → e-medresa.me.
- **410 Gone** (222): stranice bez Medresa sadržaja (demo programi/istraživanja/osoblje teme, prodavnica, registracije, Events šabloni).
- Na naslovnu vode samo naslovna i `/home/` (njena druga kopija).

**Ukupno preusmjeravanja na ispravnu adresu: 176** (140 tačnih + 33 tematskih + 3 vanjska).

### PDF dokumenti

Jedini relevantni stari PDF je **Rezultati prijemnog ispita** (`/wp-content/uploads/2026/06/2026-06-22-14-06.pdf`, sken „Spisak kandidata primljenih u prvi razred … 2026/27“, 2 str.).

- **Novi sajt nema isti dokument**, pa preusmjeravanja nema. Fajl koji novi sajt servira kao rezultate (`/api/results/bs|sq|en`, dugme na stranici Upis) je **jednostrana slika pečata Medrese** (logo iz Adobe Illustratora, 2013), a ne spisak primljenih. To je sadržaj otpremljen kroz Admin i treba ga zamijeniti stvarnim dokumentom. Kad novi sajt bude imao isti dokument, preusmjeravanje se dodaje jednim redom u `src/seo/legacy.ts`.
- Ostali stari PDF-ovi (konkurs 2026/27 bs/alb, spisak 2025/26) nisu dio migracije i nemaju preusmjeravanje.
- `/wp-content/uploads/2024/07/pdf_files.pdf` **nije PDF: fajl počinje sa `<?php`** (PHP kod podmetnut kao PDF na starom serveru). Preporuka: ukloniti ga i provjeriti WordPress.

## Ostali stari mediji (zasebna provjera)

Svih 510 javnih medijskih fajlova starog sajta (`/wp-content/uploads/…`) je provjereno: 498 slika (427 rasterskih, 66 SVG, 5 HEIC), 5 PDF, 2 video i 5 `.txt` log-fajlova plugina.

- Na istoj adresi novi sajt ne servira nijedan (510 × 404). Novi sajt ima svoje kopije pod `/images/…`.
- **114 starih slika ima istu sliku na novom sajtu** (potvrđeno po sadržaju, ne po imenu: galerija, panoi generacija, slike vijesti, fotografije objekta, potpis reisa, logo fonda). Poklapanje po imenu fajla nije pouzdano: od 49 slika istog imena samo 3 su ista slika.
- Za medije **nisu dodata preusmjeravanja**. Ako se želi očuvati pozicija slika u Google Images, 114 potvrđenih parova je spremno u `media-check.csv` i mogu se dodati kao 301.
- Ostalih 313 rasterskih slika, SVG ikone teme, HEIC, video i log-fajlovi nemaju ekvivalent.

## Tehnički SEO novog sajta

Provjereno na svih 93 odredišnih stranica:

- **canonical** na samu stranicu (`https://www.medresa.me`): 93/93.
- **hreflang** bs/sq/en/x-default sa samoreferencom: 93/93; uzajamnost: 0 grešaka.
- **sitemap.xml**: 96 URL-ova sa hreflang alternativama; sva odredišta su u njemu. Stari sitemap-ovi vode na `/sitemap.xml`.
- **robots.txt**: `Allow: /`; zatvoreni su `/admin`, `/ulaz7` i `/api/` (osim slika vijesti); `Sitemap: https://www.medresa.me/sitemap.xml`.
- **Meta robots**: stranice imaju `index, follow`.

## Napomene

- **Generacije** vode na stalnu stranicu svake generacije (`/alumni/generacija-vii`, `/sq/alumni/gjenerata-vii`, `/en/alumni/generation-vii`), istu adresu koju otvara QR kod na panou (Alumni commit `6fd7466`, usklađen s ovom granom).
- **Lanac preusmjeravanja**: stari URL-ovi sa kosom crtom na kraju idu u dva koraka (308 uklanja kosu crtu, pa 301). Google to prati bez gubitka.

## Fajlovi

- `docs/seo-migration/url-map.csv`: 409 starih URL-ova, sa novom adresom, stvarnim lancem statusa, kvalitetom podudaranja i napomenom.
- `docs/seo-migration/media-check.csv`: 510 starih medijskih URL-ova, sa statusom na novom sajtu i istim fajlom na novom sajtu gdje postoji.
- `src/seo/legacy.ts`: pravila za generacije (stranice generacija iz Alumni commita) i 410 za demo sadržaj teme i `my-account`. Za PDF-ove nema pravila.
- `tests/seo-legacy-redirects.test.mjs`: regresioni test.
