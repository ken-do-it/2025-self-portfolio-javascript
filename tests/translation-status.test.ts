import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { coverage, nextSchedule } from '../server/translation-status.ts';
import { normalizeRows } from '../src/events.ts';

test('coverage excludes expired events and fields needing no translation; counts partial details separately', () => {
  const events = normalizeRows([{ TITLE: '전시', PLACE: '서울', PROGRAM: '설명', STRTDATE: '2026-11-01', END_DATE: '2026-11-30' }]);
  const event = events[0]!;
  const counts = coverage([...events, { ...event, id: 'expired', end: '2026-11-08' }], new Map([[event.id, { title: 'Exhibition', place: 'Seoul' }]]), '2026-11-09');
  assert.equal(counts.events, 1); assert.equal(counts.completeEvents, 0);
  assert.deepEqual(counts.title, { done: 1, total: 1 });
  assert.deepEqual(counts.details, { done: 1, total: 2 });
  assert.equal(coverage([{ ...event, title: 'Art', place: '', description: '' }], new Map(), '2026-11-09').title.total, 0);
});
test('next schedule uses UTC consistently across day/year boundaries and matches deployed cron', async () => {
  assert.equal(nextSchedule(new Date('2026-11-09T01:14:59Z')), '2026-11-09T01:15:00.000Z');
  assert.equal(nextSchedule(new Date('2026-11-09T01:15:00Z')), '2026-11-10T01:15:00.000Z');
  assert.equal(nextSchedule(new Date('2026-12-31T23:00:00Z')), '2027-01-01T01:15:00.000Z');
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.crons[0].schedule, '15 1 * * *');
});
