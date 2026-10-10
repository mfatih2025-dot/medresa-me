import type { NextApiRequest, NextApiResponse } from "next";
import { authorize, apiFailure } from "@/server/admin/http";
import { uploadChunk, resultsConfiguration } from "@/server/admin/results/service";
import { PDF_CHUNK_BYTES } from "@/admin/results/model";
import { AdminError } from "@/admin/contracts";
export const config={api:{bodyParser:false}};
export default async function handler(req:NextApiRequest,res:NextApiResponse){
 try{
  const session=authorize(req,res,["POST"]);resultsConfiguration(true);
  if(req.headers["content-type"]!=="application/octet-stream"||typeof req.query.id!=="string"||typeof req.query.index!=="string"||!/^\d$/.test(req.query.index))throw new AdminError(422,"Dio prenosa nije ispravan.");
  const parts:Buffer[]=[];let size=0;
  for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>PDF_CHUNK_BYTES)throw new AdminError(413,"Dio prenosa je prevelik.");parts.push(bytes);}
  await uploadChunk(req.query.id,Number(req.query.index),Buffer.concat(parts),session.user);return res.json({ok:true});
 }catch(error){return apiFailure(res,error);}
}
