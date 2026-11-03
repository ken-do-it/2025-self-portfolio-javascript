export const ko = {
  brand: '서울문화산책', tagline: '일상에 문화를 더하다', explore: '문화행사 찾기', saved: '저장한 행사',
  eyebrow: 'SEOUL CULTURE GUIDE', hero: '오늘, 서울에서\n어떤 문화를 만날까요?', intro: '가까운 전시부터 설레는 공연까지.\n나만의 속도로 서울의 문화를 발견하세요.',
  search: '행사명, 장소, 지역으로 검색', searchButton: '검색', all: '전체', exhibition: '전시', performance: '공연', festival: '축제·체험',
  ongoing: '오늘 진행 중', free: '무료', district: '모든 지역', date: '날짜 선택', reset: '필터 초기화',
  results: '발견한 문화행사', count: '개 행사', list: '목록', calendar: '달력', loading: '서울의 문화 소식을 불러오고 있어요.',
  empty: '조건에 맞는 행사가 없어요.', emptyHint: '다른 날짜나 검색어로 다시 찾아보세요.', error: '문화행사를 불러오지 못했어요.', retry: '다시 시도',
  config: '서버의 서울 열린데이터 API 설정이 필요합니다.', detail: '행사 자세히 보기', official: '공식 홈페이지', close: '닫기',
  save: '관심 행사 저장', unsave: '저장 취소', fee: '이용 요금', audience: '관람 대상', place: '장소', period: '행사 기간', unknown: '주최 측에 확인',
  previous: '이전', next: '다음', today: '오늘', source: '서울 열린데이터광장 제공', note: '행사명·장소·상세 설명은 제공기관의 한국어 원문입니다. 일정은 주최 측에서 다시 확인해 주세요.',
  footer: '서울의 일상에, 문화 한 조각.', privacy: '저장한 행사와 언어 설정은 이 브라우저에만 보관됩니다.',
  updated: '업데이트', paid: '유료·요금 확인', language: '언어', calendarHint: '날짜를 선택하면 해당 날짜에 진행되는 행사를 볼 수 있어요.', page: '페이지', storage: '브라우저 저장소를 사용할 수 없어 현재 화면에서만 유지됩니다.',
  transport: '보안 연결을 지원하는 데이터 중계 서버 또는 HTTP 사용 설정이 필요합니다.', partial: '일부 데이터만 수신했습니다. 전체 행사가 표시되지 않을 수 있습니다.'
};
export type Messages = { [K in keyof typeof ko]: string };
export type Locale = 'ko' | 'en' | 'ja' | 'es';
const en: Messages = {
  brand: 'Seoul Culture Walk', tagline: 'A little culture, every day', explore: 'Explore events', saved: 'Saved events', eyebrow: 'SEOUL CULTURE GUIDE',
  hero: 'What will you discover\nin Seoul today?', intro: 'From neighborhood exhibitions to inspiring performances.\nExplore Seoul’s culture at your own pace.',
  search: 'Search events, venues or districts', searchButton: 'Search', all: 'All', exhibition: 'Exhibitions', performance: 'Performances', festival: 'Festivals & activities',
  ongoing: 'On today', free: 'Free', district: 'All districts', date: 'Choose a date', reset: 'Reset filters', results: 'Discover cultural events', count: 'events', list: 'List', calendar: 'Calendar',
  loading: 'Finding culture in Seoul…', empty: 'No matching events.', emptyHint: 'Try another date or search term.', error: 'We couldn’t load events.', retry: 'Try again',
  config: 'The Seoul Open Data API needs to be configured on the server.', detail: 'View event details', official: 'Official website', close: 'Close', save: 'Save event', unsave: 'Remove saved event',
  fee: 'Admission', audience: 'Audience', place: 'Venue', period: 'Dates', unknown: 'Check with organizer', previous: 'Previous', next: 'Next', today: 'Today', source: 'Data from Seoul Open Data Plaza',
  note: 'Event names, venues and descriptions are provided in the original Korean. Confirm schedules with the organizer.', footer: 'A little culture in your Seoul day.',
  privacy: 'Saved events and your language preference stay in this browser only.', updated: 'Updated', paid: 'Paid / check price', language: 'Language', calendarHint: 'Select a date to find events taking place that day.', page: 'Page', storage: 'Browser storage is unavailable. Changes last only for this visit.',
  transport: 'A secure data relay or an explicit HTTP setting is required.', partial: 'Only part of the data was received. Some events may be missing.'
};
const ja: Messages = {
  brand: 'ソウル文化散歩', tagline: '日常に文化を添えて', explore: 'イベントを探す', saved: '保存したイベント', eyebrow: 'SEOUL CULTURE GUIDE',
  hero: '今日、ソウルで\nどんな文化に出会う？', intro: '身近な展示から心躍る公演まで。\n自分のペースでソウルの文化を楽しもう。',
  search: 'イベント名・会場・地域で検索', searchButton: '検索', all: 'すべて', exhibition: '展示', performance: '公演', festival: 'お祭り・体験', ongoing: '本日開催', free: '無料', district: 'すべての地域', date: '日付を選択', reset: '条件をリセット',
  results: '文化イベントを発見', count: '件', list: '一覧', calendar: 'カレンダー', loading: 'ソウルの文化情報を読み込み中…', empty: '該当するイベントはありません。', emptyHint: '別の日付やキーワードで検索してください。', error: 'イベントを読み込めませんでした。', retry: '再試行',
  config: 'サーバーにソウル公開データAPIの設定が必要です。', detail: 'イベントの詳細', official: '公式サイト', close: '閉じる', save: 'イベントを保存', unsave: '保存を解除', fee: '料金', audience: '対象', place: '会場', period: '開催期間', unknown: '主催者にご確認ください', previous: '前へ', next: '次へ', today: '今日', source: 'ソウル公開データ広場提供',
  note: 'イベント名・会場・説明は提供元の韓国語原文です。日程は主催者にご確認ください。', footer: 'ソウルの日常に、文化をひとつ。', privacy: '保存したイベントと言語設定はこのブラウザーにのみ保存されます。', updated: '更新', paid: '有料・料金確認', language: '言語', calendarHint: '日付を選ぶと、その日に開催中のイベントが表示されます。', page: 'ページ', storage: 'ブラウザーに保存できません。今回の閲覧中のみ保持されます。',
  transport: '安全なデータ中継サーバー、またはHTTPの明示的な設定が必要です。', partial: '一部のデータのみ受信しました。表示されないイベントがある場合があります。'
};
const es: Messages = {
  brand: 'Paseo cultural por Seúl', tagline: 'Cultura para cada día', explore: 'Explorar eventos', saved: 'Eventos guardados', eyebrow: 'SEOUL CULTURE GUIDE', hero: '¿Qué descubrirás\nhoy en Seúl?', intro: 'Desde exposiciones cercanas hasta espectáculos inspiradores.\nDescubre la cultura de Seúl a tu ritmo.',
  search: 'Buscar eventos, lugares o distritos', searchButton: 'Buscar', all: 'Todos', exhibition: 'Exposiciones', performance: 'Espectáculos', festival: 'Festivales y actividades', ongoing: 'Hoy', free: 'Gratis', district: 'Todos los distritos', date: 'Elegir fecha', reset: 'Restablecer filtros', results: 'Descubre eventos culturales', count: 'eventos', list: 'Lista', calendar: 'Calendario',
  loading: 'Buscando cultura en Seúl…', empty: 'No hay eventos coincidentes.', emptyHint: 'Prueba otra fecha o búsqueda.', error: 'No se pudieron cargar los eventos.', retry: 'Reintentar', config: 'Configura la API de datos de Seúl en el servidor.', detail: 'Ver detalles', official: 'Sitio oficial', close: 'Cerrar', save: 'Guardar evento', unsave: 'Quitar de guardados', fee: 'Entrada', audience: 'Público', place: 'Lugar', period: 'Fechas', unknown: 'Consultar con el organizador', previous: 'Anterior', next: 'Siguiente', today: 'Hoy', source: 'Datos de Seoul Open Data Plaza',
  note: 'Los nombres, lugares y descripciones se ofrecen en el coreano original. Confirma las fechas con el organizador.', footer: 'Un poco de cultura en tu día en Seúl.', privacy: 'Los eventos guardados y el idioma se almacenan solo en este navegador.', updated: 'Actualizado', paid: 'De pago / consultar precio', language: 'Idioma', calendarHint: 'Elige una fecha para ver los eventos de ese día.', page: 'Página', storage: 'El almacenamiento no está disponible. Los cambios duran solo esta visita.',
  transport: 'Se requiere un intermediario de datos seguro o habilitar HTTP expresamente.', partial: 'Solo se recibió parte de los datos. Pueden faltar algunos eventos.'
};
export const messages: Record<Locale, Messages> = { ko, en, ja, es };
export const locales: Locale[] = ['ko', 'en', 'ja', 'es'];
