import { getEvents } from './events.ts';
import { getLocalizations } from './localizations.ts';
import { seoulToday } from '../src/events.ts';
import type { CultureEvent } from '../src/events.ts';
import { translationFields, readTranslations } from '../src/translations.ts';
import type { TranslationMap } from '../src/translations.ts';

export function coverage(events: CultureEvent[], translations: TranslationMap, today = seoulToday()) {
  const current = events.filter(event => event.end >= today);
  const title = { done: 0, total: 0 }, details = { done: 0, total: 0 };
  let completeEvents = 0;
  for (const event of current) {
    let complete = true;
    for (const field of translationFields) {
      if (!/[가-힣]/.test(event[field] || '')) continue;
      const count = field === 'title' ? title : details;
      count.total++;
      if (translations.get(event.id)?.[field] !== undefined) count.done++;
      else complete = false;
    }
    if (complete) completeEvents++;
  }
  return { events: current.length, completeEvents, title, details };
}
export function nextSchedule(now = new Date()) {
  const next = new Date(now); next.setUTCHours(1, 15, 0, 0);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}
export async function translationStatus() {
  const payload = await getEvents();
  const languages = await Promise.all((['en', 'ja', 'es'] as const).map(async locale => {
    const localized = await getLocalizations(payload.events, locale);
    if (localized.translationStatus !== 'ready') throw new Error('STATUS_UNAVAILABLE');
    return { locale, ...coverage(payload.events, readTranslations(localized.translations)) };
  }));
  return { languages, checkedAt: new Date().toISOString(), sourceUpdatedAt: payload.updatedAt, stale: payload.stale, nextScheduledAt: nextSchedule() };
}
