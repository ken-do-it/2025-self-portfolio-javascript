import type { IncomingMessage, ServerResponse } from 'node:http';
import { getEvents } from '../server/events.ts';
import { ApiError } from '../server/http.ts';
import { getLocalizations } from '../server/localizations.ts';
import { isTargetLanguage, translationComplete } from '../src/translations.ts';
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return; }
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const id = url.searchParams.get('id'), locale = url.searchParams.get('lang');
    if (!id || id.length > 2000 || !isTargetLanguage(locale)) throw new ApiError(400, 'INVALID_REQUEST');
    const { events } = await getEvents(); const event = events.find(e => e.id === id);
    if (!event) throw new ApiError(404, 'NOT_FOUND');
    const result = await getLocalizations([event], locale);
    if (result.translationStatus === 'unavailable') throw new ApiError(503, 'TRANSLATION_STORE_UNAVAILABLE');
    const fields = result.translations[0]?.fields || {};
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.writeHead(200); res.end(JSON.stringify({ fields, locale, pending: !translationComplete(event, fields), provider: 'MyMemory', machine: true }));
  } catch (error) { res.writeHead(error instanceof ApiError ? error.status : 502); res.end(JSON.stringify({ error: error instanceof ApiError ? error.code : 'TRANSLATION_FAILED' })); }
}
