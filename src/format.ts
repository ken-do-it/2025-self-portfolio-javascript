import type { Locale } from './i18n.ts';

export function formatEventDate(key: string, locale: Locale, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Asia/Seoul' }).format(new Date(`${key}T00:00:00+09:00`));
}
