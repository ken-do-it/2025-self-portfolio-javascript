import type { CultureEvent } from './events.ts';
import { safeUrl } from './events.ts';
import { mapLinks } from './maps.ts';
import { messages } from './i18n.ts';
import type { Locale } from './i18n.ts';
import { extra } from './enhancements-i18n.ts';
import { el, button } from './dom.ts';
import { formatEventDate } from './format.ts';
import { displayEvent, translationComplete, translationCopy, validFields } from './translations.ts';
import type { Translation } from './translations.ts';

export function showEventDetail(e: CultureEvent, locale: Locale, initialFields: Translation = {}) {
  const t = () => messages[locale];
  const x = () => extra[locale];
  const formatted = (key: string) => formatEventDate(key, locale);
  const dialog = el('dialog', 'detail-dialog'); const close = button(`${t().close} ×`, () => dialog.close(), 'close');
  dialog.setAttribute('aria-labelledby', 'detail-title');
  dialog.append(close);
  if (e.image) { const img = el('img', 'detail-poster'); img.src = safeUrl(e.image, true); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => img.remove()); dialog.append(img); }
  const heading = el('h2', '', e.title); heading.id = 'detail-title'; heading.lang = 'ko';
  dialog.append(el('span', 'badge', t()[e.category]), heading);
  const dl = el('dl');
  const values = { place: el('dd', '', e.place), fee: el('dd', '', e.free ? t().free : e.fee || t().unknown), audience: el('dd', '', e.audience || t().unknown), time: el('dd', '', e.time || t().unknown) };
  dl.append(el('dt', '', t().period), el('dd', '', `${formatted(e.start)} — ${formatted(e.end)}`));
  for (const key of ['place', 'fee', 'audience', 'time'] as const) { dl.append(el('dt', '', key === 'time' ? x().time : t()[key]), values[key]); }
  const description = el('p', 'program', e.description || t().unknown); description.lang = 'ko';
  dialog.append(dl, el('h3', '', x().description), description);
  const translateStatus = el('p', 'muted'); translateStatus.setAttribute('role', 'status');
  const controller = new AbortController();
  if (locale !== 'ko') {
    let translated = initialFields, showingTranslation = true;
    const update = () => {
      const fields = showingTranslation ? translated : {};
      const display = displayEvent(e, fields);
      heading.textContent = display.title; heading.lang = fields.title !== undefined ? locale : 'ko';
      description.textContent = display.description || t().unknown; description.lang = fields.description !== undefined ? locale : 'ko';
      for (const key of ['place', 'fee', 'audience', 'time'] as const) {
        values[key].textContent = key === 'fee' && e.free ? t().free : display[key] || t().unknown;
        values[key].lang = fields[key] !== undefined || key === 'fee' && e.free ? locale : 'ko';
      }
      translate.textContent = showingTranslation ? x().original : x().translated;
      translateStatus.textContent = showingTranslation ? (translationComplete(e, fields) ? x().machine : translationCopy[locale].pending) : '';
    };
    const translate = button(x().original, () => { showingTranslation = !showingTranslation; update(); }, 'translate-button');
    update();
    dialog.append(el('p', 'muted', translationCopy[locale].notice), translate, translateStatus);
    // Reading a stored translation never consumes the provider's translation quota.
    void (async () => {
      try {
        const response = await fetch(`/api/translate?${new URLSearchParams({ id: e.id, lang: locale })}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
        const data = await response.json() as { fields?: unknown; locale?: unknown };
        if (!response.ok || data.locale !== locale || !validFields(data.fields)) throw new Error('TRANSLATION_FAILED');
        if (!controller.signal.aborted) { translated = { ...translated, ...data.fields }; update(); }
      } catch { if (!controller.signal.aborted && !Object.keys(translated).length) translateStatus.textContent = x().translationError; }
    })();
  }
  const map = el('section', 'map-panel'); map.append(el('h3', '', x().map), el('p', 'muted', x().mapHint));
  const mapActions = el('div', 'map-actions');
  for (const [key, url] of Object.entries(mapLinks(e))) { const a = el('a', 'map-link', `${x()[key as 'naver' | 'kakao' | 'google']} ↗`); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; mapActions.append(a); }
  map.append(mapActions); dialog.append(map, el('p', 'muted', translationCopy[locale].note));
  const url = safeUrl(e.url);
  if (url) { const a = el('a', 'primary', `${t().official} ↗`); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; dialog.append(a); }
  dialog.addEventListener('close', () => { controller.abort(); dialog.remove(); });
  dialog.addEventListener('click', ev => { if (ev.target === dialog) { const r = dialog.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) dialog.close(); } });
  document.body.append(dialog); dialog.showModal();
}
