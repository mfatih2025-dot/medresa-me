-- PREVIEW ONLY. Apply manually to a separate Preview Supabase project after review.
-- Additive migration: no DROP/TRUNCATE, no changes to existing tables/services.
begin;

create table public.medresa_admin_assets (
  id text primary key, origin text not null check (origin in ('archive','upload')),
  bucket text, object_path text unique, mime text, bytes bigint,
  metadata jsonb not null, original_path text,
  created_at timestamptz not null default now(), created_by text not null,
  check ((origin = 'archive' and bucket is null) or (origin = 'upload' and bucket = 'medresa-news-preview' and object_path is not null)),
  check (mime is null or mime in ('image/jpeg','image/png','image/webp'))
);
create table public.medresa_admin_articles (
  id text primary key, document jsonb not null, revision bigint not null check (revision >= 0),
  status text not null check (status in ('draft','ready','published')),
  publication_date text not null, cover_asset_id text references public.medresa_admin_assets(id),
  archived_at timestamptz, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  published_at timestamptz, published_revision bigint,
  import_fingerprint text, source_order integer, legacy_article jsonb,
  check (document->>'id' = id and (document->>'revision')::bigint = revision)
);
create table public.medresa_admin_localizations (
  article_id text not null references public.medresa_admin_articles(id),
  locale text not null check (locale in ('bs','sq','en')), title text not null, slug text not null, lead text not null,
  reviewed boolean not null, reviewed_revision bigint,
  primary key(article_id,locale)
);
create unique index medresa_admin_reserved_slug on public.medresa_admin_localizations(locale,slug) where slug <> '';
create table public.medresa_admin_blocks (
  article_id text not null references public.medresa_admin_articles(id), id text not null,
  position integer not null check (position >= 0), kind text not null check (kind in ('text','subheading','image','quote')),
  asset_id text references public.medresa_admin_assets(id), primary key(article_id,id),
  unique(article_id,position) deferrable initially deferred,
  check ((kind = 'image') = (asset_id is not null))
);
create table public.medresa_admin_block_text (
  article_id text not null, block_id text not null, locale text not null check (locale in ('bs','sq','en')), text text not null,
  primary key(article_id,block_id,locale), foreign key(article_id,block_id) references public.medresa_admin_blocks(article_id,id) on delete cascade
);
create table public.medresa_admin_article_images (
  article_id text not null references public.medresa_admin_articles(id), asset_id text not null references public.medresa_admin_assets(id),
  position integer not null, alt jsonb not null, primary key(article_id,asset_id)
);
create table public.medresa_admin_revisions (
  article_id text not null references public.medresa_admin_articles(id), revision bigint not null,
  document jsonb not null, actor text not null, action text not null, created_at timestamptz not null default now(),
  primary key(article_id,revision)
);
create table public.medresa_admin_publications (
  article_id text not null references public.medresa_admin_articles(id), revision bigint not null,
  snapshot jsonb not null, actor text not null, created_at timestamptz not null default now(),
  primary key(article_id,revision)
);
create index medresa_admin_listing on public.medresa_admin_articles(publication_date desc,id desc);
alter table public.medresa_admin_articles add constraint medresa_admin_active_publication foreign key(id,published_revision) references public.medresa_admin_publications(article_id,revision) deferrable initially deferred;
-- Future data boundary only. It is not used by any public route in Phase 2.
create view public.medresa_admin_public_feed with (security_invoker=true) as
select a.id,a.publication_date,a.source_order,p.snapshot
from public.medresa_admin_articles a join public.medresa_admin_publications p on p.article_id=a.id and p.revision=a.published_revision
where a.archived_at is null and a.deleted_at is null;
revoke all on public.medresa_admin_public_feed from anon,authenticated;
grant select on public.medresa_admin_public_feed to service_role;

-- All browser access denied. Existing private admin session authorizes server operations.
alter table public.medresa_admin_assets enable row level security;
alter table public.medresa_admin_articles enable row level security;
alter table public.medresa_admin_localizations enable row level security;
alter table public.medresa_admin_blocks enable row level security;
alter table public.medresa_admin_block_text enable row level security;
alter table public.medresa_admin_article_images enable row level security;
alter table public.medresa_admin_revisions enable row level security;
alter table public.medresa_admin_publications enable row level security;
revoke all on public.medresa_admin_assets, public.medresa_admin_articles, public.medresa_admin_localizations, public.medresa_admin_blocks, public.medresa_admin_block_text, public.medresa_admin_article_images, public.medresa_admin_revisions, public.medresa_admin_publications from anon, authenticated;
grant select, insert, update, delete on public.medresa_admin_assets, public.medresa_admin_articles, public.medresa_admin_localizations, public.medresa_admin_blocks, public.medresa_admin_block_text, public.medresa_admin_article_images, public.medresa_admin_revisions, public.medresa_admin_publications to service_role;

-- Replace derived projections only, within the same transaction. Revision JSON retains history.
create function public.medresa_admin_project(p_document jsonb) returns void language plpgsql set search_path = public, pg_temp as $$
declare l text; b jsonb; i jsonb; n integer := 0; aid text := p_document->>'id';
begin
  foreach l in array array['bs','sq','en'] loop
    insert into medresa_admin_localizations values(aid,l,p_document->'title'->>l,p_document->'slug'->>l,p_document->'lead'->>l,(p_document->'review'->l->>'approved')::boolean,(p_document->'review'->l->>'reviewedRevision')::bigint)
    on conflict(article_id,locale) do update set title=excluded.title,slug=excluded.slug,lead=excluded.lead,reviewed=excluded.reviewed,reviewed_revision=excluded.reviewed_revision;
  end loop;
  delete from medresa_admin_blocks where article_id=aid;
  for b in select value from jsonb_array_elements(p_document->'blocks') loop
    -- Empty image blocks are allowed in a draft; project only assigned image blocks.
    if b->>'type' <> 'image' or coalesce(b->>'assetId','') <> '' then
      insert into medresa_admin_blocks values(aid,b->>'id',n,b->>'type',case when b->>'type'='image' then b->>'assetId' end);
      if b->>'type'<>'image' then foreach l in array array['bs','sq','en'] loop
        insert into medresa_admin_block_text values(aid,b->>'id',l,b->'text'->>l);
      end loop; end if;
    end if;
    n := n+1;
  end loop;
  delete from medresa_admin_article_images where article_id=aid;
  n := 0;
  for i in select value from jsonb_array_elements(p_document->'images') loop
    -- Local archive assets are registered without copying/deleting their public files.
    if i->>'id' like 'archive-%' then
      insert into medresa_admin_assets(id,origin,metadata,created_by) values(i->>'id','archive',i,'static-import') on conflict(id) do nothing;
    end if;
    insert into medresa_admin_article_images values(aid,i->>'id',n,i->'alt'); n:=n+1;
  end loop;
end $$;

create function public.medresa_admin_save(p_document jsonb, p_expected bigint, p_actor text)
returns public.medresa_admin_articles language plpgsql set search_path = public, pg_temp as $$
declare r medresa_admin_articles; aid text := p_document->>'id'; i jsonb;
begin
  -- Assets must exist before the cover FK is assigned.
  for i in select value from jsonb_array_elements(p_document->'images') loop
    if i->>'id' like 'archive-%' then insert into medresa_admin_assets(id,origin,metadata,created_by) values(i->>'id','archive',i,p_actor) on conflict(id) do nothing; end if;
  end loop;
  if p_expected = -1 then
    if p_document->>'status'<>'draft' or (p_document->>'revision')::bigint<>0 then raise exception 'Invalid initial draft'; end if;
    insert into medresa_admin_articles(id,document,revision,status,publication_date,cover_asset_id)
    values(aid,p_document,0,'draft',p_document->>'date',p_document->>'coverImageId') returning * into r;
  else
    select * into r from medresa_admin_articles where id=aid for update;
    if not found then raise exception 'Missing article' using errcode='P0002'; end if;
    if r.revision<>p_expected or r.deleted_at is not null or r.archived_at is not null then raise exception 'Stale revision' using errcode='40001'; end if;
    if (p_document->>'revision')::bigint < p_expected or p_document->>'status' not in ('draft','ready') or (p_document->'legacy') is distinct from (r.document->'legacy') then raise exception 'Invalid update'; end if;
    if (p_document->>'revision')::bigint = p_expected and p_document is distinct from r.document then raise exception 'Stale revision' using errcode='40001'; end if;
    update medresa_admin_articles set document=p_document, revision=(p_document->>'revision')::bigint, status=p_document->>'status', publication_date=p_document->>'date',cover_asset_id=p_document->>'coverImageId',updated_at=now() where id=aid returning * into r;
  end if;
  perform medresa_admin_project(r.document);
  insert into medresa_admin_revisions values(aid,r.revision,r.document,p_actor,'save',now()) on conflict(article_id,revision) do nothing;
  return r;
end $$;

create function public.medresa_admin_publish(p_id text, p_expected bigint, p_snapshot jsonb, p_actor text)
returns public.medresa_admin_articles language plpgsql set search_path = public, pg_temp as $$
declare r medresa_admin_articles; d jsonb; l text; b jsonb; image jsonb; next_rev bigint;
begin
  select * into r from medresa_admin_articles where id=p_id for update;
  if not found then raise exception 'Missing article' using errcode='P0002'; end if;
  if r.revision<>p_expected or r.deleted_at is not null or r.archived_at is not null then raise exception 'Stale revision' using errcode='40001'; end if;
  d:=r.document; next_rev:=r.revision+1;
  if r.cover_asset_id is null or r.publication_date !~ '^\d{4}-\d{2}-\d{2}$' or to_char(r.publication_date::date,'YYYY-MM-DD')<>r.publication_date or jsonb_array_length(d->'blocks')=0 then raise exception 'Incomplete article'; end if;
  foreach l in array array['bs','sq','en'] loop
    if btrim(d->'title'->>l)='' or d->'slug'->>l !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or d->'slug'->>l ~ '^\d+$' or not coalesce((d->'review'->l->>'approved')::boolean,false) or coalesce((d->'review'->l->>'reviewedRevision')::bigint,-1)<>r.revision or not exists(select 1 from jsonb_array_elements(d->'blocks') as block where block->>'type'<>'image') then raise exception 'Missing language or review'; end if;
    if p_snapshot->l->>'slug' is distinct from d->'slug'->>l or p_snapshot->l->>'title' is distinct from d->'title'->>l then raise exception 'Localized snapshot mismatch'; end if;
    for b in select value from jsonb_array_elements(d->'blocks') loop
      if b->>'type'<>'image' and btrim(b->'text'->>l)='' then raise exception 'Empty block'; end if;
      if b->>'type'='image' and not exists(select 1 from jsonb_array_elements(d->'images') as img where img->>'id'=b->>'assetId' and btrim(img->'alt'->>l)<>'') then raise exception 'Missing image description'; end if;
    end loop;
    for image in select value from jsonb_array_elements(d->'images') loop
      if btrim(image->'alt'->>l)='' then raise exception 'Missing alt text'; end if;
    end loop;
    d:=jsonb_set(d,array['review',l,'reviewedRevision'],to_jsonb(next_rev));
  end loop;
  if p_snapshot->>'id'<>p_id or p_snapshot->>'date'<>r.publication_date then raise exception 'Snapshot mismatch'; end if;
  d:=jsonb_set(jsonb_set(d,'{revision}',to_jsonb(next_rev)),'{status}','"published"');
  insert into medresa_admin_publications values(p_id,next_rev,p_snapshot,p_actor,now());
  update medresa_admin_articles set document=d,revision=next_rev,status='published',published_revision=next_rev,published_at=coalesce(published_at,now()),updated_at=now() where id=p_id returning * into r;
  perform medresa_admin_project(d);
  insert into medresa_admin_revisions values(p_id,next_rev,d,p_actor,'publish',now());
  return r;
end $$;

create function public.medresa_admin_transition(p_id text, p_expected bigint, p_action text, p_actor text)
returns public.medresa_admin_articles language plpgsql set search_path = public, pg_temp as $$
declare r medresa_admin_articles; d jsonb; l text;
begin
  if p_action not in ('archive','trash','restore') then raise exception 'Invalid action'; end if;
  select * into r from medresa_admin_articles where id=p_id for update;
  if not found then raise exception 'Missing article' using errcode='P0002'; end if;
  if r.revision<>p_expected then raise exception 'Stale revision' using errcode='40001'; end if;
  d:=jsonb_set(r.document,'{revision}',to_jsonb(r.revision+1));
  foreach l in array array['bs','sq','en'] loop
    if (d->'review'->l->>'approved')::boolean then d:=jsonb_set(d,array['review',l,'reviewedRevision'],to_jsonb(r.revision+1)); end if;
  end loop;
  update medresa_admin_articles set document=d,revision=revision+1,updated_at=now(),
    archived_at=case when p_action='archive' then now() when p_action='restore' and deleted_at is null then null else archived_at end,
    deleted_at=case when p_action='trash' then now() when p_action='restore' then null else deleted_at end
  where id=p_id returning * into r;
  perform medresa_admin_project(d);
  insert into medresa_admin_revisions values(p_id,r.revision,d,p_actor,p_action,now());
  return r;
end $$;

create function public.medresa_admin_import(p_items jsonb,p_actor text) returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare item jsonb; d jsonb; i jsonb; r medresa_admin_articles; inserted integer:=0; skipped integer:=0;
begin
  if jsonb_array_length(p_items)<>17 then raise exception 'Expected 17 verified articles'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    d:=item->'document';
    select * into r from medresa_admin_articles where id=d->>'id' for update;
    if found then
      if r.import_fingerprint is distinct from item->>'fingerprint' then raise exception 'Import conflict; nothing overwritten' using errcode='40001'; end if;
      skipped:=skipped+1; continue;
    end if;
    for i in select value from jsonb_array_elements(d->'images') loop
      insert into medresa_admin_assets(id,origin,metadata,created_by) values(i->>'id','archive',i,p_actor) on conflict(id) do nothing;
    end loop;
    insert into medresa_admin_articles(id,document,revision,status,publication_date,cover_asset_id,published_at,published_revision,import_fingerprint,source_order,legacy_article)
    values(d->>'id',d,0,'published',d->>'date',d->>'coverImageId',now(),0,item->>'fingerprint',(item->>'source_order')::integer,item->'snapshot');
    perform medresa_admin_project(d);
    insert into medresa_admin_publications values(d->>'id',0,item->'snapshot',p_actor,now());
    insert into medresa_admin_revisions values(d->>'id',0,d,p_actor,'import',now());
    inserted:=inserted+1;
  end loop;
  return jsonb_build_object('inserted',inserted,'skipped',skipped);
end $$;

revoke execute on function public.medresa_admin_project(jsonb), public.medresa_admin_save(jsonb,bigint,text), public.medresa_admin_publish(text,bigint,jsonb,text), public.medresa_admin_transition(text,bigint,text,text), public.medresa_admin_import(jsonb,text) from public,anon,authenticated;
grant execute on function public.medresa_admin_project(jsonb), public.medresa_admin_save(jsonb,bigint,text), public.medresa_admin_publish(text,bigint,jsonb,text), public.medresa_admin_transition(text,bigint,text,text), public.medresa_admin_import(jsonb,text) to service_role;

-- Private draft media. No public/anon storage policies; server authenticates each read/upload.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('medresa-news-preview','medresa-news-preview',false,10485760,array['image/jpeg','image/png','image/webp']);
commit;
