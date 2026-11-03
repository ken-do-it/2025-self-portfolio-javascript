export type Category = 'all' | 'exhibition' | 'performance' | 'festival';
export interface CultureEvent {
  id: string; title: string; category: Exclude<Category, 'all'>; district: string;
  place: string; start: string; end: string; free: boolean; fee: string;
  image: string; url: string; audience: string;
  description?: string; time?: string; latitude?: number; longitude?: number;
}
export function safeUrl(value: unknown, image = false): string {
  if (typeof value !== 'string' || value.length > 2048) return '';
  try {
    const url = new URL(value);
    if (url.username || url.password) return '';
    if (image ? url.protocol !== 'https:' : !['https:', 'http:'].includes(url.protocol)) return '';
    return url.href;
  } catch { return ''; }
}
export function dateKey(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 4_102_444_800_000) return seoulToday(new Date(value));
  if (typeof value !== 'string') return '';
  const key = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return '';
  const date = new Date(`${key}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key ? key : '';
}
export function seoulToday(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now);
}
function string(value: unknown, limit = 500): string {
  return typeof value === 'string' ? value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim().slice(0, limit) : '';
}
export function normalizeRows(rows: unknown): CultureEvent[] {
  if (!Array.isArray(rows)) throw new Error('INVALID_DATA');
  const events: CultureEvent[] = [];
  const seen = new Set<string>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const r = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.toUpperCase(), value])) as Record<string, unknown>;
    const title = string(r.TITLE), start = dateKey(r.STRTDATE), end = dateKey(r.END_DATE);
    if (!title || !start || !end || end < start) continue;
    const place = string(r.PLACE), code = string(r.CODENAME);
    const id = JSON.stringify([title, start, end, place]);
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({ id, title, start, end, place, district: string(r.GUNAME),
      category: /전시|미술|사진|디자인|공예/.test(code) ? 'exhibition' : /연극|클래식|뮤지컬|국악|콘서트|무용|독주|공연/.test(code) ? 'performance' : 'festival',
      free: r.IS_FREE === '무료', fee: string(r.USE_FEE), audience: string(r.USE_TRGT),
      image: safeUrl(r.MAIN_IMG, true), url: safeUrl(r.ORG_LINK) || safeUrl(r.HMPG_ADDR),
      description: string(r.PROGRAM, 4000) || string(r.ETC_DESC, 4000), time: string(r.PRO_TIME),
      ...coordinates(r.LAT, r.LOT) });
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}
export function coordinates(lat: unknown, lon: unknown): { latitude?: number; longitude?: number } {
  const latitude = Number(lat), longitude = Number(lon);
  // Only accept plausible Korea coordinates; do not silently swap mislabeled fields.
  return latitude >= 33 && latitude <= 39 && longitude >= 124 && longitude <= 132 ? { latitude, longitude } : {};
}
export function isCultureEvent(value: unknown): value is CultureEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return ['id', 'title', 'district', 'place', 'fee', 'image', 'url', 'audience'].every(k => typeof e[k] === 'string' && e[k].length < 5000)
    && typeof e.start === 'string' && typeof e.end === 'string' && !!dateKey(e.start) && !!dateKey(e.end) && e.end >= e.start
    && ['exhibition', 'performance', 'festival'].includes(String(e.category)) && typeof e.free === 'boolean'
    && (e.description === undefined || typeof e.description === 'string' && e.description.length <= 4000)
    && (e.time === undefined || typeof e.time === 'string')
    && (e.latitude === undefined && e.longitude === undefined || Object.keys(coordinates(e.latitude, e.longitude)).length === 2);
}
export interface Filters { query: string; category: Category; district: string; date: string; ongoing: boolean; free: boolean; saved: boolean; }
export function filterEvents(events: CultureEvent[], filters: Filters, saved: ReadonlySet<string>, today = seoulToday()): CultureEvent[] {
  const q = filters.query.trim().toLocaleLowerCase();
  return events.filter(e => (!filters.date ? e.end >= today : e.start <= filters.date && e.end >= filters.date)
    && (!filters.ongoing || e.start <= today && e.end >= today)
    && (filters.category === 'all' || e.category === filters.category)
    && (!filters.district || e.district === filters.district)
    && (!filters.free || e.free) && (!filters.saved || saved.has(e.id))
    && (!q || `${e.title} ${e.place} ${e.district}`.toLocaleLowerCase().includes(q)));
}
