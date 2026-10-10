import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { readPdf } from "@/server/admin/results/service";
import { sendPdf } from "@/server/admin/results/download";
export const config={api:{responseLimit:false}};
export default async function handler(req:NextApiRequest,res:NextApiResponse){try{authorize(req,res,["GET"]);const pdf=await readPdf(typeof req.query.id==="string"?req.query.id:"");return await sendPdf(res,pdf.bytes,pdf.asset.filename);}catch(error){if(res.headersSent){res.destroy();return;}return apiFailure(res,error);}}
