import { ApiError, limitedJson } from './http.ts';
import type { TargetLanguage } from '../src/translations.ts';

export function splitText(text: string, maxBytes = 450): string[] {
  const parts: string[] = []; let part = '';
  for (const char of text) { if (Buffer.byteLength(part + char) > maxBytes) { parts.push(part); part = ''; } part += char; }
  if (part) parts.push(part); return parts;
}
// Only the authenticated scheduled worker may call this after a DB quota reservation.
export async function translateText(source: string, locale: TargetLanguage, request: typeof fetch = fetch): Promise<string> {
  const parts: string[] = [];
  const signal = AbortSignal.timeout(25_000);
  for (const part of splitText(source)) {
    if (!/[가-힣]/.test(part)) { parts.push(part); continue; }
    const url = new URL('https://api.mymemory.translated.net/get');
    url.search = new URLSearchParams({ q: part, langpair: `ko|${locale}`, mt: '1' }).toString();
    const response = await request(url, { signal, redirect: 'error' });
    if (response.status === 429) throw new ApiError(429, 'TRANSLATION_LIMIT');
    const raw = await limitedJson(response, 200_000);
    const data = raw as { responseStatus?: number; quotaFinished?: boolean; responseData?: { translatedText?: unknown } } | null;
    if (data?.quotaFinished || data?.responseStatus === 429) throw new ApiError(429, 'TRANSLATION_LIMIT');
    const text = data?.responseData?.translatedText;
    if (data?.responseStatus !== 200 || typeof text !== 'string' || !text || text.length > 5000) throw new ApiError(502, 'TRANSLATION_FAILED');
    parts.push(text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  }
  return parts.join('');
}
