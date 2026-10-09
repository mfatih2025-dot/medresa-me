-- PREVIEW ONLY: run once in medresa-me-preview (safsijrhxbefgcahvsvm).
-- Requires 202610080004_analytics_history.sql. Never rerun that migration.
-- Optional single-provider sync; no existing aggregates, News or Storage are changed.
begin;
do $$
begin
  if to_regprocedure('public.medresa_analytics_begin_sync(uuid,text)') is null
     or to_regprocedure('public.medresa_analytics_complete_sync(uuid,jsonb)') is null then
    raise exception 'Expected Preview analytics migration missing';
  end if;
end $$;

-- NULL preserves the existing full refresh. Bind scope before any provider call.
alter table public.medresa_analytics_sync_runs add column provider text
  check(provider in ('website','instagram','facebook','youtube'));

create function public.medresa_analytics_begin_sync(p_id uuid,p_period text,p_provider text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare l medresa_analytics_sync_lock; existing medresa_analytics_sync_runs;
begin
  if p_id is null or p_period is null or p_period not in ('today','yesterday','7','30','60','90') then raise exception 'Invalid analytics request'; end if;
  if p_provider is not null and p_provider not in ('website','instagram','facebook','youtube') then raise exception 'Invalid analytics provider'; end if;
  select * into l from medresa_analytics_sync_lock where singleton for update;
  select * into existing from medresa_analytics_sync_runs where id=p_id;
  if found then
    if existing.period<>p_period or existing.provider is distinct from p_provider then raise exception 'Idempotency request mismatch'; end if;
    return jsonb_build_object('acquired',false,'runId',existing.id,'outcome',existing.outcome);
  end if;
  if l.lease_until>now() then return jsonb_build_object('acquired',false,'runId',l.run_id,'outcome','running'); end if;
  if l.last_started_at>now()-interval '2 minutes' then return jsonb_build_object('acquired',false,'runId',l.run_id,'outcome','cooldown'); end if;
  update medresa_analytics_sync_runs set outcome='abandoned',completed_at=now() where id=l.run_id and outcome='running';
  insert into medresa_analytics_sync_runs(id,period,provider) values(p_id,p_period,p_provider);
  update medresa_analytics_sync_lock set run_id=p_id,lease_until=now()+interval '8 minutes',last_started_at=now() where singleton;
  return jsonb_build_object('acquired',true,'runId',p_id,'outcome','running');
end $$;

-- Keep the existing two-argument RPC and callers fully compatible.
create or replace function public.medresa_analytics_begin_sync(p_id uuid,p_period text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  return public.medresa_analytics_begin_sync(p_id,p_period,null::text);
end $$;

create or replace function public.medresa_analytics_complete_sync(p_id uuid,p_reports jsonb) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare l medresa_analytics_sync_lock; r jsonb; d jsonb; key text; ok integer:=0; available integer:=0; finished text; selected_provider text; expected_count integer;
begin
  select * into l from medresa_analytics_sync_lock where singleton for update;
  select outcome,provider into finished,selected_provider from medresa_analytics_sync_runs where id=p_id;
  if finished in ('success','partial','failed') then return; end if;
  if l.run_id is distinct from p_id or l.lease_until<=now() or finished is distinct from 'running' then raise exception 'Analytics lease lost' using errcode='40001'; end if;
  expected_count:=case when selected_provider is null then 4 else 1 end;
  if jsonb_typeof(p_reports) is distinct from 'array' or jsonb_array_length(p_reports)<>expected_count or octet_length(p_reports::text)>1000000 then raise exception 'Invalid analytics reports'; end if;
  if (select count(distinct x->>'provider') from jsonb_array_elements(p_reports) x)<>expected_count then raise exception 'Duplicate analytics provider'; end if;
  if selected_provider is not null and (p_reports->0->>'provider') is distinct from selected_provider then raise exception 'Analytics provider does not match claimed run'; end if;
  -- Validate every result before making changes. Unknown payload keys are rejected.
  for r in select value from jsonb_array_elements(p_reports) loop
    if r->>'provider' not in ('website','instagram','facebook','youtube')
       or r->>'state' not in ('connected','not_configured','permission_required','temporarily_unavailable','error')
       or r->>'timezone' not in ('UTC','America/Los_Angeles')
       or not coalesce(medresa_analytics_valid_metrics(r->'totals'),false)
       or not coalesce(medresa_analytics_valid_metrics(r->'previousTotals'),false)
       or not coalesce(medresa_analytics_valid_metrics(r->'current'),false)
       or not coalesce(medresa_analytics_valid_metrics(r->'cumulative'),false)
       or jsonb_typeof(r->'daily') is distinct from 'array' or jsonb_array_length(r->'daily')>200 then raise exception 'Invalid aggregate report'; end if;
    for key in select jsonb_object_keys(r) loop
      if key not in ('provider','state','reason','source','timezone','range','previousRange','todayDate','totals','previousTotals','current','daily','today','yesterday','breakdowns','topContent','warnings','requiredPermissions','fetchedAt','lastSuccessAt','lastAttemptAt','trackingStart','historicalBaseline','cumulative') then raise exception 'Unexpected report field'; end if;
    end loop;
    for d in select value from jsonb_array_elements(r->'daily') loop
      if not coalesce(medresa_analytics_valid_metrics(d->'metrics'),false)
         or jsonb_typeof(d->'complete') is distinct from 'boolean'
         or coalesce(d->>'date','')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid daily aggregate'; end if;
      if (d->>'date')::date>current_date+1 then raise exception 'Future aggregate'; end if;
    end loop;
  end loop;
  for r in select value from jsonb_array_elements(p_reports) loop
    insert into medresa_analytics_provider_state(provider,state,reason,last_attempt_at,last_success_at)
      values(r->>'provider',r->>'state',r->>'reason',now(),(r->>'lastSuccessAt')::timestamptz)
      on conflict(provider) do update set state=excluded.state,reason=excluded.reason,last_attempt_at=now(),
      last_success_at=coalesce(excluded.last_success_at,medresa_analytics_provider_state.last_success_at);
    if r->>'state'='connected' then ok:=ok+1; end if;
    -- Failed fetches never erase earlier reports or snapshots.
    if r->>'fetchedAt' is null then continue; end if;
    available:=available+1;
    insert into medresa_analytics_reports(provider,start_date,end_date,timezone,report,fetched_at)
      values(r->>'provider',(r->'range'->>'start')::date,(r->'range'->>'end')::date,r->>'timezone',r,(r->>'fetchedAt')::timestamptz)
      on conflict(provider,start_date,end_date,timezone) do update set
        report=excluded.report || jsonb_build_object(
          'totals',coalesce(medresa_analytics_reports.report->'totals','{}'::jsonb) || jsonb_strip_nulls(excluded.report->'totals'),
          'previousTotals',coalesce(medresa_analytics_reports.report->'previousTotals','{}'::jsonb) || jsonb_strip_nulls(excluded.report->'previousTotals'),
          'current',coalesce(medresa_analytics_reports.report->'current','{}'::jsonb) || jsonb_strip_nulls(excluded.report->'current'),
          'cumulative',coalesce(medresa_analytics_reports.report->'cumulative','{}'::jsonb) || jsonb_strip_nulls(excluded.report->'cumulative')),
        fetched_at=excluded.fetched_at;
    for d in select value from jsonb_array_elements(r->'daily') loop
      if d->'metrics'='{}'::jsonb then continue; end if;
      insert into medresa_analytics_daily(provider,day,timezone,metrics,complete,fetched_at)
        values(r->>'provider',(d->>'date')::date,r->>'timezone',d->'metrics',(d->>'complete')::boolean,(r->>'fetchedAt')::timestamptz)
        on conflict(provider,day,timezone) do update set
          metrics=(case when excluded.complete and not medresa_analytics_daily.complete then '{}'::jsonb
                   else medresa_analytics_daily.metrics end) || jsonb_strip_nulls(excluded.metrics),
          complete=medresa_analytics_daily.complete or excluded.complete,fetched_at=excluded.fetched_at;
    end loop;
  end loop;
  update medresa_analytics_sync_runs set outcome=case when ok=expected_count then 'success' when available>0 then 'partial' else 'failed' end,completed_at=now() where id=p_id;
  update medresa_analytics_sync_lock set lease_until=null where singleton;
end $$;
revoke execute on function public.medresa_analytics_begin_sync(uuid,text),public.medresa_analytics_begin_sync(uuid,text,text),public.medresa_analytics_complete_sync(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.medresa_analytics_begin_sync(uuid,text),public.medresa_analytics_begin_sync(uuid,text,text),public.medresa_analytics_complete_sync(uuid,jsonb) to service_role;
commit;
