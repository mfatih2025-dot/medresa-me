import type { NextApiRequest, NextApiResponse } from "next";
import { publicPdf } from "@/server/admin/results/service";
import { sendPdf } from "@/server/admin/results/download";
export const config={api:{responseLimit:false}};
export default async function handler(req:NextApiRequest,res:NextApiResponse){
 res.setHeader("Cache-Control","no-store, max-age=0");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end();}
 try{const pdf=await publicPdf(req.query.locale);return await sendPdf(res,pdf.bytes,`rezultati-${pdf.asset.locale}.pdf`);}catch{if(res.headersSent){res.destroy();return;}return res.status(404).end();}
}
