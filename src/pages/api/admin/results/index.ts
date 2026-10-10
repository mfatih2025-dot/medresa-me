import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { authorize, apiFailure } from "@/server/admin/http";
import { listResults, publishResults, removeDraft, resultsConfiguration } from "@/server/admin/results/service";
export const config = { api: { bodyParser: { sizeLimit: "8kb" } } };
export const maxDuration = 60;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session=authorize(req,res,["GET","POST"]);resultsConfiguration();
    if(req.method==="GET")return res.json(await listResults());
    if(req.body?.action==="remove")return res.json({state:await removeDraft(req.body.locale,req.body.revision)});
    if(req.body?.action==="publish")return res.json({state:await publishResults(req.body.revision,session.user,req.body.id,req.body.locale)});
    throw new AdminError(422,"Radnja nije ispravna.");
  }catch(error){return apiFailure(res,error);}
}
