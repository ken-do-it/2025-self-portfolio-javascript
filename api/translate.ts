import type { IncomingMessage, ServerResponse } from 'node:http';
import { getEvents } from '../server/events.ts';
import { ApiError } from '../server/http.ts';
import { translateEvent } from '../server/translate.ts';
import type { TargetLanguage } from '../server/translate.ts';
let active = 0;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return; }
  if (active >= 2) { res.writeHead(429); res.end(JSON.stringify({ error: 'TRANSLATION_LIMIT' })); return; }
  active++;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const id = url.searchParams.get('id'), locale = url.searchParams.get('lang');
    if (!id || id.length > 2000 || !locale || !['en', 'ja', 'es'].includes(locale)) throw new ApiError(400, 'INVALID_REQUEST');
    const { events } = await getEvents(); const event = events.find(e => e.id === id);
    if (!event) throw new ApiError(404, 'NOT_FOUND');
    const fields = await translateEvent(event, locale as TargetLanguage);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.writeHead(200); res.end(JSON.stringify({ fields, locale, provider: 'MyMemory', machine: true }));
  } catch (error) { res.writeHead(error instanceof ApiError ? error.status : 502); res.end(JSON.stringify({ error: error instanceof ApiError ? error.code : 'TRANSLATION_FAILED' })); }
  finally { active--; }
}
