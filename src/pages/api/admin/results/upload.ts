import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { beginUpload } from "@/server/admin/results/service";
export const config={api:{bodyParser:{sizeLimit:"8kb"}}};
export default async function handler(req:NextApiRequest,res:NextApiResponse){try{const s=authorize(req,res,["POST"]);return res.status(201).json(await beginUpload(req.body,s.user));}catch(error){return apiFailure(res,error);}}
