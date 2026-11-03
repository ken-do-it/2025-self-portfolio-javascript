import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const worker = await readFile('dist/service-worker.js', 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"\s]+)"/g)].map(match => match[1]!);
assert.equal(assets.length, 2, 'HTML must reference fingerprinted JS and CSS');
assert.ok(assets.some(url => /^\/assets\/main-[\w-]+\.js$/.test(url)));
assert.ok(assets.some(url => /^\/assets\/style-[a-f0-9]+\.css$/.test(url)));
for (const url of assets) {
  const content = await readFile(`dist${url}`, 'utf8');
  assert.ok(content.length > 0, `Missing asset: ${url}`);
  assert.ok(!/SUPABASE_SECRET_KEY|CRON_SECRET|sb_secret_[A-Za-z0-9_-]+|Test fixtures — not real events/.test(content), 'Server credentials or test fixtures must not enter the client bundle');
  assert.ok(worker.includes(url), `Offline cache missing ${url}`);
}
assert.deepEqual((await readdir('dist/assets')).sort(), assets.map(url => url.split('/').at(-1)!).sort(), 'Old bundles must not survive a build');
assert.deepEqual((await readdir('dist')).sort(), ['assets', 'favicon-32x32.png', 'index.html', 'robots.txt', 'service-worker.js', 'sitemap.xml'].sort(), 'Unexpected public output');
const config = JSON.parse(await readFile('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
for (const source of ['/', '/index.html']) {
  const policy = config.headers.find(entry => entry.source === source)?.headers.find(header => header.key === 'Cache-Control')?.value;
  assert.ok(policy?.includes('no-transform') && policy.includes('no-cache'), 'HTML must prevent proxy injection and stale documents');
}
console.log('Verified build assets, offline cache, clean output and HTML cache policy');
