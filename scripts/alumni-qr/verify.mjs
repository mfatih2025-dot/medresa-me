/*
 * Decodes every generated alumni QR code again and checks it opens exactly
 * its generation's permanent address.
 *
 *   node scripts/alumni-qr/verify.mjs          (exit code 1 on any failure)
 *
 * Two independent decoders:
 *   ZXing (zxing-cpp, the reference decoder behind most scanning apps)
 *   jsQR  (a pure-JavaScript decoder, used by in-browser scanners)
 *
 * Required, for every generation, master and badge:
 *   - the shipped PNG and the SVG master decode to the exact URL with BOTH
 *     decoders, and ZXing reads error correction H, version 6;
 *   - ZXing decodes the exact URL in every stress test: the SVG rendered at
 *     sizes down to ~2.5 px per module, and degraded like a phone photo of the
 *     print (blur, heavy JPEG, rotation, shear, dim low-contrast light,
 *     downscale + blur + JPEG together).
 * jsQR's result on the same stress tests is reported as a rate: the official
 * seal's fine artwork makes jsQR miss at some render scales (a plain disc in
 * its place does not); ZXing and OpenCV read all of them.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import jsQR from "jsqr";
import sharp from "sharp";
import { raster, targets } from "./generate.mjs";

const require = createRequire(import.meta.url);
const zx = await import("zxing-wasm/reader");
await zx.prepareZXingModule({
  overrides: { wasmBinary: readFileSync(require.resolve("zxing-wasm/reader/zxing_reader.wasm")).buffer },
  fireImmediately: true,
});

const dir = "public/qr/alumni";

async function pixels(input) {
  // As a camera sees a print: any transparency (the badge's outside) on white.
  const { data, info } = await sharp(input).flatten({ background: "#ffffff" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
}

/** Both decoders on one image: { zxing, jsqr, ec, version }. */
async function decode(input) {
  const img = await pixels(input);
  const [z] = await zx.readBarcodes({ ...img, colorSpace: "srgb" }, { formats: ["QRCode"], tryHarder: true, maxNumberOfSymbols: 1 });
  const j = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
  return { zxing: z?.text ?? null, ec: z?.ecLevel, version: z?.version, jsqr: j?.data ?? null };
}

/** Phone-photo-like degradations of a render. */
async function degraded(png, w) {
  const s = () => sharp(png).flatten({ background: "#ffffff" });
  return {
    blur1: await s().blur(1.2).png().toBuffer(),
    blur2: await s().blur(2).png().toBuffer(),
    jpeg35: await s().jpeg({ quality: 35 }).toBuffer(),
    jpeg15: await s().jpeg({ quality: 15 }).toBuffer(),
    rotate8: await s().rotate(8, { background: "#ffffff" }).png().toBuffer(),
    rotate23: await s().rotate(23, { background: "#ffffff" }).png().toBuffer(),
    shear: await s().affine([1, 0.07, 0.05, 1], { background: "#ffffff" }).png().toBuffer(),
    dim: await s().linear(0.55, 70).png().toBuffer(),
    phone: await s().resize(Math.round(w * 0.45)).blur(0.7).jpeg({ quality: 55 }).toBuffer(),
  };
}

export async function verify({ log = true } = {}) {
  const rows = [];
  const jsqrStress = { ok: 0, n: 0 };
  for (const t of targets()) {
    const row = { roman: t.roman, url: t.url };
    for (const kind of ["master", "badge"]) {
      const svg = readFileSync(resolve(dir, `${kind}s/${t.slug}.svg`), "utf8");
      const shipped = await decode(readFileSync(resolve(dir, `${kind}s/${t.slug}.png`)));
      const nativeW = kind === "master" ? 980 : 1417;
      const native = await decode(await raster(svg, nativeW, kind === "master" ? nativeW : 2220));
      const required = [shipped, native];
      const requiredOk =
        required.every((d) => d.zxing === t.url && d.jsqr === t.url) && shipped.ec === "H" && shipped.version === "6";

      // Stress: sizes (px per module ≈ 2.5 … 30) and degradations, ZXing must read every one.
      const widths = kind === "master" ? [120, 160, 200, 260, 340, 440, 560, 720, 900, 1200, 1500] : [270, 340, 420, 520, 640, 800, 1000, 1250, 1500];
      const stress = [];
      for (const w of widths) {
        const png = await raster(svg, w, kind === "master" ? w : Math.round((w * 940) / 600));
        stress.push(await decode(png));
        if (w === widths[4]) for (const b of Object.values(await degraded(png, w))) stress.push(await decode(b));
      }
      const zxingStress = stress.every((d) => d.zxing === t.url);
      jsqrStress.n += stress.length;
      jsqrStress.ok += stress.filter((d) => d.jsqr === t.url).length;
      row[kind] = { decoded: shipped.zxing, requiredOk, zxingStress, tests: stress.length + required.length };
    }
    row.pass = row.master.requiredOk && row.master.zxingStress && row.badge.requiredOk && row.badge.zxingStress;
    rows.push(row);
  }
  if (log) {
    console.log("Generation | Expected URL | Decoded URL | Master QR | Branded badge | Result");
    for (const r of rows)
      console.log(
        `${r.roman.padEnd(5)} | ${r.url} | ${r.master.decoded} | ${r.master.requiredOk && r.master.zxingStress ? "PASS" : "FAIL"} (${r.master.tests}) | ${r.badge.requiredOk && r.badge.zxingStress ? "PASS" : "FAIL"} (${r.badge.tests}) | ${r.pass ? "PASS" : "FAIL"}`,
      );
    console.log(`jsQR on the stress tests: ${jsqrStress.ok}/${jsqrStress.n} (${((100 * jsqrStress.ok) / jsqrStress.n).toFixed(1)} %)`);
    console.log(rows.every((r) => r.pass) ? `ALL ${rows.length} PASS` : "FAILURES ABOVE");
  }
  return { rows, jsqrStress };
}

if (process.argv[1] && process.argv[1].endsWith("verify.mjs")) {
  const { rows } = await verify();
  process.exit(rows.every((r) => r.pass) ? 0 : 1);
}
