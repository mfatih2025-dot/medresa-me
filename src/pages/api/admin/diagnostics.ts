import type { NextApiRequest, NextApiResponse } from "next";
import { adminConfigurationDiagnostic } from "@/server/admin/diagnostics";
import { supabaseConnectionDiagnostic } from "@/server/admin/supabaseDiagnostic";
import { apiFailure, authorize } from "@/server/admin/http";
import { translationConfigurationDiagnostic } from "@/server/admin/translation";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (process.env.VERCEL_ENV !== "preview") return res.status(404).json({ error: "Dijagnostika je dostupna samo u Preview okruženju." });
  try {
    authorize(req, res, ["GET"]);
    if (req.query?.connectivity === "1") return res.status(200).json({ ...adminConfigurationDiagnostic(), connectivity: await supabaseConnectionDiagnostic(), translation: translationConfigurationDiagnostic() });
    return res.status(200).json(adminConfigurationDiagnostic());
  } catch (error) { return apiFailure(res, error); }
}
