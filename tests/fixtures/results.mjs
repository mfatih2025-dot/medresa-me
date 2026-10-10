import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {database,fixtureEnvironment,providerHost} from './analytics.mjs';
export {fixtureEnvironment,providerHost};
export async function resultsDatabase(){const db=await database();await db.exec(readFileSync('supabase/migrations/202610100003_admission_results.sql','utf8'));await db.exec(readFileSync("supabase/migrations/202610100001_campaigns.sql","utf8"));await db.exec(readFileSync("supabase/migrations/202610100002_campaign_localization_delete.sql","utf8"));await db.exec(readFileSync("supabase/migrations/202610100004_independent_locale_channels.sql","utf8"));await db.exec(readFileSync("supabase/migrations/202610100005_admissions_status.sql","utf8"));return db;}
export async function pdfFixture(label='Explicit local PDF fixture',size){
 const doc=await PDFDocument.create();doc.addPage([200,300]).drawText(label);const bytes=Buffer.from(await doc.save({useObjectStreams:false}));
 if(!size)return bytes;assert.ok(size>=bytes.length+3);const end=bytes.lastIndexOf('%%EOF');const padding=Buffer.from('\n%'+ 'p'.repeat(size-bytes.length-3)+'\n');return Buffer.concat([bytes.subarray(0,end),padding,bytes.subarray(end)]);
}
export function resultsRest(db,objects=new Map()){
 const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
 const fields={medresa_admissions_set_status:['p_open','p_expected','p_actor'],medresa_results_finalize:['p_upload','p_expected','p_sha256','p_pages','p_actor'],medresa_results_publish_locale:['p_id','p_expected','p_locale','p_actor'],medresa_results_remove_draft:['p_locale','p_expected']};
 return async(input,init={})=>{
  const u=new URL(String(input));assert.equal(u.origin,providerHost,'Only explicit local database fixtures allowed');
  try{
   if(u.pathname.startsWith('/rest/v1/rpc/')){const name=u.pathname.split('/').pop();assert.ok(fields[name]);const b=JSON.parse(init.body);return json((await db.query(`select to_jsonb(${name}(${fields[name].map((_,i)=>'$'+(i+1)).join(',')})) result`,fields[name].map(f=>b[f]))).rows[0].result);}
   if(u.pathname.startsWith('/rest/v1/')){
    const table=u.pathname.split('/').pop();assert.ok(table==="medresa_admissions_status"||/^medresa_results_(assets|state|uploads|publications|locale_publications|locale_heads)$/.test(table));
    if(init.method==='POST'){assert.equal(table,'medresa_results_uploads');const row=JSON.parse(init.body),keys=Object.keys(row);assert.ok(keys.every(k=>/^[a-z_]+$/.test(k)));await db.query(`insert into ${table}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));return json({},201);}
    assert.ok(!init.method||init.method==='GET');const args=[],where=[];
    for(const[k,v]of u.searchParams)if(['id','singleton','locale'].includes(k)&&v.startsWith('eq.')){args.push(v.slice(3));where.push(`${k}=$${args.length}`);}
    return json((await db.query(`select * from ${table}${where.length?' where '+where.join(' and '):''}`,args)).rows);
   }
   assert.ok(u.pathname.startsWith('/storage/v1/object/'));
   if(init.method==='DELETE'){assert.equal(u.pathname,'/storage/v1/object/medresa-results-preview');for(const p of JSON.parse(init.body).prefixes){assert.ok(p.startsWith('uploads/'));objects.delete('medresa-results-preview/'+p);}return json([]);}
   const path=u.pathname.slice('/storage/v1/object/'.length).replace(/^authenticated\//,'');assert.ok(path.startsWith('medresa-results-preview/'));
   if(init.method==='POST'){assert.equal(new Headers(init.headers).get('x-upsert'),'false');if(objects.has(path))return json({code:'23505'},409);objects.set(path,{bytes:Buffer.from(init.body),mime:new Headers(init.headers).get('Content-Type')});return json({},201);}
   const o=objects.get(path);return o?new Response(new Uint8Array(o.bytes),{headers:{'Content-Type':o.mime}}):json({code:'404'},404);
  }catch(error){return json({code:error.code||'fixture_error'},500);}
 };
}
