import type { NextApiRequest, NextApiResponse } from "next";
import { apiFailure, authorize } from "@/server/admin/http";
import { translateNews } from "@/server/admin/translation";
export const config = { api: { bodyParser: { sizeLimit: "2mb" } }, maxDuration: 120 };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try { const session = authorize(req, res, ["POST"]); return res.json({ article: await translateNews(req.body?.draft, req.body?.expectedRevision, req.body?.confirmedLocales, session.user) }); }
  catch (error) { return apiFailure(res, error); }
}
