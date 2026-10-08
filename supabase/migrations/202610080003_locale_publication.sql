-- PREVIEW ONLY. Requires both existing Admin migrations. Never rerun them.
-- Apply to the verified medresa-me-preview project only, with writes disabled.
-- SQL cannot attest the selected project's dashboard identity.
-- Additive locale history/pointers; existing articles, snapshots and Storage stay intact.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare t text; r oid; f text;
begin
  foreach t in array array['assets','articles','localizations','blocks','block_text','article_images','revisions','publications','slug_reservations','publication_metadata'] loop
    r := to_regclass('public.medresa_admin_' || t);
    if r is null or not exists(select 1 from pg_class where oid=r and relkind='r' and relrowsecurity)
       or has_table_privilege('anon',r,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_table_privilege('authenticated',r,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege('anon',r,'SELECT,INSERT,UPDATE,REFERENCES')
       or has_any_column_privilege('authenticated',r,'SELECT,INSERT,UPDATE,REFERENCES')
       or exists(select 1 from pg_policy where polrelid=r) then
      raise exception 'Missing or unsafe installed Admin table: %', t;
    end if;
  end loop;
  foreach f in array array['medresa_admin_save(jsonb,bigint,text)','medresa_admin_publish(text,bigint,jsonb,text)',
    'medresa_admin_import(jsonb,text)','medresa_admin_capture_publication()',
    'medresa_admin_reserve_draft_slug()','medresa_admin_protect_slug_reservation()','medresa_admin_protect_publication()'] loop
    r := to_regprocedure('public.' || f);
    if r is null or not exists(select 1 from pg_proc where oid=r and not prosecdef and 'search_path=public, pg_temp'=any(proconfig))
       or has_function_privilege('anon',r,'EXECUTE') or has_function_privilege('authenticated',r,'EXECUTE')
       or not has_function_privilege('service_role',r,'EXECUTE') then
      raise exception 'Missing or unsafe installed publication protection: %', f;
    end if;
  end loop;
  if (select count(*) from pg_trigger where tgrelid in (to_regclass('public.medresa_admin_publications'),to_regclass('public.medresa_admin_publication_metadata'),to_regclass('public.medresa_admin_localizations'),to_regclass('public.medresa_admin_slug_reservations')) and not tgisinternal and tgenabled='O') <> 8 then
    raise exception 'Publication integrity triggers are missing or unexpected';
  end if;
  if to_regclass('public.medresa_admin_locale_publications') is not null
     or to_regclass('public.medresa_admin_locale_heads') is not null
     or to_regclass('public.medresa_admin_public_locale_feed') is not null
     or to_regclass('public.medresa_admin_locale_publication_state') is not null
     or to_regprocedure('public.medresa_admin_publish_locales(text,bigint,text[],jsonb,text)') is not null then
    raise exception 'Locale publication objects already exist. Inspect; do not rerun or overwrite.';
  end if;
end $$;

lock table public.medresa_admin_articles, public.medresa_admin_publications,
  public.medresa_admin_publication_metadata, public.medresa_admin_revisions in share row exclusive mode;

create table public.medresa_admin_locale_publications (
  article_id text not null references public.medresa_admin_articles(id),
  locale text not null check(locale in ('bs','sq','en')),
  revision bigint not null check(revision>=0), snapshot jsonb not null,
  source_order integer, actor text not null, created_at timestamptz not null default now(),
  origin text not null check(origin in ('legacy','editor')),
  primary key(article_id,locale,revision),
  foreign key(article_id,revision) references public.medresa_admin_revisions(article_id,revision) deferrable initially deferred
);
create table public.medresa_admin_locale_heads (
  article_id text not null, locale text not null check(locale in ('bs','sq','en')), revision bigint not null,
  primary key(article_id,locale),
  foreign key(article_id,locale,revision) references public.medresa_admin_locale_publications(article_id,locale,revision)
);
alter table public.medresa_admin_locale_publications enable row level security;
alter table public.medresa_admin_locale_heads enable row level security;
revoke all on public.medresa_admin_locale_publications,public.medresa_admin_locale_heads from public,anon,authenticated,service_role;
grant select,insert on public.medresa_admin_locale_publications to service_role;
grant select,insert,update on public.medresa_admin_locale_heads to service_role;

-- Copy history into new tables only. No existing article/import/publication row changes.
insert into public.medresa_admin_locale_publications(article_id,locale,revision,snapshot,source_order,actor,created_at,origin)
select p.article_id,l.locale,p.revision,p.snapshot,m.source_order,p.actor,p.created_at,'legacy'
from public.medresa_admin_publications p
join public.medresa_admin_publication_metadata m on m.article_id=p.article_id and m.revision=p.revision
cross join (values ('bs'),('sq'),('en')) l(locale);
insert into public.medresa_admin_locale_heads(article_id,locale,revision)
select a.id,l.locale,a.published_revision from public.medresa_admin_articles a
cross join (values ('bs'),('sq'),('en')) l(locale) where a.published_revision is not null;

create function public.medresa_admin_capture_locale() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare s text;
begin
  if new.snapshot->>'id' is distinct from new.article_id
     or coalesce(new.snapshot->>'date','') !~ '^\d{4}-\d{2}-\d{2}$'
     or to_char((new.snapshot->>'date')::date,'YYYY-MM-DD') is distinct from new.snapshot->>'date' then
    raise exception 'Invalid localized snapshot identity/date';
  end if;
  s := new.snapshot->new.locale->>'slug';
  if coalesce(s,'') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or s ~ '^\d+$' then raise exception 'Invalid localized publication slug'; end if;
  if new.origin='legacy' and not exists(select 1 from medresa_admin_publications p join medresa_admin_publication_metadata m on m.article_id=p.article_id and m.revision=p.revision
    where p.article_id=new.article_id and p.revision=new.revision and p.snapshot=new.snapshot and m.source_order is not distinct from new.source_order) then
    raise exception 'Legacy publication provenance mismatch';
  end if;
  insert into medresa_admin_slug_reservations as reservation(locale,slug,article_id,published)
    values(new.locale,s,new.article_id,true)
  on conflict(locale,slug) do update set published=true where reservation.article_id=excluded.article_id;
  if not found then raise exception 'Published slug belongs to another article' using errcode='23505'; end if;
  return new;
end $$;

create function public.medresa_admin_protect_locale_head() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op='DELETE' then raise exception 'Published locale cannot be silently unpublished' using errcode='55000'; end if;
  if new.article_id is distinct from old.article_id or new.locale is distinct from old.locale or new.revision<=old.revision then
    raise exception 'Localized publication pointer cannot be reassigned or rewound' using errcode='55000';
  end if;
  return new;
end $$;

-- Maintain compatibility with the existing verified, insert-only 17-article import.
create function public.medresa_admin_sync_legacy_locales() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare l text; ordering integer;
begin
  select source_order into ordering from medresa_admin_publication_metadata where article_id=new.article_id and revision=new.revision;
  foreach l in array array['bs','sq','en'] loop
    insert into medresa_admin_locale_publications values(new.article_id,l,new.revision,new.snapshot,ordering,new.actor,new.created_at,'legacy');
    insert into medresa_admin_locale_heads as head values(new.article_id,l,new.revision)
      on conflict(article_id,locale) do update set revision=excluded.revision where head.revision<excluded.revision;
  end loop;
  return new;
end $$;

create trigger medresa_admin_capture_locale after insert on public.medresa_admin_locale_publications
  for each row execute function public.medresa_admin_capture_locale();
create trigger medresa_admin_locale_snapshot_immutable before update or delete on public.medresa_admin_locale_publications
  for each row execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_locale_snapshot_no_truncate before truncate on public.medresa_admin_locale_publications
  for each statement execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_locale_head_guard before update or delete on public.medresa_admin_locale_heads
  for each row execute function public.medresa_admin_protect_locale_head();
create trigger medresa_admin_locale_head_no_truncate before truncate on public.medresa_admin_locale_heads
  for each statement execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_sync_legacy_locales after insert on public.medresa_admin_publications
  for each row execute function public.medresa_admin_sync_legacy_locales();

create function public.medresa_admin_publish_locales(p_id text,p_expected bigint,p_locales text[],p_snapshots jsonb,p_actor text)
returns public.medresa_admin_articles language plpgsql set search_path = public, pg_temp as $$
declare r medresa_admin_articles; d jsonb; l text; other text; b jsonb; image jsonb; snap jsonb; next_rev bigint;
begin
  if p_expected is null or p_expected<0 then raise exception 'Invalid expected revision'; end if;
  if p_locales is null or cardinality(p_locales) not between 1 and 3
     or exists(select 1 from unnest(p_locales) x where x is null or x not in ('bs','sq','en'))
     or (select count(distinct x) from unnest(p_locales) x)<>cardinality(p_locales)
     or jsonb_typeof(p_snapshots) is distinct from 'object' then raise exception 'Invalid publication languages'; end if;
  if (select count(*) from jsonb_object_keys(p_snapshots))<>cardinality(p_locales)
     or exists(select 1 from jsonb_object_keys(p_snapshots) x where not(x=any(p_locales))) then raise exception 'Unexpected localized snapshots'; end if;
  select * into r from medresa_admin_articles where id=p_id for update;
  if not found then raise exception 'Missing article' using errcode='P0002'; end if;
  if r.revision<>p_expected or r.archived_at is not null or r.deleted_at is not null then raise exception 'Stale revision' using errcode='40001'; end if;
  d := r.document; next_rev := r.revision+1;
  if coalesce(r.publication_date,'') !~ '^\d{4}-\d{2}-\d{2}$'
     or to_char(r.publication_date::date,'YYYY-MM-DD')<>r.publication_date
     or coalesce(jsonb_array_length(d->'blocks'),0)=0 then raise exception 'Incomplete article'; end if;
  -- Stable locale order for multi-locale claims. One failed language rolls back all.
  foreach l in array array['bs','sq','en'] loop
    if not(l=any(p_locales)) then continue; end if;
    if btrim(coalesce(d->'title'->>l,''))=''
       or coalesce(d->'slug'->>l,'') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or d->'slug'->>l ~ '^\d+$'
       or not coalesce((d->'review'->l->>'approved')::boolean,false)
       or coalesce((d->'review'->l->>'reviewedRevision')::bigint,-1)<>r.revision
       or not exists(select 1 from jsonb_array_elements(d->'blocks') block where block->>'type'<>'image') then raise exception 'Missing selected language or human review'; end if;
    for b in select value from jsonb_array_elements(d->'blocks') loop
      if b->>'type'<>'image' and btrim(coalesce(b->'text'->>l,''))='' then raise exception 'Empty selected-language block'; end if;
      if b->>'type'='image' and not exists(select 1 from jsonb_array_elements(d->'images') img where img->>'id'=b->>'assetId' and btrim(coalesce(img->'alt'->>l,''))<>'') then raise exception 'Missing selected-language image description'; end if;
    end loop;
    if r.cover_asset_id is not null and not exists(select 1 from jsonb_array_elements(d->'images') img where img->>'id'=r.cover_asset_id and btrim(coalesce(img->'alt'->>l,''))<>'') then raise exception 'Invalid optional cover'; end if;
    snap := p_snapshots->l;
    if snap->>'id' is distinct from p_id or snap->>'date' is distinct from r.publication_date
       or snap->l->>'title' is distinct from d->'title'->>l or snap->l->>'slug' is distinct from d->'slug'->>l
       or btrim(coalesce(snap->l->>'body',''))='' or jsonb_typeof(snap->'photos') is distinct from 'array' then raise exception 'Selected snapshot mismatch'; end if;
    foreach other in array array['bs','sq','en'] loop
      if other<>l and snap->other is distinct from '{"title":"","slug":"","body":""}'::jsonb then raise exception 'Unselected draft must not be published'; end if;
    end loop;
    for image in select value from jsonb_array_elements(snap->'photos') loop
      if btrim(coalesce(image->'alt'->>l,''))='' then raise exception 'Missing selected snapshot image description'; end if;
    end loop;
    insert into medresa_admin_locale_publications values(p_id,l,next_rev,snap,r.source_order,p_actor,now(),'editor');
    insert into medresa_admin_locale_heads as head values(p_id,l,next_rev)
      on conflict(article_id,locale) do update set revision=excluded.revision where head.revision<excluded.revision;
  end loop;
  -- Carry approvals for unchanged content to the new shared editorial revision.
  foreach l in array array['bs','sq','en'] loop
    if coalesce((d->'review'->l->>'approved')::boolean,false) and (d->'review'->l->>'reviewedRevision')::bigint=r.revision then
      d := jsonb_set(d,array['review',l,'reviewedRevision'],to_jsonb(next_rev));
    end if;
  end loop;
  d := jsonb_set(jsonb_set(d,'{revision}',to_jsonb(next_rev)),'{status}','"published"');
  update medresa_admin_articles set document=d,revision=next_rev,status='published',published_at=coalesce(published_at,now()),updated_at=now()
    where id=p_id returning * into r;
  perform medresa_admin_project(d);
  insert into medresa_admin_revisions values(p_id,next_rev,d,p_actor,'publish:' || array_to_string(p_locales,','),now());
  return r;
end $$;

revoke execute on function public.medresa_admin_capture_locale(), public.medresa_admin_protect_locale_head(),
  public.medresa_admin_sync_legacy_locales(),public.medresa_admin_publish_locales(text,bigint,text[],jsonb,text) from public,anon,authenticated;
grant execute on function public.medresa_admin_capture_locale(), public.medresa_admin_protect_locale_head(),
  public.medresa_admin_sync_legacy_locales(),public.medresa_admin_publish_locales(text,bigint,text[],jsonb,text) to service_role;

-- Future public data boundary: select ONE locale; never merge photos/date from a different locale.
-- No public renderer or route is switched to this view by this migration.
create view public.medresa_admin_locale_publication_state with (security_invoker=true) as
select p.article_id,p.locale,p.revision,p.created_at as published_at,p.snapshot,
  p.snapshot->>'date' as publication_date,p.source_order
from public.medresa_admin_locale_heads h
join public.medresa_admin_locale_publications p on p.article_id=h.article_id and p.locale=h.locale and p.revision=h.revision;
create view public.medresa_admin_public_locale_feed with (security_invoker=true) as
select p.* from public.medresa_admin_locale_publication_state p join public.medresa_admin_articles a on a.id=p.article_id
where a.archived_at is null and a.deleted_at is null;
revoke all on public.medresa_admin_public_locale_feed,public.medresa_admin_locale_publication_state from public,anon,authenticated,service_role;
grant select on public.medresa_admin_public_locale_feed,public.medresa_admin_locale_publication_state to service_role;
commit;
