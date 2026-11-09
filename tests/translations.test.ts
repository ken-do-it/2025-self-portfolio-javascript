import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { filterEvents, normalizeRows, seoulToday } from '../src/events.ts';
import type { Filters } from '../src/events.ts';
import { displayEvent, readTranslations, translationComplete } from '../src/translations.ts';
import { matchTranslations, sourceHash, syncArguments } from '../server/localizations.ts';
import { SOURCE } from '../server/events.ts';
import { translateText } from '../server/translate.ts';
import { runTranslationWorker } from '../server/translation-worker.ts';
import { authorized } from '../api/syncTranslations.ts';
import { ApiError } from '../server/http.ts';
import { mapLinks } from '../src/maps.ts';

const today = seoulToday();
const event = normalizeRows([{ TITLE: '서울 공예 전시', STRTDATE: today, END_DATE: '2030-01-01', PLACE: '서울 박물관', PROGRAM: '전시 설명' }])[0]!;
const payload = { events: [event], updatedAt: new Date().toISOString(), partial: false, stale: false, source: SOURCE };
const filters: Filters = { query: '', category: 'all', district: '', date: '', ongoing: false, free: false, saved: false };

test('selected-language search includes translated title, venue and description without changing source maps', () => {
  const originals = JSON.stringify(event), maps = mapLinks(event);
  for (const [title, query] of [['Seoul Craft Exhibition', 'craft'], ['ソウル工芸展', '工芸'], ['Exposición de artesanía', 'exposicion']] as const) {
    const translated = new Map([[event.id, { title, place: 'Museum', description: 'Special programme' }]]);
    assert.equal(filterEvents([event], { ...filters, query }, new Set(), today, translated).length, 1);
    assert.equal(filterEvents([event], { ...filters, query: 'programme' }, new Set(), today, translated).length, 1);
    assert.equal(filterEvents([event], { ...filters, query: '서울' }, new Set(), today, translated).length, 1);
    assert.equal(displayEvent(event, translated.get(event.id)).title, title);
  }
  assert.equal(JSON.stringify(event), originals); assert.deepEqual(mapLinks(event), maps);
  assert.equal(filterEvents([{ ...event, title: 'バス' }], { ...filters, query: 'ハス' }, new Set()).length, 0);
});
test('stale translations are rejected per field and partial translations retain the Korean source', () => {
  const rows = [{ id: event.id, field: 'title', source_hash: sourceHash(event.title, 'en'), text: 'Craft exhibition' },
    { id: event.id, field: 'description', source_hash: sourceHash('old description', 'en'), text: 'Stale' }];
  const matched = matchTranslations([event], 'en', rows);
  assert.deepEqual(matched, [{ id: event.id, fields: { title: 'Craft exhibition' } }]);
  assert.deepEqual(matchTranslations([event], 'ja', rows), []);
  const fields = readTranslations(matched).get(event.id);
  assert.equal(displayEvent(event, fields).description, event.description);
  assert.equal(translationComplete(event, fields), false);
  assert.equal(readTranslations([{ id: event.id, fields: { url: 'https://attacker.test' } }]).size, 0);
});
test('provider quota errors are never stored as translated text and no-Hangul fields skip the provider', async () => {
  assert.equal(await translateText('12:00 / 2026', 'en', async () => { throw new Error('Must not fetch'); }), '12:00 / 2026');
  for (const response of [new Response('', { status: 429 }), Response.json({ responseStatus: 200, quotaFinished: true, responseData: { translatedText: 'QUOTA ERROR' } })]) {
    await assert.rejects(translateText('서울', 'en', async () => response), { code: 'TRANSLATION_LIMIT' });
  }
});
test('cron authentication fails closed and worker stops on the shared provider quota', async () => {
  const secret = 's'.repeat(48);
  assert.equal(authorized(`Bearer ${secret}`, secret), true);
  assert.equal(authorized('Bearer wrong', secret), false);
  assert.equal(authorized('Bearer undefined', undefined), false);
  let claims = 0, exhausted = false;
  const result = await runTranslationWorker({ getEvents: async () => payload, now: () => 0,
    translate: async () => { throw new ApiError(429, 'TRANSLATION_LIMIT'); },
    rpc: async (name, args) => {
      if (name === 'hiken_claim') { claims++; return { event_key: 'key', locale: 'en', field: 'title', source_text: event.title, source_hash: 'hash', lease: 'lease', day: today }; }
      if (name === 'hiken_finish') { exhausted = args?.p_exhausted === true; assert.equal(args?.p_text, null); }
      return true;
    }
  });
  assert.ok(claims >= 1 && claims <= 3); assert.equal(exhausted, true); assert.equal(result.limited, true);
});

test('worker translates at most three independent jobs concurrently and drains every reservation', async () => {
  let claims = 0, active = 0, peak = 0, finished = 0;
  const result = await runTranslationWorker({ getEvents: async () => payload, now: () => 0,
    translate: async () => {
      active++; peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--; return 'Translated';
    },
    rpc: async name => {
      if (name === 'hiken_claim') return claims++ < 7
        ? { event_key: String(claims), locale: 'en', field: 'title', source_text: event.title, source_hash: String(claims), lease: String(claims), day: today } : null;
      if (name === 'hiken_finish') finished++;
      return true;
    }
  });
  assert.equal(peak, 3); assert.equal(active, 0); assert.equal(finished, 7);
  assert.equal(result.completed, 7); assert.equal(result.failed, 0);
});

test('PostgreSQL migration enforces permissions, title priority, leases, content invalidation and global quota', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(await readFile(new URL('../supabase/migrations/20261109124414_event_translations.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261109130641_parallel_translation_reuse.sql', import.meta.url), 'utf8'));
    await db.exec('set role anon');
    await assert.rejects(db.query('select public.hiken_claim()'), /permission denied/);
    await assert.rejects(db.query('select * from hiken_private.events'), /permission denied/);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query("select public.hiken_read('en')"), /permission denied/);
    await db.exec('reset role; set role service_role');
    const sync = async (p = payload) => {
      const a = syncArguments(p);
      return db.query('select public.hiken_sync($1::jsonb,$2::jsonb,$3::timestamptz,$4)', [JSON.stringify(a.p_events), JSON.stringify(a.p_jobs), a.p_updated, a.p_partial]);
    };
    const claim = async () => (await db.query<{ job: Record<string, string> | null }>('select public.hiken_claim() as job')).rows[0]!.job;
    const finish = async (job: Record<string, string>, text: string, lease = job.lease) => (await db.query<{ ok: boolean }>(
      'select public.hiken_finish($1,$2,$3,$4,$5::uuid,$6::date,$7,false) as ok', [job.event_key,job.locale,job.field,job.source_hash,lease,job.day,text])).rows[0]!.ok;
    await sync();
    const job = (await claim())!; assert.equal(job.field, 'title'); assert.equal(job.locale, 'en');
    await db.query("update hiken_private.event_translations t set source_hash=s.source_hash,source_text=s.source_text,priority=s.priority,translated_text=null from hiken_private.event_translations s where t.event_key=s.event_key and t.locale=s.locale and t.locale='en' and t.field='time' and s.field='title'");
    const next = (await claim())!; assert.equal(next.field, 'title'); assert.notEqual(next.lease, job.lease); assert.notEqual(next.locale, job.locale);
    assert.equal(await finish(job, 'Craft exhibition', '00000000-0000-4000-8000-000000000000'), false);
    assert.equal(await finish(job, 'Craft exhibition'), true);
    const changed = { ...payload, updatedAt: new Date(Date.parse(payload.updatedAt) + 1000).toISOString(), events: [{ ...event, description: '변경된 설명' }] };
    await sync(changed);
    const ready = (await db.query<{ data: unknown }>("select public.hiken_read('en') as data")).rows[0]!.data;
    assert.equal(matchTranslations(changed.events, 'en', ready)[0]?.fields.title, 'Craft exhibition');
    await sync(); // Older snapshot cannot overwrite the new source.
    const snapshot = (await db.query<{ data: typeof payload }>('select public.hiken_snapshot() as data')).rows[0]!.data;
    assert.equal(snapshot.events[0]?.description, '변경된 설명');
    await db.query("update hiken_private.event_translations t set source_hash=s.source_hash,source_text=s.source_text,priority=s.priority,translated_text=null from hiken_private.event_translations s where t.event_key=s.event_key and t.locale=s.locale and t.locale='en' and t.field='time' and s.field='title'");
    await db.query('update hiken_private.translation_budget set characters=4500');
    assert.equal(await claim(), null);
    const reused = await db.query<{ translated_text: string }>("select translated_text from hiken_private.event_translations where locale='en' and field='time'");
    assert.equal(reused.rows[0]?.translated_text, 'Craft exhibition');
    await assert.rejects(db.query('update hiken_private.translation_budget set characters=4501'), /check constraint/);
    await db.exec('reset role');
    const permissions = await db.query<{ unsafe: number }>("select count(*)::integer as unsafe from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'hiken_%' and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute') or p.prosecdef)");
    assert.equal(permissions.rows[0]?.unsafe, 0);
  } finally { await db.close(); }
});
