import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventService, SOURCE } from '../server/events.ts';
import type { Payload } from '../server/events.ts';
import handler from '../api/getEvents.ts';
import translateHandler from '../api/translate.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
const now = Date.parse('2026-11-03T03:00:00Z');
const row = { title: '실제 형식 행사', strtdate: Date.parse('2026-11-02T15:00:00Z'), end_date: Date.parse('2026-11-10T15:00:00Z'), place: '미술관' };
test('HTTPS official export needs no secret and concurrent requests share one download', async () => {
  let calls = 0, disk: unknown;
  const get = createEventService({ now: () => now, read: async () => undefined, write: async p => { disk = p; }, fetch: async (url, opts) => {
    calls++; assert.equal(String(url), 'https://datafile.seoul.go.kr/bigfile/iot/sheet/json/download.do');
    assert.equal(opts?.redirect, 'error'); assert.equal(opts?.method, 'POST'); assert.ok(opts?.signal);
    assert.ok(!String(opts?.body).includes('API_KEY')); assert.ok(String(opts?.body).includes('infId=OA-23041'));
    return Response.json({ DATA: [row] });
  } });
  const [a, b] = await Promise.all([get(), get()]); assert.equal(calls, 1); assert.equal(a, b);
  assert.equal(a.events[0]?.start, '2026-11-03'); assert.equal(a.stale, false); assert.ok(disk);
  await get(); assert.equal(calls, 1);
});
test('fresh disk snapshot survives process restart without upstream call', async () => {
  let persisted: Payload | undefined;
  const first = createEventService({ now: () => now, read: async () => undefined, write: async p => { persisted = p; }, fetch: async () => Response.json({ DATA: [row] }) });
  await first();
  const second = createEventService({ now: () => now + 1000, read: async () => persisted, write: async () => {}, fetch: async () => { throw new Error('must not call'); } });
  assert.equal((await second()).events[0]?.title, row.title);
});
test('outage uses a bounded stale snapshot, throttles retry, and preserves timestamps', async () => {
  let persisted: Payload | undefined, clock = now, calls = 0;
  const first = createEventService({ now: () => clock, read: async () => undefined, write: async p => { persisted = p; }, fetch: async () => Response.json({ DATA: [row] }) }); await first();
  const get = createEventService({ now: () => clock, read: async () => persisted, write: async () => {}, fetch: async () => { calls++; throw new Error('network'); } });
  clock += 7 * 3600000; const stale = await get(); assert.equal(stale.stale, true); assert.equal(stale.updatedAt, persisted?.updatedAt);
  await get(); assert.equal(calls, 1);
  clock += 8 * 86400000; await assert.rejects(get, { code: 'UPSTREAM_ERROR' });
});
test('invalid or oversized upstream data cannot replace valid cache', async () => {
  for (const response of [Response.json({ DATA: [] }), Response.json({ DATA: [{ nope: true }] }), new Response('{}', { headers: { 'Content-Length': '40000001' } }), new Response('', { status: 500 })]) {
    let wrote = false;
    const get = createEventService({ now: () => now, read: async () => undefined, write: async () => { wrote = true; }, fetch: async () => response });
    await assert.rejects(get); assert.equal(wrote, false);
  }
});
test('cache rejects tampered schema and future timestamp does not bypass a fetch', async () => {
  const get = createEventService({ now: () => now, read: async () => ({ source: SOURCE, updatedAt: new Date(now + 86400000).toISOString(), events: [{ bad: true }] }), write: async () => {}, fetch: async () => Response.json({ DATA: [row] }) });
  assert.equal((await get()).stale, false);
});
function response() {
  const out = { status: 0, body: '', headers: new Map<string, string>() };
  const res = { setHeader: (k: string, v: string) => out.headers.set(k, v), writeHead: (s: number) => { out.status = s; }, end: (s: string) => { out.body = s; } } as unknown as ServerResponse;
  return { out, res };
}
test('API rejects write methods and translation rejects arbitrary text requests', async () => {
  const { out, res } = response(); await handler({ method: 'POST' } as IncomingMessage, res);
  assert.equal(out.status, 405); assert.equal(out.headers.get('Allow'), 'GET');
  await translateHandler({ method: 'GET', url: '/api/translate?text=private&lang=xx' } as IncomingMessage, res);
  assert.equal(out.status, 400); assert.deepEqual(JSON.parse(out.body), { error: 'INVALID_REQUEST' });
});
