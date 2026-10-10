import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { campaignConfiguration, MAX_POSTER_BYTES, POSTER_MIMES, uploadPoster } from "@/server/admin/campaigns/service";
export const config = { api: { bodyParser: false } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = authorize(req, res, ["POST"]); campaignConfiguration(true);
    const mime = req.headers["content-type"]?.split(";")[0] ?? "";
    if (!POSTER_MIMES.includes(mime)) throw new AdminError(422, "Podržani su JPG, PNG i WebP.");
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { size += chunk.length; if (size > MAX_POSTER_BYTES) throw new AdminError(413, "Slika mora biti manja od 4 MB."); chunks.push(Buffer.from(chunk)); }
    return res.status(201).json({ poster: await uploadPoster(Buffer.concat(chunks), mime, session.user) });
  } catch (error) { return apiFailure(res, error); }
}
