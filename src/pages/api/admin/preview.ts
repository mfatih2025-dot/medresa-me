import type { NextApiRequest, NextApiResponse } from "next";
import { apiFailure, authorize } from "@/server/admin/http";
import { canonicalDraft, getNews } from "@/server/admin/news";
import { readImage } from "@/server/admin/media";
import { AdminError, validateDraft } from "@/admin/contracts";
import { publicationChecklist, toPublicArticle } from "@/admin/publication";
export const config = { api: { bodyParser: { sizeLimit: "2mb" }, responseLimit: false } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["POST"]);
    validateDraft(req.body?.draft);
    const original = await getNews(req.body.draft.id);
    const draft = await canonicalDraft(req.body.draft, original?.draft);
    if (!publicationChecklist(draft).find(c => c.key === "date")?.complete) throw new AdminError(422, "Unesite ispravan datum prije pregleda.");
    const article = toPublicArticle({ ...draft, blocks: draft.blocks.filter(b => b.type !== "image" || !!b.assetId) });
    // Private data URLs let the locked next/image renderer show draft Storage images,
    // without opening the bucket or changing public next.config remotePatterns.
    const embedded = new Map<string, string>();
    let total = 0;
    for (const photo of article.photos) if (photo.src.startsWith("/api/admin/media/")) {
      if (!embedded.has(photo.src)) { const image = await readImage(photo.src.split("/").pop()!); total += image.bytes.length; if (total > 30 * 1024 * 1024) throw new AdminError(422, "Pregled podržava do 30 MB slika. Sačuvajte nacrt i smanjite slike za pregled."); embedded.set(photo.src, `data:${image.mime};base64,${image.bytes.toString("base64")}`); }
      photo.src = embedded.get(photo.src)!;
    }
    return res.json({ article });
  } catch (error) { return apiFailure(res, error); }
}
