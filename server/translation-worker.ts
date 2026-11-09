import { databaseRpc } from './database.ts';
import { getEvents } from './events.ts';
import { syncArguments } from './localizations.ts';
import { translateText } from './translate.ts';
import { ApiError } from './http.ts';
import { isTargetLanguage, translationFields } from '../src/translations.ts';
import type { TargetLanguage, TranslationField } from '../src/translations.ts';

interface Job { event_key: string; locale: TargetLanguage; field: TranslationField; source_hash: string; source_text: string; lease: string; day: string; }
function validJob(value: unknown): value is Job {
  if (!value || typeof value !== 'object') return false;
  const j = value as Record<string, unknown>;
  return isTargetLanguage(j.locale) && translationFields.includes(j.field as TranslationField)
    && ['event_key', 'source_hash', 'source_text', 'lease', 'day'].every(k => typeof j[k] === 'string')
    && String(j.source_text).length <= 4000;
}
export async function runTranslationWorker(deps = { rpc: databaseRpc, getEvents, translate: translateText, now: Date.now }, duration = 240_000) {
  const start = deps.now();
  const payload = await deps.getEvents();
  // Do not let a stale fallback delete records or enqueue outdated source text.
  if (!payload.stale) await deps.rpc('hiken_sync', syncArguments(payload));
  let completed = 0, failed = 0, limited = false;
  let stopped = false;
  async function lane() {
    while (!stopped && !limited && failed < 3 && deps.now() - start < duration - 40_000) {
      const job = await deps.rpc('hiken_claim');
      if (job === null) break;
      if (!validJob(job)) throw new ApiError(502, 'INVALID_TRANSLATION_JOB');
      let text: string | null = null;
      try { text = await deps.translate(job.source_text, job.locale); }
      catch (error) { failed++; limited ||= error instanceof ApiError && error.code === 'TRANSLATION_LIMIT'; }
      const saved = await deps.rpc('hiken_finish', {
        p_event_key: job.event_key, p_locale: job.locale, p_field: job.field, p_source_hash: job.source_hash,
        p_lease: job.lease, p_day: job.day, p_text: text, p_exhausted: limited
      });
      if (text !== null && saved === true) completed++;
      if (limited || failed >= 3) break;
    }
  }
  // Wait for every in-flight reservation to finish, including when one lane fails.
  const results = await Promise.allSettled(Array.from({ length: 3 }, async () => {
    try { await lane(); } catch (error) { stopped = true; throw error; }
  }));
  const rejected = results.find(result => result.status === 'rejected');
  if (rejected?.status === 'rejected') throw rejected.reason;
  return { completed, failed, limited, updatedAt: payload.updatedAt };
}
