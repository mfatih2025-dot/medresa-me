import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { parsePeriod } from "@/admin/analytics/period";
import { apiFailure, authorize } from "@/server/admin/http";
import { backendDeploymentSupported } from "@/server/backendDeployment";
import { readOnlyYouTubeDiagnostic } from "@/server/admin/analytics/youtubeReadOnly";
export const config = { maxDuration: 60 };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]);
    if (!backendDeploymentSupported()) throw new AdminError(404, "Nije pronađeno.");
    let period; try { period = parsePeriod(req.query.period); } catch { throw new AdminError(422, "Period nije ispravan."); }
    return res.status(200).json(await readOnlyYouTubeDiagnostic(period));
  } catch (error) { return apiFailure(res, error); }
}
