/*
 * Alumni generation QR codes, for the printed generation panos.
 *
 *   node scripts/alumni-qr/generate.mjs
 *
 * For every generation in src/content/alumni.ts (the source of truth: a new
 * Generacija XVI is one more entry there, then run this again) it writes
 *
 *   public/qr/alumni/masters/generacija-<n>.svg|png   the QR alone, with the seal
 *   public/qr/alumni/badges/generacija-<n>.svg|png    the print badge (60 × 94 mm)
 *   public/qr/alumni/proof/alumni-qr-proof.pdf        all badges at true size
 *   public/qr/alumni/manifest.json                    generation → encoded URL
 *
 * Every code encodes the generation's PERMANENT Bosnian address on the
 * production domain (https://www.medresa.me/alumni/generacija-vii), never a
 * preview or deployment URL. Verify with scripts/alumni-qr/verify.mjs.
 *
 * The code: QR version 6 (41 × 41 modules) for every generation, error
 * correction H (30 %), a 4-module quiet zone, square modules in Medresa deep
 * green on white, drawn as one merged vector path (no gaps or hairlines).
 * The official seal (public/brand/medresa-logo.png, unaltered) sits in a
 * cleared circle at the centre: 10 of 41 modules wide (24 %), clear of the
 * finder, timing, alignment and format areas. See STYLE.
 *
 * The badge's type is outlined to vector paths (Kanit and Bodoni Moda, SIL
 * Open Font License, in ./fonts), so printers need no fonts.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import opentype from "opentype.js";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { moduleLoader } from "../lib/load-typescript.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
process.chdir(root);

/** The production domain: the only one ever encoded. */
export const SITE = "https://www.medresa.me";
export const VERSION = 6;
export const ECC = "H";
const QUIET = 4;

/**
 * The code's style. Square modules and square finder patterns, deliberately:
 * rounded finder corners (even mild ones) and softened module corners were
 * tested and made OpenCV's detector fail at every size and jsQR fail on large
 * renders, while ZXing still read them. Square geometry passes all three.
 * The seal: 10 of 41 modules (24 %); 13 still decoded everywhere in testing,
 * so 10 leaves a wide margin for print and camera conditions.
 */
export const STYLE = {
  logoModules: 10, // seal diameter, in modules
  clearRadius: 6.1, // modules cleared around the centre (seal + a light margin)
  moduleRadius: 0, // softening of a data module's free outer corners (module = 1)
  finderRadius: [0, 0, 0], // corner radii: finder outer ring, its inner edge, the centre square
};

const COLOR = {
  ink: "#0a2a21", // Medresa green-deep: the modules
  paper: "#fbf8f1", // the badge
  white: "#ffffff", // behind the code
  gold: "#c49a55",
  goldDeep: "#8f6a2c",
  text: "#1a2320",
};

const { generations, generationPath } = moduleLoader()("src/content/alumni");

export const targets = () =>
  generations.map((g) => ({
    number: g.number,
    roman: g.roman,
    slug: generationPath(g, "bs").split("/").pop(),
    url: `${SITE}${generationPath(g, "bs")}`,
  }));

/* ---------- The code ---------- */

const n2 = (v) => +v.toFixed(3);

/** The QR matrix (light/dark per module) with the centre cleared for the seal. */
function matrix(url, style) {
  const qr = QRCode.create(url, { errorCorrectionLevel: ECC, version: VERSION });
  const size = qr.modules.size;
  const c = size / 2;
  const dark = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return false;
    if (style.logoModules && Math.hypot(x + 0.5 - c, y + 0.5 - c) < style.clearRadius) return false;
    return qr.modules.get(y, x) === 1;
  };
  return { size, dark, mask: qr.maskPattern };
}

const inFinder = (x, y, size) => (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

/** One path for all data modules: each a whole square, an outer corner softened only where both neighbours are light. */
function modulesPath({ size, dark }, o, r) {
  let d = "";
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (inFinder(x, y, size) || !dark(x, y)) continue;
      const L = dark(x - 1, y), R = dark(x + 1, y), U = dark(x, y - 1), D = dark(x, y + 1);
      const tl = !L && !U ? r : 0, tr = !R && !U ? r : 0, br = !R && !D ? r : 0, bl = !L && !D ? r : 0;
      const X = x + o, Y = y + o;
      d += `M${n2(X + tl)} ${Y}H${n2(X + 1 - tr)}`;
      if (tr) d += `A${r} ${r} 0 0 1 ${X + 1} ${n2(Y + tr)}`;
      d += `V${n2(Y + 1 - br)}`;
      if (br) d += `A${r} ${r} 0 0 1 ${n2(X + 1 - br)} ${Y + 1}`;
      d += `H${n2(X + bl)}`;
      if (bl) d += `A${r} ${r} 0 0 1 ${X} ${n2(Y + 1 - bl)}`;
      d += `V${n2(Y + tl)}`;
      if (tl) d += `A${r} ${r} 0 0 1 ${n2(X + tl)} ${Y}`;
      d += "Z";
    }
  return d;
}

const rrect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** The three finder patterns: exact module geometry, corners rounded. */
function findersPath(size, o, [ro, ri, rc]) {
  let d = "";
  for (const [fx, fy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
    const X = fx + o, Y = fy + o;
    d += rrect(X, Y, 7, 7, ro) + rrect(X + 1, Y + 1, 5, 5, ri) + rrect(X + 2, Y + 2, 3, 3, rc);
  }
  return d;
}

let sealData;
async function seal() {
  // The official seal, only scaled (for embedding): 360 px ≈ 1000 dpi at the badge's size.
  sealData ??= (
    await sharp("public/brand/medresa-logo.png").resize(360, 360).png({ compressionLevel: 9, effort: 10 }).toBuffer()
  ).toString("base64");
  return sealData;
}

/** The code as SVG elements, in module units, its top-left corner (incl. quiet zone) at (0,0). */
async function codeElements(url, style = STYLE) {
  const m = matrix(url, style);
  const o = QUIET;
  const full = m.size + 2 * QUIET;
  const c = full / 2;
  const logo = style.logoModules;
  const body =
    `<path fill="${COLOR.ink}" fill-rule="evenodd" d="${findersPath(m.size, o, style.finderRadius)}"/>` +
    `<path fill="${COLOR.ink}" d="${modulesPath(m, o, style.moduleRadius)}"/>` +
    (!logo ? "" : `<image href="data:image/png;base64,${await seal()}" x="${n2(c - logo / 2)}" y="${n2(c - logo / 2)}" width="${logo}" height="${logo}" preserveAspectRatio="xMidYMid meet"/>`);
  return { body, full, version: VERSION, size: m.size, mask: m.mask };
}

/* ---------- Type, as outlines ---------- */

const font = {
  kanit: opentype.loadSync(resolve(here, "fonts/Kanit-Medium.ttf")),
  kanitRegular: opentype.loadSync(resolve(here, "fonts/Kanit-Regular.ttf")),
  bodoni: opentype.loadSync(resolve(here, "fonts/BodoniModa-11pt-SemiBold.ttf")),
};

/** A line of text as one path, centred on `cx`, with letter-spacing (em). */
function textPath(f, text, size, cx, baseline, tracking = 0) {
  const glyphs = f.stringToGlyphs(text);
  const scale = size / f.unitsPerEm;
  const adv = glyphs.map((g, i) => g.advanceWidth * scale + (i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size : 0));
  const width = adv.reduce((a, b) => a + b, 0);
  let x = cx - width / 2;
  let d = "";
  glyphs.forEach((g, i) => {
    d += g.getPath(x, baseline, size).toPathData(2);
    x += adv[i];
  });
  return { d, width };
}

/** Width of a line at size 1, for fitting. */
const measure = (f, text, tracking = 0) => textPath(f, text, 1, 0, 0, tracking).width;

/* ---------- The badge ---------- */

// 60 × 94 mm; units are 0.1 mm.
const W = 600;
const H = 940;
const SPRING = 330; // where the arch meets the sides
const ARCH_R = 330; // two-centred pointed arch, barely pointed

/** The plaque: a pointed arch (the Medresa's mihrab niche, as in the footer) over a rectangle. */
function plaque(inset, rx = 18) {
  const l = inset, r = W - inset, b = H - inset;
  const R = ARCH_R - inset;
  const half = (r - l) / 2;
  const apexY = SPRING - Math.sqrt(R * R - (R - half) * (R - half));
  return `M${l} ${SPRING}A${R} ${R} 0 0 1 ${W / 2} ${n2(apexY)}A${R} ${R} 0 0 1 ${r} ${SPRING}V${b - rx}A${rx} ${rx} 0 0 1 ${r - rx} ${b}H${l + rx}A${rx} ${rx} 0 0 1 ${l} ${b - rx}Z`;
}

/** The small ornament between the name and the code: a hairline and one pointed arch (the footer's arcade). */
function ornament(cy) {
  const w = 34, h = 30;
  const x0 = W / 2 - w / 2, x1 = W / 2 + w / 2;
  const R = w;
  const apex = cy - h;
  return (
    `<path fill="none" stroke="${COLOR.gold}" stroke-width="1.6" stroke-linecap="round" d="` +
    `M${W / 2 - 150} ${cy}H${x0 - 12}M${x1 + 12} ${cy}H${W / 2 + 150}` +
    `M${x0} ${cy}V${cy - 8}A${R} ${R} 0 0 1 ${W / 2} ${apex}A${R} ${R} 0 0 1 ${x1} ${cy - 8}V${cy}"/>`
  );
}

export async function badgeSvg(t, style = STYLE) {
  const code = await codeElements(t.url, style);
  const qrSize = 440; // 44 mm including the quiet zone
  const qrX = (W - qrSize) / 2;
  const qrY = 384;
  const unit = qrSize / code.full;

  const label = textPath(font.kanit, "GENERACIJA", 25, W / 2, 172, 0.34);
  const maxNumeral = 380;
  const numeralSize = Math.min(132, maxNumeral / measure(font.bodoni, t.roman, 0.02));
  const numeral = textPath(font.bodoni, t.roman, numeralSize, W / 2, 300, 0.02);
  const scan = textPath(font.kanitRegular, "SKENIRAJ I OTVORI PANO", 19.5, W / 2, 878, 0.26);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="60mm" height="94mm" viewBox="0 0 ${W} ${H}">
  <title>Medresa „Mehmed Fatih“ – Generacija ${t.roman} – ${t.url}</title>
  <path fill="${COLOR.paper}" d="${plaque(0, 24)}"/>
  <path fill="none" stroke="${COLOR.gold}" stroke-width="1.6" d="${plaque(16, 12)}"/>
  <path fill="${COLOR.goldDeep}" d="${label.d}"/>
  <path fill="${COLOR.ink}" d="${numeral.d}"/>
  ${ornament(346)}
  <rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" rx="10" fill="${COLOR.white}"/>
  <g transform="translate(${qrX} ${qrY}) scale(${n2(unit)})">${code.body}</g>
  <path fill="${COLOR.text}" d="${scan.d}"/>
</svg>
`;
}

export async function masterSvg(t, style = STYLE) {
  const code = await codeElements(t.url, style);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="40mm" height="40mm" viewBox="0 0 ${code.full} ${code.full}">
  <title>Medresa „Mehmed Fatih“ – Generacija ${t.roman} – ${t.url}</title>
  <rect width="${code.full}" height="${code.full}" fill="${COLOR.white}"/>
  ${code.body}
</svg>
`;
}

/* ---------- Output ---------- */

/**
 * The SVG rendered at an exact pixel size (the same vector drawing, sized in px
 * for the rasteriser). Opaque on white unless `transparent` (the badge: outside
 * its arched plaque it stays transparent, for placing on the pano).
 */
export async function raster(svg, w, h, file, { transparent = false } = {}) {
  const sized = svg.replace(/ width="[^"]+" height="[^"]+" viewBox=/, ` width="${w}" height="${h}" viewBox=`);
  let img = sharp(Buffer.from(sized), { limitInputPixels: false });
  if (!transparent) img = img.flatten({ background: "#ffffff" });
  img = img.png();
  return file ? img.toFile(file) : img.toBuffer();
}

export async function generate() {
  const out = "public/qr/alumni";
  for (const dir of ["masters", "badges", "proof"]) mkdirSync(resolve(out, dir), { recursive: true });
  const list = targets();
  const manifest = [];
  for (const t of list) {
    const master = await masterSvg(t);
    const badge = await badgeSvg(t);
    writeFileSync(`${out}/masters/${t.slug}.svg`, master);
    writeFileSync(`${out}/badges/${t.slug}.svg`, badge);
    // PNG: master 2400 px square (≈ 1500 dpi at 40 mm); badge at 600 dpi (1417 × 2220 px).
    await raster(master, 2400, 2400, `${out}/masters/${t.slug}.png`);
    await raster(badge, 1417, 2220, `${out}/badges/${t.slug}.png`, { transparent: true });
    manifest.push({ generation: t.roman, number: t.number, url: t.url, master: `masters/${t.slug}`, badge: `badges/${t.slug}` });
  }
  writeFileSync(
    `${out}/manifest.json`,
    JSON.stringify({ site: SITE, version: VERSION, errorCorrection: ECC, quietZone: QUIET, style: STYLE, generations: manifest }, null, 2) + "\n",
  );
  await proof(list, out);
  return list;
}

/** A4 proof sheet: the badges at true size (60 × 94 mm), three by two, each with its address. */
async function proof(list, out) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Medresa „Mehmed Fatih“ – Alumni QR (proof)".replace(/[„“]/g, '"'));
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const mm = 72 / 25.4;
  const [pw, ph] = [210 * mm, 297 * mm];
  const bw = 60 * mm, bh = 94 * mm, gx = 6 * mm;
  const left = (pw - 3 * bw - 2 * gx) / 2;
  let page;
  for (let i = 0; i < list.length; i++) {
    if (i % 6 === 0) {
      page = pdf.addPage([pw, ph]);
      page.drawText("Medresa \"Mehmed Fatih\" - Alumni QR - proof (true size, 60 x 94 mm)", { x: left, y: ph - 14 * mm, size: 8, font: helv, color: rgb(0.3, 0.33, 0.31) });
    }
    const k = i % 6;
    const x = left + (k % 3) * (bw + gx);
    const y = ph - 24 * mm - bh - Math.floor(k / 3) * (bh + 20 * mm);
    const png = await pdf.embedPng(readFileSync(`${out}/badges/${list[i].slug}.png`));
    page.drawImage(png, { x, y, width: bw, height: bh });
    page.drawText(list[i].url.replace("https://", ""), { x, y: y - 5 * mm, size: 6.5, font: helv, color: rgb(0.1, 0.14, 0.13) });
  }
  writeFileSync(`${out}/proof/alumni-qr-proof.pdf`, await pdf.save());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await generate();
  console.log(`Generated ${list.length} masters and badges:`);
  for (const t of list) console.log(`  ${t.roman.padEnd(5)} ${t.url}`);
}
