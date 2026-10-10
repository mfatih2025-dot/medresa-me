import type { NextApiRequest, NextApiResponse } from "next";
import { currentCampaign } from "@/server/admin/campaigns/service";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0"); res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ campaign: null }); }
  return res.json(await currentCampaign());
}
