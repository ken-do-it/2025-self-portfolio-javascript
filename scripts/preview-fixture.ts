// Isolated UI test server. Never used by npm start or production builds.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { normalizeRows, seoulToday } from '../src/events.ts';
import { isTargetLanguage } from '../src/translations.ts';
import type { TargetLanguage } from '../src/translations.ts';
const today = seoulToday();
const start = `${today.slice(0, 7)}-01`, end = `${today.slice(0, 7)}-28`;
const events = normalizeRows(Array.from({ length: 15 }, (_, i) => ({
  TITLE: ['[예시] 한지에 담은 서울의 풍경', '[예시] 저녁의 국악 산책', '[예시] 우리 동네 공예 마당'][i % 3] + ` ${i + 1}`,
  STRTDATE: start, END_DATE: end, CODENAME: ['전시', '국악', '문화체험'][i % 3],
  PLACE: ['서울 전시관', '시민 공연장', '문화 마당'][i % 3], GUNAME: ['종로구', '중구', '마포구'][i % 3],
  IS_FREE: i % 2 === 0 ? '무료' : '유료', USE_FEE: '10,000원', USE_TRGT: '전체 관람가', PROGRAM: '검증용 설명입니다. 실제 행사 정보가 아닙니다.', PRO_TIME: '오후 2시', ORG_LINK: 'https://culture.seoul.go.kr'
})));
const translated = (locale: TargetLanguage) => events.slice(0, 3).map((event, i) => ({ id: event.id, fields: {
  title: { en: '[Test] Discovering Seoul through traditional Korean paper and craftsmanship', ja: '[テスト] 韓紙と伝統工芸を通して出会うソウルの風景と暮らし', es: '[Prueba] Descubre los paisajes de Seúl a través del papel tradicional y la artesanía coreana' }[locale] + ` ${i + 1}`,
  place: { en: 'Seoul exhibition hall', ja: 'ソウル展示館', es: 'Sala de exposiciones de Seúl' }[locale],
  description: { en: 'Test description. This is not a real event.', ja: '検証用の説明です。実際のイベントではありません。', es: 'Descripción de prueba. No es un evento real.' }[locale],
  fee: '10,000 KRW', audience: { en: 'All ages', ja: '全年齢', es: 'Todas las edades' }[locale], time: '14:00'
} }));
createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost'), path = url.pathname, locale = url.searchParams.get('lang') || 'ko';
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if (path === '/api/getEvents') {
    if (locale === 'en') await new Promise(resolve => setTimeout(resolve, 800)); // Exercise language-response races.
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ events, locale, translations: isTargetLanguage(locale) ? translated(locale) : [], translationStatus: 'ready', updatedAt: new Date().toISOString(), partial: false })); return;
  }
  if (path === '/api/translate') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ locale, fields: isTargetLanguage(locale) ? translated(locale).find(row => row.id === url.searchParams.get('id'))?.fields || {} : {} })); return; }
  const files: Record<string, [string, string]> = { '/': ['index.html', 'text/html'], '/main.js': ['main.js', 'text/javascript'], '/service-worker.js': ['service-worker.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/favicon-32x32.png': ['favicon-32x32.png', 'image/png'] };
  const entry = files[path] || (/^\/assets\/[\w-]+\.(js|css)$/.test(path) ? [path.slice(1), path.endsWith('.js') ? 'text/javascript' : 'text/css'] : undefined); if (!entry) { res.writeHead(404); res.end(); return; }
  try {
    let data: string | Buffer = await readFile(`dist/${entry[0]}`);
    if (path === '/') data = data.toString().replace('<body>', '<body><aside class="notice" role="note">검증용 예시 데이터 · 실제 행사 아님 / Test fixtures — not real events</aside>');
    res.setHeader('Content-Type', `${entry[1]}; charset=utf-8`); res.end(data);
  } catch { res.writeHead(500); res.end(); }
}).listen(4180, '127.0.0.1', () => console.log('Fixture preview: http://127.0.0.1:4180'));
