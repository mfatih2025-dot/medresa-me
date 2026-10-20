import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';

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

// Explicit local fixtures: never contact Meta, read credentials or save public posts.
async function withFeeds(feeds, verify) {
  const originalFetch=globalThis.fetch;
  const names=['INSTAGRAM_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN'];
  const original=names.map(name=>process.env[name]);
  for(const name of names) process.env[name]='local-social-user-fixture';
  globalThis.fetch=async(input,options)=>{
    const url=new URL(input),instagram=url.pathname.endsWith('/media')||url.pathname.endsWith('/me/accounts')||url.searchParams.get('fields')==='instagram_business_account';
    assert.equal(url.hostname,'graph.facebook.com');
    assert.equal(options.next.revalidate,1800);assert.deepEqual(options.next.tags,[instagram?'instagram':'facebook']);
    if(url.pathname.endsWith('/me/accounts'))return Response.json({data:[{id:'578640758657974',access_token:'local-social-page-fixture'}]});
    if(url.searchParams.get('fields')==='instagram_business_account')return Response.json({instagram_business_account:{id:'123456'}});
    if(url.pathname.endsWith('/media'))return Response.json({data:typeof feeds.instagram==='function'?feeds.instagram():feeds.instagram});
    if(url.pathname.endsWith('/published_posts'))return Response.json({data:typeof feeds.facebook==='function'?feeds.facebook():feeds.facebook});
    assert.equal(url.pathname,'/v26.0/578640758657974');
    return Response.json({access_token:'local-social-page-fixture'});
  };
  try {return await verify(moduleLoader({'server-only':{}}));}
  finally {globalThis.fetch=originalFetch;names.forEach((name,i)=>{if(original[i]===undefined)delete process.env[name];else process.env[name]=original[i];});}
}
const instagramItem=(id,timestamp,extra={})=>({id,timestamp,permalink:`https://www.instagram.com/p/${id}/`,caption:id,media_type:'IMAGE',media_url:'https://cdn.example/image.jpg',...extra});
const facebookItem=(id,created_time,extra={})=>({id,created_time,permalink_url:`https://www.facebook.com/medresacg/posts/${id}`,message:id,...extra});

for(const [type,url] of [['VIDEO','https://cdn.example/reel.mp4'],['CAROUSEL_ALBUM','https://cdn.example/carousel.mp4'],['IMAGE',undefined]])test(`newest Instagram ${type} without a thumbnail keeps its own post and existing renderer image fallback`,async()=>{
  const newest=instagramItem('newest','2026-10-20T09:00:00Z',{media_type:type,media_url:url});
  await withFeeds({instagram:[instagramItem('older','2026-10-19T12:00:00Z'),newest]},async load=>{
    const post=await load('src/lib/social/providers/instagram').latestInstagramPost();
    assert.equal(post.url,newest.permalink);assert.equal(post.date,newest.timestamp);assert.equal(post.text,'newest');assert.equal(post.media,undefined);
    const {socialProfiles}=load('src/content/social'),dict=load('src/content').getDictionary('bs');
    const render=moduleLoader({'@/lib/social':{getLatestSocial:async()=>({instagram:post,facebook:socialProfiles.facebook})},'./SocialStories':{SocialStories:()=>null}})('src/components/sections/SocialFeed');
    const {cards}= (await render.SocialFeed({dict})).props;
    assert.equal(cards[0].url,newest.permalink);assert.equal(cards[0].dateTime,newest.timestamp);assert.equal(cards[0].text,'newest');assert.equal(cards[0].media.src,socialProfiles.instagram.media.src);
    assert.ok(!JSON.stringify(cards).includes('local-social-'));
  });
});
test('Instagram sorts real timestamp instants, not response order or timezone strings, and ignores invalid post links/dates',async()=>{
  const latest=instagramItem('latest','2026-10-20T08:30:00Z');
  await withFeeds({instagram:[instagramItem('offset-older','2026-10-20T10:00:00+02:00'),instagramItem('bad-date','not-a-date'),instagramItem('bad-link','2026-10-21T00:00:00Z',{permalink:'https://example.invalid/post'}),latest]},async load=>{
    assert.equal((await load('src/lib/social/providers/instagram').latestInstagramPost()).url,latest.permalink);
  });
});
test('unchanged Facebook selects newest created_time instant from an unordered list even without an image',async()=>{
  const latest=facebookItem('latest','2026-10-20T08:30:00Z');
  await withFeeds({facebook:[facebookItem('offset-older','2026-10-20T10:00:00+02:00',{full_picture:'https://cdn.example/older.jpg'}),latest,facebookItem('oldest','2026-10-18T00:00:00Z')]},async load=>{
    const post=await load('src/lib/social/providers/facebook').latestFacebookPost();
    assert.equal(post.url,latest.permalink_url);assert.equal(post.date,latest.created_time);assert.equal(post.text,'latest');assert.equal(post.media,undefined);
  });
});

test('Next fetch cache refreshes both feeds after 1800 seconds without redeploy and retries failed background refresh',async()=>{
  const {createPatchedFetcher}=createRequire(import.meta.url)('next/dist/server/lib/patch-fetch');
  const workAsyncStorage=new AsyncLocalStorage(),workUnitAsyncStorage=new AsyncLocalStorage();
  let clock=0,version=1,fail=false,calls=0;
  const stored=new Map();
  const incrementalCache={
    generateCacheKey:async url=>url,
    lock:async()=>()=>{},
    get:async key=>{const entry=stored.get(key);return entry?{value:entry.value,isStale:clock-entry.at>=entry.value.revalidate*1000}:null;},
    set:async(key,value)=>{assert.equal(value.revalidate,1800);stored.set(key,{value,at:clock});},
  };
  await withFeeds({instagram:()=>[instagramItem(`ig-${version}`,'2026-10-20T08:30:00Z')],facebook:()=>[facebookItem(`fb-${version}`,'2026-10-20T08:30:00Z')]},async load=>{
    const origin=globalThis.fetch;
    globalThis.fetch=createPatchedFetcher(async(...args)=>{calls++;if(fail)return new Response('{}',{status:503});return origin(...args);},{workAsyncStorage,workUnitAsyncStorage});
    const social=load('src/lib/social');
    const read=async()=>{
      const store={route:'/bs',incrementalCache,isStaticGeneration:false,isDraftMode:false,nextFetchId:0};
      const result=await workAsyncStorage.run(store,()=>social.getLatestSocial());
      // Next drains these background/cache writes after a page response.
      while(Object.keys(store.pendingRevalidates??{}).length)await Promise.all(Object.values(store.pendingRevalidates));
      return result;
    };
    const first=await read();assert.equal(first.instagram.text,'ig-1');assert.equal(first.facebook.text,'fb-1');
    version=2;clock=1799000;const before=calls;assert.equal((await read()).instagram.text,'ig-1');assert.equal(calls,before);
    clock=1801000;fail=true;const stale=await read();assert.equal(stale.instagram.text,'ig-1');assert.equal(stale.facebook.text,'fb-1');assert.ok(calls>before);fail=false;
    // The first expired request may serve stale data while revalidating.
    await read();const updated=await read();assert.equal(updated.instagram.text,'ig-2');assert.equal(updated.facebook.text,'fb-2');
    version=3;clock+=1801000;await read();const next=await read();assert.equal(next.instagram.text,'ig-3');assert.equal(next.facebook.text,'fb-3');
  });
});
