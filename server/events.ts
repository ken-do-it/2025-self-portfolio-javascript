import { readFile } from 'node:fs/promises';
import { normalizeRows, isCultureEvent, seoulToday } from '../src/events.ts';
import type { CultureEvent } from '../src/events.ts';
import { ApiError, limitedJson } from './http.ts';
import { readCache, writeCache } from './storage.ts';
export { ApiError } from './http.ts';
export const SOURCE = 'https://data.seoul.go.kr/dataList/OA-23041/S/1/datasetView.do';
export interface Payload { events: CultureEvent[]; updatedAt: string; partial: boolean; stale: boolean; source: string; }
const FRESH_MS = 6 * 60 * 60 * 1000, MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;
export function validPayload(value: unknown): value is Payload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return Array.isArray(p.events) && p.events.length > 0 && p.events.length <= 30000 && p.events.every(isCultureEvent)
    && typeof p.updatedAt === 'string' && Number.isFinite(Date.parse(p.updatedAt)) && p.source === SOURCE;
}
// Factory makes the cache/clock/network boundaries independently testable.
export function createEventService(deps: {
  fetch: typeof fetch; read: () => Promise<unknown>; write: (p: Payload) => Promise<void>; now: () => number;
}) {
  let cache: Payload | undefined, pending: Promise<Payload> | undefined, retryAfter = 0;
  async function load(): Promise<Payload> {
    if (!cache) { const disk = await deps.read(); if (validPayload(disk)) cache = disk; }
    const age = cache ? deps.now() - Date.parse(cache.updatedAt) : Infinity;
    if (cache && age >= 0 && age < FRESH_MS) return { ...cache, stale: false };
    if (cache && age >= 0 && age < MAX_STALE_MS && deps.now() < retryAfter) return { ...cache, stale: true };
    try {
      const response = await deps.fetch('https://datafile.seoul.go.kr/bigfile/iot/sheet/json/download.do', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25_000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ srvType: 'S', infId: 'OA-23041', serviceKind: '0', pageNo: '1', ssUserId: 'SAMPLE_VIEW', strWhere: '', strOrderby: 'DATE DESC' })
      });
      const raw = await limitedJson(response, 40_000_000);
      if (!raw || typeof raw !== 'object' || !('DATA' in raw) || !Array.isArray(raw.DATA) || raw.DATA.length === 0 || raw.DATA.length > 100000) throw new ApiError(502, 'INVALID_DATA');
      const normalized = normalizeRows(raw.DATA);
      if (normalized.length < raw.DATA.length * 0.8) throw new ApiError(502, 'INVALID_DATA');
      const cutoff = seoulToday(new Date(deps.now() - 30 * 86400000));
      const events = normalized.filter(e => e.end >= cutoff);
      if (!events.length) throw new ApiError(502, 'INVALID_DATA');
      cache = { events, updatedAt: new Date(deps.now()).toISOString(), partial: normalized.length !== raw.DATA.length, stale: false, source: SOURCE };
      try { await deps.write(cache); } catch { /* A cache write failure must not discard fresh public data. */ }
      retryAfter = 0; return cache;
    } catch (error) {
      retryAfter = deps.now() + 60_000;
      if (cache && age >= 0 && age < MAX_STALE_MS) return { ...cache, stale: true };
      throw error instanceof ApiError ? error : new ApiError(502, 'UPSTREAM_ERROR');
    }
  }
  return async () => {
    if (!pending) pending = load().finally(() => { pending = undefined; });
    return pending;
  };
}
export const getEvents = createEventService({
  fetch: (...args) => fetch(...args), now: Date.now,
  read: async () => {
    const disk = await readCache('events'); if (validPayload(disk)) return disk;
    try { return JSON.parse(await readFile(new URL('../data/events.snapshot.json', import.meta.url), 'utf8')); } catch { return undefined; }
  },
  write: p => writeCache('events', p)
});
