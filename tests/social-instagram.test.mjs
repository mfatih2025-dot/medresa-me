import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';

for (const type of ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']) test(`Facebook Login discovers Page account and maps ${type} without credential exposure`, async () => {
  const originalFetch=globalThis.fetch, originalToken=process.env.INSTAGRAM_ACCESS_TOKEN;
  process.env.INSTAGRAM_ACCESS_TOKEN='fixture-user-secret';
  const calls=[];
  globalThis.fetch=async (input, options)=>{
    const url=new URL(input); calls.push(url);
    assert.equal(url.hostname,'graph.facebook.com');
    assert.deepEqual(options.next,{revalidate:1800,tags:['instagram']});
    if(url.pathname.endsWith('/me/accounts')) {
      assert.equal(url.searchParams.get('access_token'),'fixture-user-secret');
      return Response.json({data:[{id:'578640758657974',access_token:'fixture-page-secret'}]});
    }
    assert.equal(url.searchParams.get('access_token'),'fixture-page-secret');
    if(url.pathname.endsWith('/578640758657974')) return Response.json({instagram_business_account:{id:'123456'}});
    assert.equal(url.pathname,'/v26.0/123456/media');
    return Response.json({data:[{id:'post',media_type:type,caption:'Real caption fixture',timestamp:'2026-10-11T10:00:00Z',permalink:'https://www.instagram.com/p/example/',media_url:type==='VIDEO'?'https://cdn.example/video.mp4':'https://cdn.example/photo.jpg',thumbnail_url:'https://cdn.example/cover.jpg'}]});
  };
  try {
    const provider=moduleLoader({'server-only':{}})('src/lib/social/providers/instagram.ts');
    const post=await provider.latestInstagramPost();
    assert.equal(post.url,'https://www.instagram.com/p/example/');
    assert.equal(post.media.src,type==='VIDEO'?'https://cdn.example/cover.jpg':'https://cdn.example/photo.jpg');
    assert.equal(post.source,'meta'); assert.equal(calls.length,3);
    assert.ok(!JSON.stringify(post).includes('secret'));
  } finally {globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.INSTAGRAM_ACCESS_TOKEN; else process.env.INSTAGRAM_ACCESS_TOKEN=originalToken;}
});
test('failed discovery never requests old Instagram Login API or fabricates posts',async()=>{
  const originalFetch=globalThis.fetch, originalToken=process.env.INSTAGRAM_ACCESS_TOKEN;
  process.env.INSTAGRAM_ACCESS_TOKEN='fixture-user-secret';
  globalThis.fetch=async input=>{assert.equal(new URL(input).hostname,'graph.facebook.com'); return Response.json({data:[]});};
  try {assert.equal(await moduleLoader({'server-only':{}})('src/lib/social/providers/instagram.ts').latestInstagramPost(),null);}
  finally {globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.INSTAGRAM_ACCESS_TOKEN; else process.env.INSTAGRAM_ACCESS_TOKEN=originalToken;}
});
test('unchanged Facebook feed still resolves Page token, image and post link',async()=>{
  const originalFetch=globalThis.fetch, originalToken=process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN='fixture-facebook-user';
  globalThis.fetch=async input=>{
    const url=new URL(input); assert.equal(url.hostname,'graph.facebook.com');
    if(!url.pathname.endsWith('/published_posts')) return Response.json({access_token:'fixture-facebook-page'});
    assert.equal(url.searchParams.get('access_token'),'fixture-facebook-page');
    return Response.json({data:[{created_time:'2026-10-11T10:00:00Z',message:'Facebook fixture',permalink_url:'https://www.facebook.com/medresacg/posts/example',full_picture:'https://cdn.example/facebook.jpg'}]});
  };
  try {const post=await moduleLoader({'server-only':{}})('src/lib/social/providers/facebook.ts').latestFacebookPost(); assert.equal(post.media.src,'https://cdn.example/facebook.jpg'); assert.equal(post.url,'https://www.facebook.com/medresacg/posts/example');}
  finally {globalThis.fetch=originalFetch; if(originalToken===undefined) delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN; else process.env.FACEBOOK_PAGE_ACCESS_TOKEN=originalToken;}
});
