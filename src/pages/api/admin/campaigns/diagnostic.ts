import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { diagnoseCampaign } from "@/server/admin/campaigns/service";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]);
    return res.json(await diagnoseCampaign(typeof req.query.id === "string" ? req.query.id : ""));
  } catch (error) { return apiFailure(res, error); }
}
