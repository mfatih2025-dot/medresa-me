import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { admissionsControl, setAdmissions } from "@/server/admin/results/admissions";
export const config = { api:{bodyParser:{sizeLimit:"2kb"}} };
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
 try {
  const session = authorize(req,res,["GET","POST"]);
  if(req.method==="GET") return res.json(await admissionsControl());
  return res.json({state:await setAdmissions(req.body?.status,req.body?.revision,session.user)});
 } catch(error) { return apiFailure(res,error); }
}
