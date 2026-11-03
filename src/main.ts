import { filterEvents, safeUrl, seoulToday, dateKey, isCultureEvent } from './events.ts';
import { el, button, label } from './dom.ts';
import { showEventDetail } from './event-detail.ts';
import { formatEventDate } from './format.ts';
import { extra } from './enhancements-i18n.ts';
import { offlineData } from './offline.ts';
import type { CultureEvent, Category, Filters } from './events.ts';
import { messages, locales } from './i18n.ts';
import type { Locale } from './i18n.ts';
import { displayEvent, readTranslations, translationCopy } from './translations.ts';
import type { TranslationMap } from './translations.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
let storageFailed = false;
function read(key: string): unknown { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { storageFailed = true; } }
const storedLocale = read('hiken:locale');
let locale: Locale = locales.includes(storedLocale as Locale) ? storedLocale as Locale : 'ko';
const storedSaved = read('hiken:saved');
const saved = new Set<string>(Array.isArray(storedSaved) ? storedSaved.filter((s): s is string => typeof s === 'string').slice(0, 500) : []);
let events: CultureEvent[] = [], loading = true, error = '', updated = '', partial = false, page = 1, view: 'list' | 'calendar' = 'list';
let stale = false, offline = false, sort: 'ending' | 'starting' | 'newest' = 'ending';
let translations: TranslationMap = new Map(), loadVersion = 0, translationUnavailable = false;
let month = new Date(`${seoulToday().slice(0, 7)}-01T00:00:00Z`);
let filters: Filters = { query: '', category: 'all', district: '', date: '', ongoing: false, free: false, saved: false };
const t = () => messages[locale];
const x = () => extra[locale];
const formatted = (key: string, options?: Intl.DateTimeFormatOptions) => formatEventDate(key, locale, options);
function reset() { filters = { query: '', category: 'all', district: '', date: '', ongoing: false, free: false, saved: false }; page = 1; render(); }
function apply() { page = 1; renderResults(); }
function bookmark(e: CultureEvent, b: HTMLButtonElement) {
  if (saved.has(e.id)) saved.delete(e.id); else if (saved.size < 500) saved.add(e.id); else { b.setAttribute('aria-label', x().saveLimit); return; }
  write('hiken:saved', [...saved]); b.textContent = saved.has(e.id) ? '♥' : '♡';
  b.setAttribute('aria-label', saved.has(e.id) ? t().unsave : t().save); b.setAttribute('aria-pressed', String(saved.has(e.id)));
  renderResults();
}
const showDetail = (event: CultureEvent) => showEventDetail(event, locale, translations.get(event.id));
function card(e: CultureEvent) {
  const fields = translations.get(e.id), display = displayEvent(e, fields);
  const article = el('article', `event-card ${e.category}`); const poster = el('div', 'poster');
  const art = el('div', 'poster-art'); art.setAttribute('aria-hidden', 'true'); art.append(el('span', '', 'SEOUL'), el('strong', '', e.category === 'exhibition' ? '展' : e.category === 'performance' ? '音' : '遊'), el('span', '', 'CULTURE & EVERYDAY')); poster.append(art);
  if (safeUrl(e.image, true)) { const img = el('img'); img.src = safeUrl(e.image, true); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => img.remove()); poster.append(img); }
  const save = button(saved.has(e.id) ? '♥' : '♡', () => bookmark(e, save), 'bookmark');
  save.setAttribute('aria-label', saved.has(e.id) ? t().unsave : t().save); save.setAttribute('aria-pressed', String(saved.has(e.id))); poster.append(save);
  const body = el('div', 'card-body'); const badges = el('div', 'badges'); badges.append(el('span', 'badge', t()[e.category])); if (e.free) badges.append(el('span', 'badge free', t().free));
  const title = el('h3', '', display.title); title.lang = fields?.title !== undefined ? locale : 'ko'; const venue = el('p', 'venue', display.place); venue.lang = fields?.place !== undefined ? locale : 'ko';
  if (locale !== 'ko' && fields?.title === undefined) badges.append(el('span', 'translation-pending', translationCopy[locale].pending));
  body.append(badges, title, el('p', 'dates', `${formatted(e.start)} — ${formatted(e.end)}`), venue, button(`${t().detail} ↗`, () => showDetail(e), 'detail-link'));
  article.append(poster, body); return article;
}
function renderCalendar(host: HTMLElement) {
  const cal = el('section', 'calendar'); const bar = el('div', 'calendar-bar');
  const title = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(month);
  const prev = button('←', () => { month.setUTCMonth(month.getUTCMonth() - 1); renderResults(); }); prev.setAttribute('aria-label', t().previous);
  const next = button('→', () => { month.setUTCMonth(month.getUTCMonth() + 1); renderResults(); }); next.setAttribute('aria-label', t().next);
  bar.append(prev, el('h3', '', title), next, button(t().today, () => { month = new Date(`${seoulToday().slice(0, 7)}-01T00:00:00Z`); filters.date = seoulToday(); page = 1; render(); }));
  cal.append(bar, el('p', 'muted', t().calendarHint));
  const grid = el('div', 'calendar-grid');
  for (let i = 0; i < 7; i++) grid.append(el('span', 'weekday', new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + i)))));
  for (let i = 0; i < month.getUTCDay(); i++) grid.append(el('span'));
  const eligible = filterEvents(events, { ...filters, date: '', ongoing: false }, saved, '0000-00-00', translations);
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  for (let day = 1; day <= days; day++) {
    const key = `${month.toISOString().slice(0, 7)}-${String(day).padStart(2, '0')}`;
    const count = eligible.filter(e => e.start <= key && e.end >= key && (!filters.ongoing || e.start <= seoulToday() && e.end >= seoulToday())).length;
    const b = button(String(day), () => { filters.date = filters.date === key ? '' : key; page = 1; render(); }, `day${key === filters.date ? ' selected' : ''}${key === seoulToday() ? ' today' : ''}`);
    b.setAttribute('aria-label', `${formatted(key)} · ${count} ${t().count}`); b.setAttribute('aria-pressed', String(key === filters.date));
    if (count) b.append(el('small', '', String(count))); grid.append(b);
  }
  cal.append(grid); host.append(cal);
}
function renderResults() {
  const host = document.querySelector<HTMLElement>('#results')!; host.replaceChildren();
  if (storageFailed) host.append(el('p', 'notice', t().storage));
  if (loading) { host.append(el('div', 'state', t().loading)); host.setAttribute('aria-busy', 'true'); return; }
  host.setAttribute('aria-busy', 'false');
  if (error) {
    const state = el('div', 'state'); state.append(el('h2', '', t().error), el('p', '', error === 'CONFIG_REQUIRED' ? t().config : error === 'SECURE_TRANSPORT_REQUIRED' ? t().transport : t().retry), button(t().retry, () => void load(), 'primary')); host.append(state); return;
  }
  if (stale || offline) { const notice = el('div', 'notice', offline ? x().offline : x().stale); notice.append(button(x().refresh, () => void load())); host.append(notice); }
  if (locale !== 'ko') host.append(el('p', 'notice', translationUnavailable ? x().translationError : translationCopy[locale].coverage));
  const result = filterEvents(events, filters, saved, seoulToday(), translations).sort((a, b) => sort === 'ending' ? a.end.localeCompare(b.end) : sort === 'newest' ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start));
  const count = el('p', 'result-count', `${result.length.toLocaleString(locale)} ${t().count}`); count.setAttribute('role', 'status'); host.append(count);
  if (view === 'calendar') renderCalendar(host);
  if (!result.length) { const empty = el('div', 'state'); empty.append(el('h3', '', t().empty), el('p', '', t().emptyHint), button(t().reset, reset, 'primary')); host.append(empty); return; }
  const grid = el('div', 'event-grid'); const pages = Math.ceil(result.length / 12); page = Math.min(page, pages);
  result.slice((page - 1) * 12, page * 12).forEach(e => grid.append(card(e))); host.append(grid);
  if (pages > 1) {
    const nav = el('nav', 'pagination'); nav.setAttribute('aria-label', t().page);
    const prev = button(`← ${t().previous}`, () => { page--; renderResults(); }); prev.disabled = page === 1;
    const next = button(`${t().next} →`, () => { page++; renderResults(); }); next.disabled = page === pages;
    nav.append(prev, el('span', '', `${page} / ${pages}`), next); host.append(nav);
  }
  if (updated) host.append(el('p', 'updated', `${t().updated} · ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(updated))} (KST)`));
  if (partial) host.append(el('p', 'quality-note', x().invalidData));
}
function render() {
  document.documentElement.lang = locale; document.title = `${t().brand} · Hiken`; app.replaceChildren();
  const skip = el('a', 'skip', t().explore); skip.href = '#discover';
  const header = el('header'); const nav = el('nav', 'shell topbar'); nav.setAttribute('aria-label', t().brand);
  const logo = el('a', 'logo'); logo.href = '/'; logo.append(el('span', 'seal', '서\n울'), el('strong', '', t().brand));
  const links = el('div', 'nav-links');
  const navLabels = { ko: ['행사 찾기', '저장한 행사'], en: ['Explore', 'Saved'], ja: ['イベント', '保存済み'], es: ['Explorar', 'Guardados'] } as const;
  const explore = button(navLabels[locale][0], () => { filters.saved = false; page = 1; render(); document.querySelector('#discover')?.scrollIntoView(); }, !filters.saved ? 'nav-active' : ''); explore.setAttribute('aria-label', t().explore);
  const savedButton = button(`♡ ${navLabels[locale][1]}`, () => { filters.saved = !filters.saved; page = 1; render(); document.querySelector('#discover')?.scrollIntoView(); }, filters.saved ? 'nav-active' : ''); savedButton.setAttribute('aria-label', t().saved); savedButton.setAttribute('aria-pressed', String(filters.saved));
  const lang = el('select'); lang.id = 'language'; lang.setAttribute('aria-label', t().language);
  const names = { ko: '한국어', en: 'English', ja: '日本語', es: 'Español' };
  locales.forEach(code => { const opt = el('option', '', names[code]); opt.value = code; opt.selected = code === locale; lang.append(opt); });
  lang.addEventListener('change', () => { locale = lang.value as Locale; write('hiken:locale', locale); translations = new Map(); page = 1; render(); void load(); }); links.append(explore, savedButton); nav.append(logo, links, lang); header.append(nav);
  const main = el('main', 'shell'); const hero = el('section', 'hero'); const copy = el('div', 'hero-copy');
  const headline = el('h1');
  for (const line of x().hero.split('\n')) headline.append(el('span', 'headline-line', line));
  copy.append(el('p', 'eyebrow', `SEOUL, EVERY DAY / ${seoulToday().replaceAll('-', '.')}`), headline, el('p', 'intro', x().intro));
  const browse = el('a', 'hero-cta', `${x().browse} ↗`); browse.href = '#discover'; copy.append(browse);
  const current = events.filter(e => e.end >= seoulToday());
  const featured = current.filter(e => e.image && e.start >= seoulToday()).sort((a, b) => a.start.localeCompare(b.start))[0] || current.find(e => e.image);
  const graphic = el('div', 'hero-feature');
  if (featured) {
    const img = el('img'); img.src = safeUrl(featured.image, true); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.fetchPriority = 'high'; img.addEventListener('error', () => img.remove());
    const featuredTitle = el('h2', '', displayEvent(featured, translations.get(featured.id)).title); featuredTitle.lang = translations.get(featured.id)?.title !== undefined ? locale : 'ko';
    const caption = el('div', 'feature-caption'); caption.append(el('span', 'feature-label', x().featured), featuredTitle, el('p', '', `${featured.district} · ${formatted(featured.start)}`), button(`${t().detail} ↗`, () => showDetail(featured), 'feature-button'));
    graphic.append(img, caption);
  } else { graphic.append(el('span', 'hero-lettering', '서울'), el('p', '', x().edition)); }
  hero.append(copy, graphic); main.append(hero);
  const stats = el('div', 'culture-stats');
  for (const [value, text] of [[current.length, x().upcoming], [current.filter(e => e.free).length, x().freeEvents], [new Set(current.map(e => e.district).filter(Boolean)).size, x().districts]]) { const stat = el('div'); stat.append(el('strong', '', Number(value).toLocaleString(locale)), el('span', '', String(text))); stats.append(stat); }
  main.append(stats);
  const discover = el('section', 'discover'); discover.id = 'discover'; discover.tabIndex = -1;
  const search = el('form', 'search'); search.setAttribute('role', 'search');
  const input = el('input'); input.type = 'search'; input.value = filters.query; input.placeholder = t().search; input.maxLength = 120; input.setAttribute('aria-label', t().search);
  input.addEventListener('input', () => { filters.query = input.value; apply(); });
  const submit = el('button', 'primary', `${t().searchButton} ↗`); submit.type = 'submit'; search.addEventListener('submit', ev => { ev.preventDefault(); filters.query = input.value; apply(); }); search.append(input, submit);
  const tabs = el('div', 'categories');
  const icons = { all: '◉', exhibition: '▧', performance: '♫', festival: '✳' };
  (['all', 'exhibition', 'performance', 'festival'] as Category[]).forEach(category => {
    const b = button(`${icons[category]}  ${t()[category]}`, () => { filters.category = category; page = 1; render(); }, filters.category === category ? 'active' : ''); b.setAttribute('aria-pressed', String(filters.category === category)); tabs.append(b);
  });
  const controls = el('div', 'filters');
  for (const key of ['ongoing', 'free'] as const) { const check = el('input'); check.type = 'checkbox'; check.checked = filters[key]; check.addEventListener('change', () => { filters[key] = check.checked; apply(); }); const l = el('label', 'check'); l.append(check, document.createTextNode(t()[key])); controls.append(l); }
  const districts = el('select'); const all = el('option', '', t().district); all.value = ''; districts.append(all);
  [...new Set(events.map(e => e.district).filter(Boolean))].sort().forEach(district => { const opt = el('option', '', district); opt.value = district; opt.selected = district === filters.district; districts.append(opt); });
  districts.addEventListener('change', () => { filters.district = districts.value; apply(); }); controls.append(label(t().district, districts));
  const date = el('input'); date.type = 'date'; date.value = filters.date; date.addEventListener('change', () => { filters.date = dateKey(date.value); apply(); }); controls.append(label(t().date, date), button(t().reset, reset, 'reset'));
  const bar = el('div', 'section-bar'); bar.append(el('h2', '', filters.saved ? t().saved : t().results));
  const sortSelect = el('select'); sortSelect.setAttribute('aria-label', x().sort);
  for (const key of ['ending', 'starting', 'newest'] as const) { const option = el('option', '', x()[key]); option.value = key; option.selected = sort === key; sortSelect.append(option); }
  sortSelect.addEventListener('change', () => { sort = sortSelect.value as typeof sort; apply(); }); bar.append(sortSelect);
  const views = el('div', 'view-toggle'); (['list', 'calendar'] as const).forEach(v => { const b = button(t()[v], () => { view = v; render(); }, view === v ? 'active' : ''); b.setAttribute('aria-pressed', String(view === v)); views.append(b); }); bar.append(views);
  const results = el('div'); results.id = 'results'; discover.append(search, tabs, controls, bar, results); main.append(discover);
  const footer = el('footer', 'shell footer'); const source = el('a', '', `${t().source} ↗`); source.href = 'https://data.seoul.go.kr/dataList/OA-23041/S/1/datasetView.do'; source.target = '_blank'; source.rel = 'noopener noreferrer';
  footer.append(el('strong', '', t().footer), source, el('p', '', translationCopy[locale].note), el('p', '', translationCopy[locale].privacy), el('small', '', `© ${new Date().getFullYear()} Hiken · Seoul · ${x().sourceNote}`));
  app.append(skip, header, main, footer); renderResults();
}
function usePayload(value: unknown, fromOffline = false): boolean {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (!Array.isArray(p.events) || !p.events.every(isCultureEvent) || typeof p.updatedAt !== 'string' || !Number.isFinite(Date.parse(p.updatedAt))) return false;
  const age = Date.now() - Date.parse(p.updatedAt);
  if (age < -60_000 || age > 7 * 86400000) return false;
  events = p.events; translations = p.locale === locale && locale !== 'ko' ? readTranslations(p.translations) : new Map(); translationUnavailable = p.translationStatus === 'unavailable'; updated = p.updatedAt; partial = p.partial === true; stale = p.stale === true; offline = fromOffline; return true;
}
async function load() {
  const version = ++loadVersion, requestedLocale = locale;
  loading = true; error = ''; renderResults();
  try {
    const response = await fetch(`/api/getEvents?lang=${requestedLocale}`, { cache: 'no-cache', signal: AbortSignal.timeout(55_000), headers: { Accept: 'application/json' } });
    const data: unknown = await response.json();
    if (version !== loadVersion) return;
    if (!data || typeof data !== 'object') throw new Error('INVALID_DATA');
    const payload = data as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'UPSTREAM_ERROR');
    if (!usePayload(payload)) throw new Error('INVALID_DATA');
    await offlineData(payload, requestedLocale).catch(() => undefined);
  } catch (e) {
    const cached = await offlineData(undefined, requestedLocale).catch(() => undefined);
    if (version !== loadVersion) return;
    if (!usePayload(cached, true)) error = e instanceof Error ? e.message : 'UPSTREAM_ERROR';
  }
  finally { if (version === loadVersion) { loading = false; render(); } }
}
render(); void load();
if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/service-worker.js').catch(() => undefined);
