// Isolated UI test server. Never used by npm start or production builds.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { normalizeRows, seoulToday } from '../src/events.ts';
const today = seoulToday();
const start = `${today.slice(0, 7)}-01`, end = `${today.slice(0, 7)}-28`;
const events = normalizeRows(Array.from({ length: 15 }, (_, i) => ({
  TITLE: ['[예시] 한지에 담은 서울의 풍경', '[예시] 저녁의 국악 산책', '[예시] 우리 동네 공예 마당'][i % 3] + ` ${i + 1}`,
  STRTDATE: start, END_DATE: end, CODENAME: ['전시', '국악', '문화체험'][i % 3],
  PLACE: ['서울 전시관', '시민 공연장', '문화 마당'][i % 3], GUNAME: ['종로구', '중구', '마포구'][i % 3],
  IS_FREE: i % 2 === 0 ? '무료' : '유료', USE_FEE: '10,000원', USE_TRGT: '전체 관람가', ORG_LINK: 'https://culture.seoul.go.kr'
})));
createServer(async (req, res) => {
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if (path === '/api/getEvents') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ events, updatedAt: new Date().toISOString(), partial: false })); return; }
  const files: Record<string, [string, string]> = { '/': ['index.html', 'text/html'], '/main.js': ['main.js', 'text/javascript'], '/service-worker.js': ['service-worker.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/favicon-32x32.png': ['favicon-32x32.png', 'image/png'] };
  const entry = files[path]; if (!entry) { res.writeHead(404); res.end(); return; }
  try {
    let data: string | Buffer = await readFile(`dist/${entry[0]}`);
    if (path === '/') data = data.toString().replace('<body>', '<body><aside class="notice" role="note">검증용 예시 데이터 · 실제 행사 아님 / Test fixtures — not real events</aside>');
    res.setHeader('Content-Type', `${entry[1]}; charset=utf-8`); res.end(data);
  } catch { res.writeHead(500); res.end(); }
}).listen(4174, '127.0.0.1', () => console.log('Fixture preview: http://127.0.0.1:4174'));
