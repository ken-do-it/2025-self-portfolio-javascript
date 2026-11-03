import type { IncomingMessage, ServerResponse } from 'node:http';
import { getEvents, ApiError } from '../server/events.ts';
import { isTargetLanguage } from '../src/translations.ts';
import { getLocalizations } from '../server/localizations.ts';
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return;
  }
  try {
    const locale = new URL(req.url || '/', 'http://localhost').searchParams.get('lang') || 'ko';
    if (locale !== 'ko' && !isTargetLanguage(locale)) throw new ApiError(400, 'INVALID_REQUEST');
    const data = await getEvents();
    const localized = isTargetLanguage(locale) ? await getLocalizations(data.events, locale) : { translations: [], translationStatus: 'original' };
    res.setHeader('Cache-Control', data.stale ? 'public, max-age=30, s-maxage=30' : 'public, max-age=60, s-maxage=600, stale-while-revalidate=120');
    res.writeHead(200); res.end(JSON.stringify({ ...data, ...localized, locale }));
  } catch (error) {
    res.writeHead(error instanceof ApiError ? error.status : 502);
    res.end(JSON.stringify({ error: error instanceof ApiError ? error.code : 'UPSTREAM_ERROR' }));
  }
}
