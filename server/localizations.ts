import { createHash } from 'node:crypto';
import { seoulToday } from '../src/events.ts';
import type { CultureEvent } from '../src/events.ts';
import { translationFields } from '../src/translations.ts';
import type { TargetLanguage, Translation, TranslationField } from '../src/translations.ts';
import { databaseConfigured, databaseRpc } from './database.ts';
import type { Payload } from './events.ts';

export const eventKey = (id: string) => createHash('sha256').update(id).digest('hex');
export const sourceHash = (text: string, locale: TargetLanguage) => createHash('sha256').update(JSON.stringify([locale, text])).digest('hex');
export function syncArguments(payload: Payload, today = seoulToday()) {
  return {
    p_events: payload.events.map(event => ({ event_key: eventKey(event.id), payload: event })),
    p_jobs: payload.events.filter(event => event.end >= today).flatMap(event => (['en', 'ja', 'es'] as const).flatMap(locale => translationFields.map(field => {
      const text = event[field] || '';
      return { event_key: eventKey(event.id), locale, field, source_hash: sourceHash(text, locale), source_text: text,
        translated_text: /[가-힣]/.test(text) ? null : text, priority: field === 'title' ? 0 : 1 };
    }))),
    p_updated: payload.updatedAt, p_partial: payload.partial
  };
}
export function matchTranslations(events: CultureEvent[], locale: TargetLanguage, rows: unknown): { id: string; fields: Translation }[] {
  if (!Array.isArray(rows)) return [];
  const sources = new Map(events.map(event => [event.id, event]));
  const result = new Map<string, Translation>();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !translationFields.includes(row.field) || typeof row.text !== 'string' || row.text.length > 16000) continue;
    const event = sources.get(row.id), field = row.field as TranslationField;
    // A changed source field must never show its old translation, even between syncs.
    if (!event || row.source_hash !== sourceHash(event[field] || '', locale)) continue;
    const fields = result.get(row.id) || {};
    fields[field] = row.text; result.set(row.id, fields);
  }
  return [...result].map(([id, fields]) => ({ id, fields }));
}
export async function getLocalizations(events: CultureEvent[], locale: TargetLanguage) {
  if (!databaseConfigured()) return { translations: [], translationStatus: 'unavailable' as const };
  try {
    return { translations: matchTranslations(events, locale, await databaseRpc('hiken_read', { p_locale: locale })), translationStatus: 'ready' as const };
  } catch { return { translations: [], translationStatus: 'unavailable' as const }; }
}
