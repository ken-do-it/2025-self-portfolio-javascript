import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRows, coordinates, isCultureEvent } from '../src/events.ts';
import { mapLinks } from '../src/maps.ts';
import { splitText } from '../server/translate.ts';
import { sourceHash } from '../server/localizations.ts';
import { extra } from '../src/enhancements-i18n.ts';
const event = normalizeRows([{ title: '한글 문화행사', strtdate: 1793631600000, end_date: 1794236400000, lat: '37.57', lot: '126.98', place: '공예박물관', program: '<p>나무 &amp; 공예</p>' }])[0]!;
test('official export lower-case fields, epochs, descriptions and coordinates normalize', () => {
  assert.equal(event.description, '나무 & 공예'); assert.equal(event.latitude, 37.57); assert.ok(isCultureEvent(event));
  assert.deepEqual(coordinates('126.98', '37.57'), {}); assert.equal(isCultureEvent({ ...event, latitude: 999 }), false);
});
test('map links encode venue text and use validated coordinates', () => {
  const links = mapLinks(event); const url = new URL(links.google);
  assert.equal(url.searchParams.get('destination'), '37.57,126.98'); assert.equal(url.searchParams.get('travelmode'), 'transit');
  assert.match(links.naver, /^https:\/\/map.naver.com\/p\/search\//);
  assert.ok(!mapLinks({ ...event, latitude: undefined, longitude: undefined }).kakao.includes('undefined'));
});
test('translation segments preserve Unicode and stay below byte limit; cache invalidates by content', () => {
  const input = '서울 🎨 문화의 날 '.repeat(100); const chunks = splitText(input);
  assert.equal(chunks.join(''), input); assert.ok(chunks.every(p => Buffer.byteLength(p) <= 450));
  assert.notEqual(sourceHash(event.title, 'en'), sourceHash(event.title, 'ja'));
  assert.notEqual(sourceHash(event.description || '', 'en'), sourceHash('새 설명', 'en'));
});
test('enhancement messages cover all four languages', () => {
  for (const dict of Object.values(extra)) assert.deepEqual(Object.keys(dict).sort(), Object.keys(extra.ko).sort());
});
