import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { deleteCampaign, campaignConfiguration, listCampaigns, saveCampaign } from "@/server/admin/campaigns/service";
export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = authorize(req, res, ["GET", "POST", "DELETE"]); campaignConfiguration();
    if (req.method === "GET") return res.json(await listCampaigns());
    if (req.method === "DELETE") return res.json(await deleteCampaign(req.body));
    return res.status(req.body?.revision === 0 ? 201 : 200).json({ campaign: await saveCampaign(req.body, session.user) });
  } catch (error) { return apiFailure(res, error); }
}
