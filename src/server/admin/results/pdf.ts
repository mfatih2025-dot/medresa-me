import { PDFDocument, PDFDict, PDFName, PDFArray, PDFRawStream, type PDFObject } from "pdf-lib";
import { createHash } from "node:crypto";
import { AdminError } from "@/admin/contracts";
import { MAX_PDF_BYTES } from "@/admin/results/model";
export const pdfDigest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
export async function validatePdf(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_PDF_BYTES) throw new AdminError(422, "PDF mora biti manji ili jednak 5 MB.");
  try {
    if (!/^%PDF-[12]\.\d/.test(bytes.subarray(0,8).toString("ascii"))) throw new Error();
    const tail = bytes.subarray(-1024).toString("latin1"), end = tail.lastIndexOf("%%EOF");
    if (end < 0 || !/^[\s]*$/.test(tail.slice(end+5))) throw new Error();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false, throwOnInvalidObject: true });
    if (!doc.getPageCount()) throw new Error();
    // Downloads are official static documents: refuse executable/embedded payloads.
    const pending: PDFObject[] = doc.context.enumerateIndirectObjects().map(([,object]) => object);
    const visited = new Set<PDFObject>();
    while (pending.length) {
      const object = pending.pop()!; if (visited.has(object)) continue; visited.add(object);
      if (object instanceof PDFDict) {
        if (["JS", "JavaScript", "AA", "EmbeddedFiles", "RichMedia", "XFA"].some(key => object.has(PDFName.of(key))) || ["/JavaScript", "/Launch", "/SubmitForm", "/ImportData"].includes(String(object.get(PDFName.of("S")))) || String(object.get(PDFName.of("Type"))) === "/EmbeddedFile") throw new Error();
        for (const [,child] of object.entries()) pending.push(child);
      } else if (object instanceof PDFArray) pending.push(...object.asArray());
      else if (object instanceof PDFRawStream) pending.push(object.dict);
    }
    return { pages: doc.getPageCount(), sha256: pdfDigest(bytes) };
  } catch { throw new AdminError(422, "Datoteka nije ispravan, nešifrovan PDF bez aktivnog sadržaja."); }
}
