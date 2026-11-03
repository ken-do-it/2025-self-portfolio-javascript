import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { runTranslationWorker } from '../server/translation-worker.ts';
import { databaseConfigured } from '../server/database.ts';

export function authorized(authorization: string | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.writeHead(405); res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' })); return; }
  if (!authorized(req.headers.authorization, process.env.CRON_SECRET)) { res.writeHead(401); res.end(JSON.stringify({ error: 'UNAUTHORIZED' })); return; }
  if (!databaseConfigured()) { res.writeHead(503); res.end(JSON.stringify({ error: 'TRANSLATION_STORE_UNAVAILABLE' })); return; }
  try { const result = await runTranslationWorker(); res.writeHead(200); res.end(JSON.stringify(result)); }
  catch { res.writeHead(503); res.end(JSON.stringify({ error: 'TRANSLATION_SYNC_FAILED' })); }
}
