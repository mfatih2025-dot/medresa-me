# Alumni generation QR codes

One QR code per generation pano. It opens that generation's permanent page,
in Bosnian, on the production domain:

    https://www.medresa.me/alumni/generacija-vii

From there the language switch keeps the same generation
(`/sq/alumni/gjenerata-vii`, `/en/alumni/generation-vii`).

## Files (`public/qr/alumni/`)

| | |
|---|---|
| `masters/generacija-<n>.svg` | the QR alone with the seal, vector (40 mm nominal) |
| `masters/generacija-<n>.png` | the same, 2400 × 2400 px, white |
| `badges/generacija-<n>.svg` | print badge, 60 × 94 mm, vector, type outlined |
| `badges/generacija-<n>.png` | the same at 600 dpi (1417 × 2220 px), transparent outside the plaque |
| `proof/alumni-qr-proof.pdf` | all badges at true size on A4, for a proof print |
| `manifest.json` | generation → encoded URL |

## A new generation (XVI …)

1. Add the generation to `src/content/alumni.ts` (its pano files, as the others).
2. `npm run qr:alumni` regenerates every code and decodes them all again;
   it must end with `ALL … PASS`.

Never change a slug, a numeral or the domain: printed codes depend on them.

## Printing

- Print the SVG (vector). Scale proportionally only; never stretch.
- Keep the white square around the code (its quiet zone) clear of anything.
- The badge is 60 × 94 mm; the code itself is then 44 mm with modules of
  0.9 mm, readable from about 40 cm. Do not print the code smaller than
  25 mm wide.
- Matt paper or matt laminate; gloss reflections defeat cameras.
- Before printing all fifteen, print the proof sheet and scan each badge with
  an iPhone and an Android phone.

## The code

QR version 6 (41 × 41), error correction H (30 %), 4-module quiet zone, square
modules in Medresa deep green (#0a2a21) on white. The official seal
(`public/brand/medresa-logo.png`, unaltered) fills a cleared circle 10 modules
wide (24 % of the code). Rounded finder or module corners were tested and
rejected: they made common decoders fail. See `generate.mjs` (STYLE) and
`verify.mjs`.

Fonts (badge type, outlined): Kanit and Bodoni Moda, SIL Open Font License,
in `./fonts`.
