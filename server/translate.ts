import { createHash } from 'node:crypto';
import { ApiError, limitedJson } from './http.ts';
import { readCache, writeCache } from './storage.ts';
import type { CultureEvent } from '../src/events.ts';
export const translatedFields = ['title', 'place', 'description', 'fee', 'audience', 'time'] as const;
export type Translation = Record<typeof translatedFields[number], string>;
export type TargetLanguage = 'en' | 'ja' | 'es';
export function splitText(text: string, maxBytes = 450): string[] {
  const parts: string[] = []; let part = '';
  for (const char of text) { if (Buffer.byteLength(part + char) > maxBytes) { parts.push(part); part = ''; } part += char; }
  if (part) parts.push(part); return parts;
}
export function translationKey(event: CultureEvent, locale: TargetLanguage): string {
  return 'translation-' + createHash('sha256').update(JSON.stringify([locale, ...translatedFields.map(k => event[k] || '')])).digest('hex');
}
export function validTranslation(data: unknown): data is Translation {
  return !!data && typeof data === 'object' && translatedFields.every(k => k in data && typeof (data as Record<string, unknown>)[k] === 'string' && String((data as Record<string, unknown>)[k]).length <= 16000);
}
// Serialize reservations to keep this process's daily free-tier budget consistent.
let queue: Promise<unknown> = Promise.resolve();
let memoryBudget: { day: string; chars: number } | undefined;
export function translateEvent(event: CultureEvent, locale: TargetLanguage): Promise<Translation> {
  const job = queue.then(async () => {
    const key = translationKey(event, locale);
    const cached = await readCache(key); if (validTranslation(cached)) return cached;
    const texts = translatedFields.map(k => event[k] || '');
    const chars = texts.reduce((sum, text) => sum + text.length, 0);
    const day = new Date().toISOString().slice(0, 10);
    const disk = await readCache('translation-budget') as { day?: unknown; chars?: unknown } | undefined;
    const used = Math.max(memoryBudget?.day === day ? memoryBudget.chars : 0, disk?.day === day && typeof disk.chars === 'number' && disk.chars >= 0 ? disk.chars : 0);
    if (used + chars > 4500) throw new ApiError(429, 'TRANSLATION_LIMIT');
    memoryBudget = { day, chars: used + chars };
    try { await writeCache('translation-budget', memoryBudget); } catch { /* memory budget still applies */ }
    const result: Translation = { title: '', place: '', description: '', fee: '', audience: '', time: '' };
    const signal = AbortSignal.timeout(25_000);
    for (const field of translatedFields) {
      const parts: string[] = [];
      for (const part of splitText(event[field] || '')) {
        if (!/[가-힣]/.test(part)) { parts.push(part); continue; }
        const url = new URL('https://api.mymemory.translated.net/get');
        url.search = new URLSearchParams({ q: part, langpair: `ko|${locale}`, mt: '1' }).toString();
        const raw = await limitedJson(await fetch(url, { signal, redirect: 'error' }), 200_000);
        const data = raw as { responseStatus?: number; quotaFinished?: boolean; responseData?: { translatedText?: unknown } } | null;
        if (data?.quotaFinished || data?.responseStatus === 429) throw new ApiError(429, 'TRANSLATION_LIMIT');
        const text = data?.responseData?.translatedText;
        if (data?.responseStatus !== 200 || typeof text !== 'string' || !text || text.length > 5000) throw new ApiError(502, 'TRANSLATION_FAILED');
        parts.push(text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
      }
      result[field] = parts.join('');
    }
    await writeCache(key, result).catch(() => undefined);
    return result;
  });
  queue = job.catch(() => undefined); return job;
}
