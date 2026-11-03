import type { CultureEvent } from './events.ts';
import { safeUrl } from './events.ts';
import { mapLinks } from './maps.ts';
import { messages } from './i18n.ts';
import type { Locale } from './i18n.ts';
import { extra } from './enhancements-i18n.ts';
import { el, button } from './dom.ts';
import { formatEventDate } from './format.ts';

export function showEventDetail(e: CultureEvent, locale: Locale) {
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
  if (locale !== 'ko') {
    let translated: Record<string, string> | undefined, showingTranslation = false;
    const targetLocale = locale;
    const translate = button(x().translate, () => { void (async () => {
      translate.disabled = true; translateStatus.textContent = x().translating;
      try {
        if (!translated) {
          const response = await fetch(`/api/translate?${new URLSearchParams({ id: e.id, lang: targetLocale })}`, { signal: AbortSignal.timeout(55_000) });
          const data = await response.json() as { fields?: Record<string, unknown>; error?: string };
          if (!response.ok) throw new Error(data.error || 'TRANSLATION_FAILED');
          if (!data.fields || !['title', 'place', 'description', 'fee', 'audience', 'time'].every(key => typeof data.fields?.[key] === 'string')) throw new Error('TRANSLATION_FAILED');
          translated = data.fields as Record<string, string>;
        }
        showingTranslation = !showingTranslation;
        const fields = showingTranslation ? translated : e;
        heading.textContent = fields.title || e.title; heading.lang = showingTranslation ? targetLocale : 'ko';
        description.textContent = fields.description || t().unknown; description.lang = heading.lang;
        for (const key of ['place', 'fee', 'audience', 'time'] as const) { values[key].textContent = key === 'fee' && e.free ? t().free : fields[key] || t().unknown; values[key].lang = heading.lang; }
        translate.textContent = showingTranslation ? x().original : x().translated;
        translateStatus.textContent = showingTranslation ? x().machine : '';
      } catch (err) { translateStatus.textContent = err instanceof Error && err.message === 'TRANSLATION_LIMIT' ? x().limit : x().translationError; }
      finally { translate.disabled = false; }
    })(); }, 'translate-button');
    dialog.append(el('p', 'muted', x().translationNotice), translate, translateStatus);
  }
  const map = el('section', 'map-panel'); map.append(el('h3', '', x().map), el('p', 'muted', x().mapHint));
  const mapActions = el('div', 'map-actions');
  for (const [key, url] of Object.entries(mapLinks(e))) { const a = el('a', 'map-link', `${x()[key as 'naver' | 'kakao' | 'google']} ↗`); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; mapActions.append(a); }
  map.append(mapActions); dialog.append(map, el('p', 'muted', x().note));
  const url = safeUrl(e.url);
  if (url) { const a = el('a', 'primary', `${t().official} ↗`); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; dialog.append(a); }
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', ev => { if (ev.target === dialog) { const r = dialog.getBoundingClientRect(); if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) dialog.close(); } });
  document.body.append(dialog); dialog.showModal();
}
