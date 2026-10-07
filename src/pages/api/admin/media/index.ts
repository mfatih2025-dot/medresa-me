import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { IMAGE_MIMES, listImages, MAX_IMAGE_BYTES, uploadImage } from "@/server/admin/media";
export const config = { api: { bodyParser: false, responseLimit: "12mb" } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = authorize(req, res, ["GET", "POST"]);
    if (req.method === "GET") return res.json({ images: await listImages() });
    const mime = req.headers["content-type"]?.split(";")[0] ?? "";
    if (!IMAGE_MIMES.includes(mime)) throw new AdminError(422, "Podržani su JPG, PNG i WebP.");
    let total = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { total += chunk.length; if (total > MAX_IMAGE_BYTES) throw new AdminError(413, "Slika mora biti manja od 10 MB."); chunks.push(Buffer.from(chunk)); }
    return res.status(201).json({ image: await uploadImage(Buffer.concat(chunks), mime, session.user) });
  } catch (error) { return apiFailure(res, error); }
}
