import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { finishUpload } from "@/server/admin/results/service";
export const config={api:{bodyParser:{sizeLimit:"8kb"}}};
export const maxDuration=60;
export default async function handler(req:NextApiRequest,res:NextApiResponse){try{const s=authorize(req,res,["POST"]);return res.json({state:await finishUpload(req.body?.id,req.body?.revision,s.user)});}catch(error){return apiFailure(res,error);}}
