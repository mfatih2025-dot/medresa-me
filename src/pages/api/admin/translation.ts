import type { NextApiRequest, NextApiResponse } from "next";
import { validateDraft } from "@/admin/contracts";
import { apiFailure, authorize } from "@/server/admin/http";
import { translateBosnianMaster } from "@/server/admin/translation";
export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try { authorize(req, res, ["POST"]); validateDraft(req.body?.draft); return res.json({ translation: await translateBosnianMaster(req.body.draft) }); }
  catch (error) { return apiFailure(res, error); }
}
