import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { readPoster } from "@/server/admin/campaigns/service";
export const config = { api: { responseLimit: "12mb" } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]);
    if (typeof req.query.id !== "string") throw new AdminError(404, "Slika nije pronađena.");
    const image = await readPoster(req.query.id);
    res.setHeader("Content-Type", image.mime); res.setHeader("Content-Disposition", "inline");
    return res.send(image.bytes);
  } catch (error) { return apiFailure(res, error); }
}
