import type { CultureEvent } from './events.ts';
import type { Locale } from './i18n.ts';

export const translationFields = ['title', 'place', 'description', 'fee', 'audience', 'time'] as const;
export type TranslationField = typeof translationFields[number];
export type Translation = Partial<Record<TranslationField, string>>;
export type TranslationMap = Map<string, Translation>;
export type TargetLanguage = Exclude<Locale, 'ko'>;
export function isTargetLanguage(value: unknown): value is TargetLanguage {
  return value === 'en' || value === 'ja' || value === 'es';
}
export function validFields(value: unknown): value is Translation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, text]) => translationFields.includes(key as TranslationField) && typeof text === 'string' && text.length <= 16000);
}
export function readTranslations(value: unknown): TranslationMap {
  const result: TranslationMap = new Map();
  if (!Array.isArray(value) || value.length > 30000) return result;
  for (const row of value) {
    if (row && typeof row.id === 'string' && validFields(row.fields)) result.set(row.id, row.fields);
  }
  return result;
}
export function displayEvent(event: CultureEvent, fields?: Translation): CultureEvent {
  return { ...event, ...fields };
}
export function translationComplete(event: CultureEvent, fields: Translation = {}): boolean {
  return translationFields.every(key => !/[가-힣]/.test(event[key] || '') || typeof fields[key] === 'string');
}
export const translationCopy = {
  ko: { pending: '번역 준비 중 · 아직 번역되지 않은 내용은 한국어로 표시됩니다.', coverage: '번역은 순차적으로 추가됩니다. 검색은 현재 저장된 번역과 한국어 원문을 함께 찾습니다.', notice: '공개 행사 내용은 자동 번역을 위해 MyMemory로 전송되고 Supabase에 저장됩니다. 기계번역은 부정확할 수 있습니다.', privacy: '관심 행사·언어·최근 조회 데이터는 이 브라우저에 보관됩니다. 공개 행사 원문과 번역은 Supabase에 저장하며, 공개 행사 텍스트만 MyMemory로 전송합니다.', note: '서울시 공개 행사 정보입니다. 번역은 순차적으로 제공됩니다. 일정과 요금은 주최 측 원문을 확인하세요.' },
  en: { pending: 'Translation pending · Untranslated content appears in Korean.', coverage: 'Translations are added gradually. Search includes available translations and Korean originals.', notice: 'Public event text is automatically sent to MyMemory for translation and stored in Supabase. Machine translations may be inaccurate.', privacy: 'Saved events, language and recent data stay in this browser. Public event originals and translations are stored in Supabase. Only public event text is sent to MyMemory.', note: 'Public event information from Seoul. Translations are added gradually. Confirm dates and prices with the organizer.' },
  ja: { pending: '翻訳準備中 · 未翻訳の内容は韓国語で表示されます。', coverage: '翻訳は順次追加されます。保存済みの翻訳と韓国語原文の両方を検索できます。', notice: '公開イベント情報は自動翻訳のためMyMemoryに送信され、Supabaseに保存されます。機械翻訳には誤りがある場合があります。', privacy: '保存イベント・言語・最近のデータはこのブラウザーに保存されます。公開イベントの原文と翻訳はSupabaseに保存され、公開テキストのみMyMemoryに送信されます。', note: 'ソウル市の公開イベント情報です。翻訳は順次追加されます。日程・料金は主催者の原文をご確認ください。' },
  es: { pending: 'Traducción pendiente · El contenido sin traducir aparece en coreano.', coverage: 'Las traducciones se añaden gradualmente. La búsqueda incluye las traducciones disponibles y los originales en coreano.', notice: 'El texto público de los eventos se envía automáticamente a MyMemory para traducirlo y se guarda en Supabase. La traducción automática puede contener errores.', privacy: 'Los eventos guardados, el idioma y los datos recientes se guardan en este navegador. Los originales públicos y sus traducciones se guardan en Supabase. Solo se envía texto público de eventos a MyMemory.', note: 'Información pública de eventos de Seúl. Las traducciones se añaden gradualmente. Confirma fechas y precios con el organizador.' }
} as const;
