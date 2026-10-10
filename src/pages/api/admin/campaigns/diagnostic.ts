import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { diagnoseCampaign } from "@/server/admin/campaigns/service";
import { isLocale } from "@/i18n/config";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]);
    return res.json(await diagnoseCampaign(typeof req.query.id === "string" ? req.query.id : "", isLocale(req.query.locale as string) ? req.query.locale as "bs" | "sq" | "en" : "bs"));
  } catch (error) { return apiFailure(res, error); }
}
