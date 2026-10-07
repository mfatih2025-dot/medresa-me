import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { createDraft, listNews } from "@/server/admin/news";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = authorize(req, res, ["GET", "POST"]);
    if (req.method === "GET") return res.json(await listNews());
    return res.status(201).json({ article: await createDraft(session.user, req.body?.draft) });
  } catch (error) { return apiFailure(res, error); }
}
