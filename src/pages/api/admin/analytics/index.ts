import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { parsePeriod } from "@/admin/analytics/period";
import { apiFailure, authorize } from "@/server/admin/http";
import { dashboard } from "@/server/admin/analytics/service";
import { previewConfiguration } from "@/server/admin/analytics/common";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]); previewConfiguration();
    let period; try { period = parsePeriod(req.query.period); } catch { throw new AdminError(422, "Period nije ispravan."); }
    return res.status(200).json(await dashboard(period));
  } catch (error) { return apiFailure(res, error); }
}
