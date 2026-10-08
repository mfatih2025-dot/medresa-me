-- FOLLOW-UP ONLY: medresa-me-preview (safsjirhxbefgcahvsvm).
-- Apply only after explicit approval in that project's SQL Editor, with application
-- writes still disabled. SQL operates on the selected database; it cannot verify
-- the Supabase dashboard/project identity. Do not rerun the original migration.
-- No existing article, asset, revision, publication or Storage row is overwritten.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Fail closed on a partial base installation, insecure grants, or an already
-- installed/partially installed correction. Never silently recreate an object.
do $$
declare t text; r oid; f text; expected text[]; actual text[];
begin
  for t, expected in select * from (values
    ('medresa_admin_assets', array['id:text','origin:text','bucket:text','object_path:text','mime:text','bytes:bigint','metadata:jsonb','original_path:text','created_at:timestamp with time zone','created_by:text']),
    ('medresa_admin_articles', array['id:text','document:jsonb','revision:bigint','status:text','publication_date:text','cover_asset_id:text','archived_at:timestamp with time zone','deleted_at:timestamp with time zone','created_at:timestamp with time zone','updated_at:timestamp with time zone','published_at:timestamp with time zone','published_revision:bigint','import_fingerprint:text','source_order:integer','legacy_article:jsonb']),
    ('medresa_admin_localizations', array['article_id:text','locale:text','title:text','slug:text','lead:text','reviewed:boolean','reviewed_revision:bigint']),
    ('medresa_admin_blocks', array['article_id:text','id:text','position:integer','kind:text','asset_id:text']),
    ('medresa_admin_block_text', array['article_id:text','block_id:text','locale:text','text:text']),
    ('medresa_admin_article_images', array['article_id:text','asset_id:text','position:integer','alt:jsonb']),
    ('medresa_admin_revisions', array['article_id:text','revision:bigint','document:jsonb','actor:text','action:text','created_at:timestamp with time zone']),
    ('medresa_admin_publications', array['article_id:text','revision:bigint','snapshot:jsonb','actor:text','created_at:timestamp with time zone'])
  ) v(name, columns) loop
    r := to_regclass('public.' || t);
    if r is null or not exists(select 1 from pg_class where oid=r and relkind='r' and relrowsecurity) then
      raise exception 'Missing base table or RLS: %. Review the installation; do not reset it.', t;
    end if;
    select array_agg(attname || ':' || format_type(atttypid,atttypmod) order by attnum) into actual
      from pg_attribute where attrelid=r and attnum>0 and not attisdropped;
    if actual is distinct from expected then raise exception 'Unexpected base table shape: %', t; end if;
    if has_table_privilege('anon',r,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_table_privilege('authenticated',r,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or exists(select 1 from pg_policy where polrelid=r)
       or exists(select 1 from pg_trigger where tgrelid=r and not tgisinternal) then
      raise exception 'Unexpected base security or triggers: %', t;
    end if;
  end loop;
  foreach f in array array['medresa_admin_project(jsonb)','medresa_admin_save(jsonb,bigint,text)',
    'medresa_admin_publish(text,bigint,jsonb,text)','medresa_admin_transition(text,bigint,text,text)','medresa_admin_import(jsonb,text)'] loop
    r := to_regprocedure('public.' || f);
    if r is null or not exists(select 1 from pg_proc where oid=r and not prosecdef and 'search_path=public, pg_temp'=any(proconfig))
       or has_function_privilege('anon',r,'EXECUTE') or has_function_privilege('authenticated',r,'EXECUTE')
       or not has_function_privilege('service_role',r,'EXECUTE') then
      raise exception 'Unexpected base RPC or security: %', f;
    end if;
  end loop;
  r := to_regclass('public.medresa_admin_public_feed');
  if r is null or not exists(select 1 from pg_class where oid=r and relkind='v' and 'security_invoker=true'=any(reloptions))
     or has_table_privilege('anon',r,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',r,'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Missing or unexpected public feed security';
  end if;
  select array_agg(attname || ':' || format_type(atttypid,atttypmod) order by attnum) into actual
    from pg_attribute where attrelid=r and attnum>0 and not attisdropped;
  if actual is distinct from array['id:text','publication_date:text','source_order:integer','snapshot:jsonb'] then
    raise exception 'Unexpected public feed contract';
  end if;
  if to_regclass('public.medresa_admin_slug_reservations') is not null
     or to_regclass('public.medresa_admin_publication_metadata') is not null
     or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
       and p.proname in ('medresa_admin_reserve_draft_slug','medresa_admin_capture_publication','medresa_admin_protect_slug_reservation','medresa_admin_protect_publication')) then
    raise exception 'Correction objects already exist. Inspect them; do not overwrite or rerun.';
  end if;
end $$;

-- Stable data for conflict checks/backfill. Abort on contention rather than
-- interrupting other sessions or allowing a partially applied migration.
lock table public.medresa_admin_articles, public.medresa_admin_localizations,
  public.medresa_admin_publications in share row exclusive mode;

do $$
begin
  if exists(select 1 from public.medresa_admin_publications p
    where p.snapshot->>'id' is distinct from p.article_id
      or coalesce(p.snapshot->>'date','') !~ '^\d{4}-\d{2}-\d{2}$') then
    raise exception 'Invalid existing publication identity/date. Nothing will be repaired automatically.';
  end if;
  if exists(select 1 from public.medresa_admin_publications p
    where to_char((p.snapshot->>'date')::date,'YYYY-MM-DD') <> p.snapshot->>'date') then
    raise exception 'Invalid existing publication date';
  end if;
  if exists(select 1 from public.medresa_admin_publications p cross join (values ('bs'),('sq'),('en')) l(locale)
    where coalesce(p.snapshot->l.locale->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or p.snapshot->l.locale->>'slug' ~ '^\d+$') then
    raise exception 'Invalid existing localized publication slug';
  end if;
  if exists(
    select 1 from (
      select locale,slug,article_id from public.medresa_admin_localizations where slug<>''
      union all
      select l.locale,p.snapshot->l.locale->>'slug',p.article_id
        from public.medresa_admin_publications p cross join (values ('bs'),('sq'),('en')) l(locale)
    ) ownership group by locale,slug having count(distinct article_id)>1
  ) then
    raise exception 'Conflicting current/historical slug owners. Nothing will be overwritten.' using errcode='23505';
  end if;
end $$;

-- One atomic ownership registry for current drafts AND every published slug.
-- Draft-only reservations can be released; published reservations are permanent.
-- The unique key arbitrates concurrent claims without a SELECT-then-write race.
create table public.medresa_admin_slug_reservations (
  locale text not null check (locale in ('bs','sq','en')),
  slug text not null check (slug<>''),
  article_id text not null references public.medresa_admin_articles(id),
  published boolean not null default false,
  primary key(locale,slug)
);
-- Freeze source ordering at publication; never read it from an editable article.
-- Separate metadata avoids changing existing composite types/positional RPC inserts.
create table public.medresa_admin_publication_metadata (
  article_id text not null,
  revision bigint not null,
  source_order integer,
  primary key(article_id,revision),
  foreign key(article_id,revision) references public.medresa_admin_publications(article_id,revision)
);
alter table public.medresa_admin_slug_reservations enable row level security;
alter table public.medresa_admin_publication_metadata enable row level security;
-- Supabase default privileges may be broader than explicit migration grants.
revoke all on public.medresa_admin_slug_reservations, public.medresa_admin_publication_metadata from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.medresa_admin_slug_reservations to service_role;
grant select,insert on public.medresa_admin_publication_metadata to service_role;

insert into public.medresa_admin_slug_reservations(locale,slug,article_id,published)
select locale,slug,article_id,bool_or(published) from (
  select locale,slug,article_id,false as published from public.medresa_admin_localizations where slug<>''
  union all
  select l.locale,p.snapshot->l.locale->>'slug',p.article_id,true
    from public.medresa_admin_publications p cross join (values ('bs'),('sq'),('en')) l(locale)
) ownership group by locale,slug,article_id;
insert into public.medresa_admin_publication_metadata(article_id,revision,source_order)
select p.article_id,p.revision,a.source_order from public.medresa_admin_publications p
  join public.medresa_admin_articles a on a.id=p.article_id;

create function public.medresa_admin_protect_slug_reservation() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op='DELETE' then
    if old.published then raise exception 'Published slug ownership is immutable' using errcode='55000'; end if;
    return old;
  end if;
  if new.locale is distinct from old.locale or new.slug is distinct from old.slug
     or new.article_id is distinct from old.article_id or (old.published and not new.published) then
    raise exception 'Slug ownership cannot be reassigned' using errcode='55000';
  end if;
  return new;
end $$;

create function public.medresa_admin_reserve_draft_slug() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op<>'DELETE' and new.slug<>'' then
    insert into medresa_admin_slug_reservations as reservation(locale,slug,article_id,published)
      values(new.locale,new.slug,new.article_id,false)
    on conflict(locale,slug) do update set published=reservation.published
      where reservation.article_id=excluded.article_id;
    if not found then raise exception 'Localized slug belongs to another article' using errcode='23505'; end if;
  end if;
  if tg_op='DELETE' then
    delete from medresa_admin_slug_reservations where locale=old.locale and slug=old.slug and article_id=old.article_id and not published;
    return old;
  elsif tg_op='UPDATE' and (new.slug is distinct from old.slug or new.locale is distinct from old.locale or new.article_id is distinct from old.article_id) then
    delete from medresa_admin_slug_reservations where locale=old.locale and slug=old.slug and article_id=old.article_id and not published;
  end if;
  return new;
end $$;

create function public.medresa_admin_capture_publication() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare l text; s text; published_order integer;
begin
  if new.snapshot->>'id' is distinct from new.article_id
     or coalesce(new.snapshot->>'date','') !~ '^\d{4}-\d{2}-\d{2}$'
     or to_char((new.snapshot->>'date')::date,'YYYY-MM-DD') is distinct from new.snapshot->>'date' then
    raise exception 'Invalid publication snapshot identity/date';
  end if;
  foreach l in array array['bs','sq','en'] loop
    s := new.snapshot->l->>'slug';
    if coalesce(s,'') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or s ~ '^\d+$' then raise exception 'Invalid localized publication slug'; end if;
    insert into medresa_admin_slug_reservations as reservation(locale,slug,article_id,published)
      values(l,s,new.article_id,true)
    on conflict(locale,slug) do update set published=true
      where reservation.article_id=excluded.article_id;
    if not found then raise exception 'Published slug belongs to another article' using errcode='23505'; end if;
  end loop;
  select source_order into published_order from medresa_admin_articles where id=new.article_id for share;
  insert into medresa_admin_publication_metadata values(new.article_id,new.revision,published_order);
  return new;
end $$;

create function public.medresa_admin_protect_publication() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'Published snapshots, ordering metadata and published slug ownership must be retained' using errcode='55000';
end $$;

create trigger medresa_admin_draft_slug_guard before insert or update or delete on public.medresa_admin_localizations
  for each row execute function public.medresa_admin_reserve_draft_slug();
create trigger medresa_admin_capture_publication after insert on public.medresa_admin_publications
  for each row execute function public.medresa_admin_capture_publication();
create trigger medresa_admin_publication_immutable before update or delete on public.medresa_admin_publications
  for each row execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_publication_no_truncate before truncate on public.medresa_admin_publications
  for each statement execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_publication_metadata_immutable before update or delete on public.medresa_admin_publication_metadata
  for each row execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_publication_metadata_no_truncate before truncate on public.medresa_admin_publication_metadata
  for each statement execute function public.medresa_admin_protect_publication();
create trigger medresa_admin_published_slug_immutable before update or delete on public.medresa_admin_slug_reservations
  for each row execute function public.medresa_admin_protect_slug_reservation();
create trigger medresa_admin_slug_reservations_no_truncate before truncate on public.medresa_admin_slug_reservations
  for each statement execute function public.medresa_admin_protect_publication();

revoke execute on function public.medresa_admin_reserve_draft_slug(), public.medresa_admin_capture_publication(),
  public.medresa_admin_protect_slug_reservation(), public.medresa_admin_protect_publication() from public,anon,authenticated;
grant execute on function public.medresa_admin_reserve_draft_slug(), public.medresa_admin_capture_publication(),
  public.medresa_admin_protect_slug_reservation(), public.medresa_admin_protect_publication() to service_role;

-- Preserve the existing four-column view contract, grants and invoker security.
-- Current archive/trash flags control visibility; all presentation/order data
-- comes from the active immutable publication. Public routes still use static data.
create or replace view public.medresa_admin_public_feed with (security_invoker=true) as
select p.article_id as id,p.snapshot->>'date' as publication_date,m.source_order,p.snapshot
from public.medresa_admin_articles a
join public.medresa_admin_publications p on p.article_id=a.id and p.revision=a.published_revision
join public.medresa_admin_publication_metadata m on m.article_id=p.article_id and m.revision=p.revision
where a.archived_at is null and a.deleted_at is null;
commit;
