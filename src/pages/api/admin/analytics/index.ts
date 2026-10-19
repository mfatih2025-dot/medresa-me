import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { parsePeriod } from "@/admin/analytics/period";
import { apiFailure, authorize } from "@/server/admin/http";
import { dashboard } from "@/server/admin/analytics/service";
import { previewConfiguration } from "@/server/admin/analytics/common";
import { instagramAudit } from "@/server/admin/analytics/instagramAudit";
import { backendDeploymentSupported } from "@/server/backendDeployment";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    authorize(req, res, ["GET"]); previewConfiguration();
    let period; try { period = parsePeriod(req.query.period); } catch { throw new AdminError(422, "Period nije ispravan."); }
    if (req.query.diagnostic !== undefined) {
      if (!backendDeploymentSupported()) throw new AdminError(404, "Nije pronađeno.");
      if (req.query.diagnostic !== "instagram" || period !== "90" || (req.query.fresh !== undefined && req.query.fresh !== "1")) throw new AdminError(422, "Dijagnostički zahtjev nije ispravan.");
      return res.status(200).json(await instagramAudit(req.query.fresh === "1"));
    }
    return res.status(200).json(await dashboard(period));
  } catch (error) { return apiFailure(res, error); }
}
