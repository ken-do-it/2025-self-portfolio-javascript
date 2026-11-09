-- Public event data only. All access goes through the Hiken server, never browsers.
create schema hiken_private;
revoke all on schema hiken_private from public, anon, authenticated;
grant usage on schema hiken_private to service_role;

create table hiken_private.events (
  event_key text primary key check (event_key ~ '^[a-f0-9]{64}$'),
  payload jsonb not null,
  ends_on date not null,
  synced_at timestamptz not null
);
create table hiken_private.event_translations (
  event_key text not null references hiken_private.events(event_key) on delete cascade,
  locale text not null check (locale in ('en','ja','es')),
  field text not null check (field in ('title','place','description','fee','audience','time')),
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  source_text text not null check (length(source_text) <= 4000),
  translated_text text check (length(translated_text) <= 16000),
  priority integer not null check (priority in (0,1)),
  lease uuid,
  lease_until timestamptz,
  retry_after timestamptz not null default '-infinity',
  primary key (event_key,locale,field)
);
create index translation_pending on hiken_private.event_translations(priority, retry_after) where translated_text is null;
create index translation_reuse on hiken_private.event_translations(locale,source_hash) where translated_text is not null;
create index events_end on hiken_private.events(ends_on);
create table hiken_private.translation_budget (
  day date primary key,
  characters integer not null default 0 check (characters between 0 and 4500),
  exhausted boolean not null default false
);
create table hiken_private.sync_state (
  singleton boolean primary key default true check (singleton),
  updated_at timestamptz not null,
  partial boolean not null
);
alter table hiken_private.events enable row level security;
alter table hiken_private.event_translations enable row level security;
alter table hiken_private.translation_budget enable row level security;
alter table hiken_private.sync_state enable row level security;
revoke all on all tables in schema hiken_private from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema hiken_private to service_role;

create function public.hiken_sync(p_events jsonb, p_jobs jsonb, p_updated timestamptz, p_partial boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(1918123);
  if p_updated > now() + interval '1 minute' or p_updated < now() - interval '7 days' then
    raise exception 'Invalid snapshot age';
  end if;
  if exists(select 1 from hiken_private.sync_state where updated_at >= p_updated) then return false; end if;
  if jsonb_array_length(p_events) not between 1 and 30000 or jsonb_array_length(p_jobs) > 180000 then
    raise exception 'Invalid snapshot size';
  end if;
  insert into hiken_private.events(event_key,payload,ends_on,synced_at)
    select x.event_key,x.payload,(x.payload->>'end')::date,p_updated
    from jsonb_to_recordset(p_events) x(event_key text,payload jsonb)
    on conflict(event_key) do update set payload=excluded.payload, ends_on=excluded.ends_on,synced_at=excluded.synced_at;
  insert into hiken_private.event_translations(event_key,locale,field,source_hash,source_text,translated_text,priority)
    select x.event_key,x.locale,x.field,x.source_hash,x.source_text,x.translated_text,x.priority
    from jsonb_to_recordset(p_jobs) x(event_key text,locale text,field text,source_hash text,source_text text,translated_text text,priority integer)
    on conflict(event_key,locale,field) do update set source_hash=excluded.source_hash,source_text=excluded.source_text,
      translated_text=excluded.translated_text,lease=null,lease_until=null,retry_after='-infinity'
      where hiken_private.event_translations.source_hash is distinct from excluded.source_hash;
  -- Removing a source event cascades its translations. Keep only this verified snapshot.
  delete from hiken_private.events where synced_at < p_updated or ends_on < (now() at time zone 'Asia/Seoul')::date - 30;
  delete from hiken_private.translation_budget where day < (now() at time zone 'UTC')::date - 30;
  insert into hiken_private.sync_state values(true,p_updated,p_partial)
    on conflict(singleton) do update set updated_at=excluded.updated_at,partial=excluded.partial;
  return true;
end $$;

create function public.hiken_read(p_locale text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',e.payload->>'id','field',t.field,'source_hash',t.source_hash,'text',t.translated_text)), '[]'::jsonb)
    from hiken_private.event_translations t join hiken_private.events e using(event_key)
    where t.locale=p_locale and t.translated_text is not null;
$$;
create function public.hiken_snapshot()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('events',(select jsonb_agg(payload order by event_key) from hiken_private.events),
    'updatedAt',updated_at,'partial',partial,'stale',false,
    'source','https://data.seoul.go.kr/dataList/OA-23041/S/1/datasetView.do') from hiken_private.sync_state;
$$;

create function public.hiken_claim()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'UTC')::date;
  budget hiken_private.translation_budget%rowtype;
  job hiken_private.event_translations%rowtype;
  cached text;
begin
  insert into hiken_private.translation_budget(day) values(today) on conflict do nothing;
  -- This lock makes quota reservations atomic across every worker and deployment.
  select * into budget from hiken_private.translation_budget where day=today for update;
  if budget.exhausted then return null; end if;
  loop
    select t.* into job from hiken_private.event_translations t
      join hiken_private.events e using(event_key)
      where t.translated_text is null and t.retry_after <= now()
        and (t.lease_until is null or t.lease_until < now())
        and e.ends_on >= (now() at time zone 'Asia/Seoul')::date
        and length(t.source_text) <= 4500-budget.characters
      order by t.priority,e.ends_on,t.event_key,t.field,t.locale
      limit 1 for update of t skip locked;
    if not found then return null; end if;
    select translated_text into cached from hiken_private.event_translations
      where locale=job.locale and source_hash=job.source_hash and translated_text is not null limit 1;
    if cached is not null then
      update hiken_private.event_translations set translated_text=cached,lease=null,lease_until=null
        where event_key=job.event_key and locale=job.locale and field=job.field;
      continue;
    end if;
    job.lease := gen_random_uuid();
    update hiken_private.event_translations set lease=job.lease,lease_until=now()+interval '10 minutes'
      where event_key=job.event_key and locale=job.locale and field=job.field;
    update hiken_private.translation_budget set characters=characters+length(job.source_text) where day=today;
    return jsonb_build_object('event_key',job.event_key,'locale',job.locale,'field',job.field,
      'source_hash',job.source_hash,'source_text',job.source_text,'lease',job.lease,'day',today);
  end loop;
end $$;

create function public.hiken_finish(p_event_key text,p_locale text,p_field text,p_source_hash text,p_lease uuid,p_day date,p_text text,p_exhausted boolean)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  if p_text is not null and (length(p_text)=0 or length(p_text)>16000) then raise exception 'Invalid translation'; end if;
  if p_exhausted then update hiken_private.translation_budget set exhausted=true where day=p_day; end if;
  update hiken_private.event_translations set translated_text=p_text,lease=null,lease_until=null,
    retry_after=case when p_text is null then now()+interval '1 day' else '-infinity'::timestamptz end
    where event_key=p_event_key and locale=p_locale and field=p_field and source_hash=p_source_hash and lease=p_lease;
  get diagnostics changed=row_count;
  return changed=1;
end $$;

revoke all on function public.hiken_sync(jsonb,jsonb,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.hiken_read(text) from public,anon,authenticated;
revoke all on function public.hiken_snapshot() from public,anon,authenticated;
revoke all on function public.hiken_claim() from public,anon,authenticated;
revoke all on function public.hiken_finish(text,text,text,text,uuid,date,text,boolean) from public,anon,authenticated;
grant execute on function public.hiken_sync(jsonb,jsonb,timestamptz,boolean) to service_role;
grant execute on function public.hiken_read(text) to service_role;
grant execute on function public.hiken_snapshot() to service_role;
grant execute on function public.hiken_claim() to service_role;
grant execute on function public.hiken_finish(text,text,text,text,uuid,date,text,boolean) to service_role;
