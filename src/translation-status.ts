import { el, button } from './dom.ts';
import type { Locale } from './i18n.ts';
import type { translationStatus } from '../server/translation-status.ts';
type Status = Awaited<ReturnType<typeof translationStatus>>;
const copy = {
  ko: { heading: '자동 번역 현황', intro: '진행·예정 행사 기준 · 한국어는 원문입니다.', schedule: '매일 10:15 KST 예약 · 무료 플랜은 실행 시간이 달라질 수 있습니다.', next: '다음 예약', checked: '현황 확인', title: '제목', details: '상세 항목', done: '완료', pending: '대기', complete: '전체 항목 준비된 행사', note: '상세 항목은 장소·설명·요금·대상·시간입니다. 빈 항목과 번역이 필요 없는 내용은 제외합니다. 새 행사와 원문 변경에 따라 수치가 달라집니다. 하루 4,500자 한도 내에서 순차 처리합니다.', refresh: '현황 새로고침', loading: '현황 확인 중…', error: '현황을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.', stale: '이전 행사 데이터 기준입니다.' },
  en: { heading: 'Translation progress', intro: 'Current and upcoming events · Korean is the original.', schedule: 'Scheduled daily at 10:15 KST · Timing may vary on the free plan.', next: 'Next scheduled run', checked: 'Checked', title: 'Titles', details: 'Detail fields', done: 'ready', pending: 'pending', complete: 'Events with all fields ready', note: 'Details include venue, description, fee, audience and time. Empty fields and text that needs no translation are excluded. New events and source changes affect these counts. Translations are processed within a daily 4,500-character limit.', refresh: 'Refresh progress', loading: 'Checking progress…', error: 'Progress is unavailable. Please try again shortly.', stale: 'Based on an older event snapshot.' },
  ja: { heading: '自動翻訳の進捗', intro: '開催中・開催予定のイベントが対象です。原文は韓国語です。', schedule: '毎日10:15（韓国時間）に実行予定。無料プランでは時刻が前後する場合があります。', next: '次回の実行予定', checked: '確認日時', title: 'タイトル', details: '詳細項目', done: '完了', pending: '待機中', complete: '全項目が準備できたイベント', note: '詳細項目は会場・説明・料金・対象・時間です。空欄や翻訳不要の項目は除外します。新規イベントや原文の変更により件数が変わります。1日4,500文字の上限内で順次翻訳します。', refresh: '進捗を更新', loading: '確認中…', error: '進捗を取得できませんでした。しばらくしてから再試行してください。', stale: '以前のイベントデータに基づく情報です。' },
  es: { heading: 'Progreso de traducción', intro: 'Eventos actuales y próximos · El original está en coreano.', schedule: 'Programado cada día a las 10:15 KST · El horario puede variar con el plan gratuito.', next: 'Próxima ejecución programada', checked: 'Consultado', title: 'Títulos', details: 'Campos de detalle', done: 'listos', pending: 'pendientes', complete: 'Eventos con todos los campos listos', note: 'Los detalles incluyen lugar, descripción, precio, público y horario. Se excluyen los campos vacíos y el texto que no necesita traducción. Las cifras cambian al añadir eventos o modificar el original. Se procesan hasta 4.500 caracteres al día.', refresh: 'Actualizar progreso', loading: 'Consultando…', error: 'No se pudo consultar el progreso. Inténtalo de nuevo más tarde.', stale: 'Basado en datos anteriores de eventos.' }
};
let cached: Status | undefined;
let expanded = false;
export function translationStatusPanel(locale: Locale) {
  const c = copy[locale], panel = el('details', 'translation-status');
  panel.open = expanded;
  panel.append(el('summary', '', c.heading), el('p', '', c.schedule));
  const body = el('div'); panel.append(body);
  let busy = false;
  const date = (value: string) => new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(value)) + ' KST';
  function show(data: Status) {
    body.replaceChildren(el('p', '', c.intro), el('p', '', `${c.next}: ${date(data.nextScheduledAt)}`));
    if (data.stale) body.append(el('p', 'notice', c.stale));
    const grid = el('div', 'translation-status-grid');
    for (const row of data.languages) {
      const item = el('section'); item.append(el('h3', '', { en: 'English', ja: '日本語', es: 'Español' }[row.locale]));
      for (const [name, count] of [[c.title, row.title], [c.details, row.details]] as const) {
        item.append(el('p', '', `${name} · ${c.done} ${count.done.toLocaleString(locale)} / ${c.pending} ${(count.total - count.done).toLocaleString(locale)}`));
        const progress = el('progress'); progress.max = Math.max(1, count.total); progress.value = count.done;
        progress.setAttribute('aria-label', `${name}: ${count.done} / ${count.total}`); item.append(progress);
      }
      item.append(el('p', 'muted', `${c.complete}: ${row.completeEvents} / ${row.events}`)); grid.append(item);
    }
    body.append(grid, el('p', 'muted', c.note), el('p', 'muted', `${c.checked}: ${date(data.checkedAt)}`), button(c.refresh, () => void refresh()));
  }
  async function refresh() {
    if (busy) return; busy = true;
    body.replaceChildren(el('p', '', c.loading)); body.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/translationStatus', { signal: AbortSignal.timeout(55_000), cache: 'no-cache' });
      if (!response.ok) throw new Error();
      const data = await response.json() as Status;
      cached = data; show(data);
    } catch { body.replaceChildren(el('p', '', c.error), button(c.refresh, () => void refresh())); }
    finally { busy = false; body.setAttribute('aria-busy', 'false'); }
  }
  panel.addEventListener('toggle', () => {
    if (!panel.isConnected) return;
    expanded = panel.open;
    if (!panel.open) return;
    if (cached && Date.now() - Date.parse(cached.checkedAt) < 60_000) show(cached);
    else void refresh();
  });
  return panel;
}
