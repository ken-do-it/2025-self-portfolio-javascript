import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import handler from '../api/getEvents.ts';
import translateHandler from '../api/translate.ts';
import syncHandler from '../api/syncTranslations.ts';
import statusHandler from '../api/translationStatus.ts';
try { process.loadEnvFile('.env.local'); } catch { /* Environment variables also supported. */ }
const root = resolve('dist');
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
export const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
const server = createServer(async (req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  if (path === '/' || path === '/index.html') res.setHeader('Cache-Control', 'public, no-cache, max-age=0, must-revalidate, no-transform');
  if (path === '/api/getEvents') { await handler(req, res); return; }
  if (path === '/api/translate') { await translateHandler(req, res); return; }
  if (path === '/api/syncTranslations') { await syncHandler(req, res); return; }
  if (path === '/api/translationStatus') { await statusHandler(req, res); return; }
  if (!['GET', 'HEAD'].includes(req.method || '')) { res.writeHead(405); res.end(); return; }
  try {
    const file = resolve(root, `.${decodeURIComponent(path === '/' ? '/index.html' : path)}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
let port = Number(process.env.PORT || 4173), retries = 0;
server.on('listening', () => console.log(`Local: http://127.0.0.1:${port}`));
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE' && retries++ < 10) {
    console.log(`Port ${port} is in use; trying ${port + 1}.`);
    server.listen(++port, '127.0.0.1');
  } else { console.error('Local server could not start:', error.code); process.exitCode = 1; }
});
server.listen(port, '127.0.0.1');
