import type { NextApiRequest, NextApiResponse } from "next";
import { publicPoster } from "@/server/admin/campaigns/service";
export const config = { api: { responseLimit: "12mb" } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0"); res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }
  try {
    if (typeof req.query.id !== "string" || typeof req.query.version !== "string") return res.status(404).end();
    const image = await publicPoster(req.query.id, req.query.version);
    res.setHeader("Content-Type", image.mime); res.setHeader("Content-Disposition", "inline");
    return res.send(image.bytes);
  } catch { return res.status(404).end(); }
}
