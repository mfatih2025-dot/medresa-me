import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError, safeId } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { readImage } from "@/server/admin/media";
export const config = { api: { responseLimit: "12mb" } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]);
    if (!safeId(req.query.id)) throw new AdminError(404, "Slika nije pronađena.");
    const image = await readImage(req.query.id);
    res.setHeader("Content-Type", image.mime); res.setHeader("Content-Disposition", "inline");
    return res.send(image.bytes);
  } catch (error) { return apiFailure(res, error); }
}
