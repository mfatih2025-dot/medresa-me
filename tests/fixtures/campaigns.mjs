import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { database, fixtureEnvironment, providerHost } from './analytics.mjs';
export { fixtureEnvironment, providerHost };
export async function campaignDatabase(localized=true) {
  const db=await database();
  await db.exec(readFileSync('supabase/migrations/202610100001_campaigns.sql','utf8'));
  if(localized) { await db.exec(readFileSync('supabase/migrations/202610100002_campaign_localization_delete.sql','utf8'));
    await db.exec(readFileSync('supabase/migrations/202610100003_admission_results.sql','utf8'));
    await db.exec(readFileSync('supabase/migrations/202610100004_independent_locale_channels.sql','utf8'));
  }
  return db;
}
export function campaignRest(db, objects=new Map()) {
  const fields=['p_id','p_expected','p_name','p_poster','p_content','p_channels','p_starts','p_ends','p_actor'];
  const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
  return async(input,init={})=> {
    const u=new URL(String(input));assert.equal(u.origin,providerHost,'Remote connections forbidden by explicit local fixture');
    try {
      if(u.pathname==='/rest/v1/rpc/medresa_campaign_save_channels') {
        const body=JSON.parse(init.body),r=await db.query(`select to_jsonb(medresa_campaign_save_channels(${fields.map((_,i)=>'$'+(i+1)).join(',')})) result`,fields.map(f=>body[f]));
        return json(r.rows[0].result);
      }
      if(u.pathname==='/rest/v1/rpc/medresa_campaign_delete') { const b=JSON.parse(init.body);return json((await db.query('select medresa_campaign_delete($1,$2) result',[b.p_id,b.p_expected])).rows[0].result); }
      if(u.pathname==='/rest/v1/rpc/medresa_campaign_finish_cleanup') { const b=JSON.parse(init.body);await db.query('select medresa_campaign_finish_cleanup($1)',[b.p_asset]);return json(null); }
      if(u.pathname.startsWith('/rest/v1/')) {
        const table=u.pathname.split('/').pop();assert.ok(['medresa_campaigns','medresa_campaign_assets'].includes(table));
        if(init.method==='POST') {
          assert.equal(table,'medresa_campaign_assets');const row=JSON.parse(init.body),keys=Object.keys(row);
          assert.ok(keys.every(k=>/^[a-z_]+$/.test(k)));
          await db.query(`insert into ${table}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));return json({},201);
        }
        assert.ok(!init.method || init.method==='GET');
        const args=[],where=[];
        for(const [k,v]of u.searchParams) if(['id','active'].includes(k)&&v.startsWith('eq.')){args.push(v.slice(3));where.push(`${k}=$${args.length}`);}
        const result=await db.query(`select * from ${table}${where.length?' where '+where.join(' and '):''} order by created_at,id`,args);
        const projected=[];
        for(const row of result.rows) {
          if(table==='medresa_campaigns') row.poster=row.poster_id?(await db.query('select id,width,height from medresa_campaign_assets where id=$1',[row.poster_id])).rows[0]:null;
          projected.push(row);
        }
        const offset=Number(u.searchParams.get('offset')||0),limit=Number(u.searchParams.get('limit')||projected.length);
        return json(projected.slice(offset,offset+limit));
      }
      assert.ok(u.pathname.startsWith('/storage/v1/object/'));
      if(init.method==='DELETE') { assert.equal(u.pathname,'/storage/v1/object/medresa-campaigns-preview');const {prefixes}=JSON.parse(init.body);for(const p of prefixes) objects.delete('medresa-campaigns-preview/'+p);return json([]); }
      const path=u.pathname.slice('/storage/v1/object/'.length).replace(/^authenticated\//,'');
      assert.ok(path.startsWith('medresa-campaigns-preview/posters/'));
      if(init.method==='POST'){assert.equal(new Headers(init.headers).get('x-upsert'),'false');assert.ok(!objects.has(path));objects.set(path,{bytes:Buffer.from(init.body),mime:new Headers(init.headers).get('Content-Type')});return json({},201);}
      const object=objects.get(path);return object?new Response(new Uint8Array(object.bytes),{headers:{'Content-Type':object.mime}}):json({code:'notfound'},404);
    }catch(error){return json({code:error.code||'fixture_error'},500);}
  };
}
