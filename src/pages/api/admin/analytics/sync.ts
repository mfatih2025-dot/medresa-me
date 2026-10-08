import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { parsePeriod } from "@/admin/analytics/period";
import { apiFailure, authorize } from "@/server/admin/http";
import { synchronize } from "@/server/admin/analytics/service";
export const config = { api: { bodyParser: { sizeLimit: "2kb" } }, maxDuration: 120 };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["POST"]);
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => !["period", "requestId"].includes(k)) || typeof body.requestId !== "string") throw new AdminError(422, "Zahtjev nije ispravan.");
    let period; try { period = parsePeriod(body.period); } catch { throw new AdminError(422, "Period nije ispravan."); }
    return res.status(200).json(await synchronize(period, body.requestId));
  } catch (error) { return apiFailure(res, error); }
}
