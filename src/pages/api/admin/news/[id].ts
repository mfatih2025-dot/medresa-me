import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError, safeId } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { getNews, publishNews, saveDraft, transitionNews } from "@/server/admin/news";
export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = authorize(req, res, ["GET", "POST"]);
    const id = req.query.id;
    if (!safeId(id)) throw new AdminError(422, "Neispravan identitet vijesti.");
    if (req.method === "GET") { const article = await getNews(id); if (!article) throw new AdminError(404, "Vijest nije pronađena."); return res.json({ article }); }
    const { action, expectedRevision, draft, confirmedId } = req.body ?? {};
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new AdminError(422, "Neispravna revizija.");
    if (action === "save") { if (draft?.id !== id) throw new AdminError(422, "Identitet nacrta nije isti."); return res.json({ article: await saveDraft(draft, expectedRevision, session.user) }); }
    if (action === "publish") return res.json({ article: await publishNews(id, expectedRevision, session.user) });
    if (["archive", "trash", "restore"].includes(action)) {
      if (["archive", "trash"].includes(action) && confirmedId !== id) throw new AdminError(422, "Potrebna je potvrda odabrane vijesti.");
      return res.json({ article: await transitionNews(id, expectedRevision, action, session.user) });
    }
    throw new AdminError(422, "Nepoznata akcija.");
  } catch (error) { return apiFailure(res, error); }
}
