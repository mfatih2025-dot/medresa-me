import type { NextApiResponse } from "next";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
/** Stream the validated original PDF: a full 5 MB download must not become a
 * buffered Vercel response exceeding the platform's 4.5 MB body limit. */
export async function sendPdf(res: NextApiResponse, bytes: Buffer, filename: string) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  res.setHeader("Content-Disposition", `attachment; filename="results.pdf"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`);
  res.status(200); res.flushHeaders();
  const chunks = function* () { for (let i=0;i<bytes.length;i+=65536) yield bytes.subarray(i,i+65536); };
  await pipeline(Readable.from(chunks()),res);
}
