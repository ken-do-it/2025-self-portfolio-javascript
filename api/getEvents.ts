import type { IncomingMessage, ServerResponse } from 'node:http';
import { getEvents, ApiError } from '../server/events.ts';
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return;
  }
  try {
    const data = await getEvents();
    res.setHeader('Cache-Control', data.stale ? 'public, max-age=30, s-maxage=30' : 'public, max-age=60, s-maxage=600, stale-while-revalidate=120');
    res.writeHead(200); res.end(JSON.stringify(data));
  } catch (error) {
    res.writeHead(error instanceof ApiError ? error.status : 502);
    res.end(JSON.stringify({ error: error instanceof ApiError ? error.code : 'UPSTREAM_ERROR' }));
  }
}
