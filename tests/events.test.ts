import test from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl, dateKey, seoulToday, normalizeRows, filterEvents } from '../src/events.ts';
import type { Filters } from '../src/events.ts';
import { messages } from '../src/i18n.ts';
const row = { TITLE: '서울 전시', STRTDATE: '2026-11-01 00:00:00', END_DATE: '2026-11-03 00:00:00', PLACE: '미술관', CODENAME: '전시/미술', GUNAME: '종로구', IS_FREE: '무료', ORG_LINK: 'https://example.com' };
const filters: Filters = { query: '', category: 'all', district: '', date: '', ongoing: false, free: false, saved: false };
test('rejects executable, credential-bearing and insecure image URLs', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,hi', '//evil.test', 'https://user:pass@example.com', null]) assert.equal(safeUrl(value), '');
  assert.equal(safeUrl('http://example.com/photo.jpg', true), '');
  assert.equal(safeUrl('https://example.com/photo.jpg', true), 'https://example.com/photo.jpg');
});
test('calendar dates validated including leap days; today uses Seoul timezone', () => {
  assert.equal(dateKey('2026-02-29'), ''); assert.equal(dateKey('2024-02-29 00:00:00'), '2024-02-29');
  assert.equal(dateKey('2026-13-01'), ''); assert.equal(dateKey(undefined), '');
  assert.equal(seoulToday(new Date('2026-11-01T15:00:00Z')), '2026-11-02');
});
test('normalization removes malformed rows and duplicates, sanitizes links', () => {
  const list = normalizeRows([row, row, null, { ...row, TITLE: 123 }, { ...row, END_DATE: '2026-10-31' }, { ...row, TITLE: '<img onerror=alert(1)>테스트', ORG_LINK: 'javascript:alert(1)' }]);
  assert.equal(list.length, 2); assert.equal(list[1]?.url, ''); assert.equal(list[0]?.free, true);
  assert.throws(() => normalizeRows({}));
});
test('ongoing and chosen-date filters include both boundaries and exclude future starts', () => {
  const list = normalizeRows([row, { ...row, TITLE: '미래 공연', STRTDATE: '2026-11-04', END_DATE: '2026-11-05', CODENAME: '국악' }]);
  assert.equal(filterEvents(list, { ...filters, ongoing: true }, new Set(), '2026-11-03').length, 1);
  assert.equal(filterEvents(list, { ...filters, date: '2026-11-02' }, new Set(), '2026-11-02').length, 1);
  assert.equal(filterEvents(list, { ...filters, date: '2026-11-05' }, new Set(), '2026-11-02')[0]?.title, '미래 공연');
  assert.equal(filterEvents(list, { ...filters, date: '2026-11-06' }, new Set(), '2026-11-02').length, 0);
});
test('search/category/region/free/saved filters compose', () => {
  const list = normalizeRows([row]); const saved = new Set([list[0]!.id]);
  const combined = { ...filters, query: '미술관', category: 'exhibition' as const, district: '종로구', free: true, saved: true };
  assert.equal(filterEvents(list, combined, saved, '2026-11-02').length, 1);
  assert.equal(filterEvents(list, { ...combined, category: 'performance' }, saved, '2026-11-02').length, 0);
  assert.equal(filterEvents(list, combined, new Set(), '2026-11-02').length, 0);
});
test('all four locales have complete nonempty message dictionaries', () => {
  for (const dict of Object.values(messages)) { assert.deepEqual(Object.keys(dict).sort(), Object.keys(messages.ko).sort()); assert.ok(Object.values(dict).every(v => v.length > 0)); }
});
