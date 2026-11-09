-- Serialize claims across workers, avoid duplicate in-flight phrases, reuse without quota.
create index translation_phrase_pending on hiken_private.event_translations(locale,source_hash) where translated_text is null;
create or replace function public.hiken_claim()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'UTC')::date;
  budget hiken_private.translation_budget%rowtype;
  job hiken_private.event_translations%rowtype;
  cached text;
begin
  perform pg_advisory_xact_lock(1918124);
  insert into hiken_private.translation_budget(day) values(today) on conflict do nothing;
  -- This lock makes quota reservations atomic across every worker and deployment.
  select * into budget from hiken_private.translation_budget where day=today for update;
  -- Reuse completed text before quota checks, including on an exhausted day.
  update hiken_private.event_translations t set translated_text=c.translated_text,lease=null,lease_until=null
    from (select distinct on(locale,source_hash) locale,source_hash,source_text,translated_text
      from hiken_private.event_translations where translated_text is not null
      order by locale,source_hash,event_key,field) c
    where t.translated_text is null and t.locale=c.locale and t.source_hash=c.source_hash
      and t.source_text=c.source_text and (t.lease_until is null or t.lease_until < now());
  if budget.exhausted then return null; end if;
  loop
    select t.* into job from hiken_private.event_translations t
      join hiken_private.events e using(event_key)
      where t.translated_text is null and t.retry_after <= now()
        and (t.lease_until is null or t.lease_until < now())
        and e.ends_on >= (now() at time zone 'Asia/Seoul')::date
        and not exists(select 1 from hiken_private.event_translations busy
          where busy.locale=t.locale and busy.source_hash=t.source_hash
            and busy.translated_text is null and busy.lease_until >= now())
        and length(t.source_text) <= 4500-budget.characters
      order by t.priority,(select count(*) from hiken_private.event_translations repeated where repeated.locale=t.locale and repeated.source_hash=t.source_hash and repeated.translated_text is null) desc,e.ends_on,t.event_key,t.field,t.locale
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

