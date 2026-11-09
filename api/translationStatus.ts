import type { IncomingMessage, ServerResponse } from 'node:http';
import { translationStatus } from '../server/translation-status.ts';
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return; }
  try {
    const data = await translationStatus();
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.writeHead(200); res.end(JSON.stringify(data));
  } catch { res.writeHead(503); res.end(JSON.stringify({ error: 'STATUS_UNAVAILABLE' })); }
}
