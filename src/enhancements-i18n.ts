import type { Locale } from './i18n.ts';
const ko = {
  invalidData: '원본 데이터 중 날짜가 잘못되었거나 중복된 항목은 제외했습니다.',
  featured: '이런 문화, 어때요?', edition: '서울의 오늘을 발견하는 문화 가이드', browse: '나에게 맞는 행사 찾기',
  hero: '익숙한 서울,\n새로운 취향.', intro: '전시 한 편, 공연 한 장면.\n오늘의 서울을 당신만의 순간으로 채워보세요.',
  live: '서울시 문화행사', upcoming: '지금 만날 수 있는 문화', districts: '서울의 동네', freeEvents: '부담 없이 즐기는 무료 행사',
  description: '프로그램 소개', time: '운영 시간', map: '지도 · 길찾기', naver: '네이버 지도', kakao: '카카오 길찾기', google: 'Google 길찾기',
  mapHint: '지도에서 장소와 경로를 확인하세요. 현재 위치는 이 사이트에서 수집하지 않습니다.',
  translate: '본문 번역', original: '한국어 원문 보기', translated: '번역 보기', translating: '번역 중…',
  translationNotice: '번역을 요청하면 공개된 행사 내용이 MyMemory에 전송됩니다. 기계번역은 부정확할 수 있습니다.',
  machine: 'MyMemory 기계번역 · 일정과 요금은 원문을 확인하세요.', translationError: '지금은 번역할 수 없습니다. 원문을 확인하거나 잠시 후 다시 시도해 주세요.',
  limit: '오늘의 번역 사용 한도에 도달했습니다. 원문은 계속 볼 수 있습니다.',
  stale: '갱신이 지연되어 마지막으로 저장한 행사 정보를 보여드리고 있어요.', refresh: '새로고침', offline: '연결이 끊겨 이 브라우저에 저장된 정보를 보여드리고 있어요.',
  sort: '정렬', ending: '마감 임박순', starting: '시작일순', newest: '늦은 시작일순', sourceNote: '서울시 공식 데이터 · 6시간마다 확인',
  note: '행사 정보는 서울시 제공 원문입니다. 번역은 상세 화면에서 요청할 수 있습니다. 방문 전 일정과 요금을 주최 측에 확인하세요.',
  privacy: '관심 행사·언어·최근 조회 데이터는 이 브라우저에 보관됩니다. 번역 요청 시 공개 행사 내용만 MyMemory로 전달됩니다.',
  saveLimit: '관심 행사는 최대 500개까지 저장할 수 있습니다.'
};
type Copy = { [K in keyof typeof ko]: string };
export const extra: Record<Locale, Copy> = {
  ko,
  en: {
    invalidData: 'Source entries with invalid dates or duplicate content have been excluded.',
    featured: 'A little inspiration', edition: 'Your field guide to culture in Seoul', browse: 'Find your next experience', hero: 'Familiar city.\nNew discoveries.', intro: 'An exhibition. A performance. A moment.\nMake a little of Seoul your own.',
    live: 'Seoul cultural events', upcoming: 'Experiences to discover', districts: 'Seoul neighborhoods', freeEvents: 'Culture, free to explore', description: 'About the program', time: 'Opening times', map: 'Maps & directions', naver: 'Naver Map', kakao: 'Kakao directions', google: 'Google directions', mapHint: 'Confirm the venue and route on the map. This site does not collect your current location.',
    translate: 'Translate details', original: 'Show Korean original', translated: 'Show translation', translating: 'Translating…', translationNotice: 'Requesting a translation sends public event text to MyMemory. Machine translations may be inaccurate.', machine: 'Machine translation by MyMemory · Verify dates and prices in the original.', translationError: 'Translation is unavailable. Read the original or try again later.', limit: 'The daily translation limit has been reached. The original is still available.',
    stale: 'Updates are delayed. Showing the last saved event information.', refresh: 'Refresh', offline: 'You are offline. Showing information saved in this browser.', sort: 'Sort', ending: 'Ending soon', starting: 'Start date', newest: 'Latest start date', sourceNote: 'Official Seoul data · checked every 6 hours', note: 'Original event information is provided by Seoul. Request a translation in the details. Confirm dates and prices with the organizer.', privacy: 'Saved events, language and recent data stay in this browser. Translation requests send only public event content to MyMemory.', saveLimit: 'You can save up to 500 events.'
  },
  ja: {
    invalidData: '日付が不正な項目や重複する項目は除外しています。',
    featured: 'こんな文化はいかが？', edition: 'ソウルの今日を見つける文化ガイド', browse: '自分に合うイベントを探す', hero: 'いつものソウル、\n新しい発見。', intro: 'ひとつの展示、ひとつの公演。\n今日のソウルを、あなただけの思い出に。', live: 'ソウルの文化イベント', upcoming: '今出会える文化', districts: 'ソウルの街', freeEvents: '無料で楽しむ文化', description: 'プログラム紹介', time: '開催時間', map: '地図・アクセス', naver: 'NAVER地図', kakao: 'Kakao経路案内', google: 'Google経路案内', mapHint: '地図で場所と経路をご確認ください。このサイトでは現在地を収集しません。',
    translate: '本文を翻訳', original: '韓国語原文を見る', translated: '翻訳を見る', translating: '翻訳中…', translationNotice: '翻訳を依頼すると、公開イベント情報がMyMemoryに送信されます。機械翻訳には誤りがある場合があります。', machine: 'MyMemory機械翻訳 · 日程と料金は原文をご確認ください。', translationError: '現在翻訳できません。原文をご確認いただくか、後ほどお試しください。', limit: '本日の翻訳上限に達しました。原文は引き続き閲覧できます。', stale: '更新が遅れているため、最後に保存した情報を表示しています。', refresh: '更新', offline: 'オフラインのため、このブラウザーに保存された情報を表示しています。', sort: '並べ替え', ending: '終了が近い順', starting: '開始日順', newest: '開始日が遅い順', sourceNote: 'ソウル市公式データ · 6時間ごとに確認', note: 'ソウル市提供の原文です。詳細画面で翻訳を依頼できます。訪問前に日程・料金を主催者にご確認ください。', privacy: '保存イベント・言語・最近のデータはこのブラウザーに保存されます。翻訳時は公開イベント情報のみMyMemoryに送信されます。', saveLimit: '保存できるイベントは500件までです。'
  },
  es: {
    invalidData: 'Se excluyeron entradas duplicadas o con fechas no válidas.',
    featured: 'Un poco de inspiración', edition: 'Tu guía para descubrir la cultura de Seúl', browse: 'Encuentra tu próxima experiencia', hero: 'La misma ciudad.\nNuevos descubrimientos.', intro: 'Una exposición. Un espectáculo. Un instante.\nHaz tuyo un pedacito de Seúl.', live: 'Eventos culturales de Seúl', upcoming: 'Experiencias por descubrir', districts: 'Barrios de Seúl', freeEvents: 'Cultura para disfrutar gratis', description: 'Sobre el programa', time: 'Horario', map: 'Mapas e indicaciones', naver: 'Naver Map', kakao: 'Indicaciones de Kakao', google: 'Indicaciones de Google', mapHint: 'Confirma el lugar y la ruta en el mapa. Este sitio no recopila tu ubicación actual.',
    translate: 'Traducir detalles', original: 'Ver original en coreano', translated: 'Ver traducción', translating: 'Traduciendo…', translationNotice: 'Al solicitar una traducción se envía el texto público del evento a MyMemory. La traducción automática puede contener errores.', machine: 'Traducción automática de MyMemory · Verifica fechas y precios en el original.', translationError: 'La traducción no está disponible. Consulta el original o inténtalo más tarde.', limit: 'Se alcanzó el límite diario de traducción. El original sigue disponible.', stale: 'Las actualizaciones se retrasan. Se muestran los últimos datos guardados.', refresh: 'Actualizar', offline: 'Sin conexión. Se muestran los datos guardados en este navegador.', sort: 'Orden', ending: 'Terminan pronto', starting: 'Fecha de inicio', newest: 'Inicio más reciente', sourceNote: 'Datos oficiales de Seúl · consulta cada 6 horas', note: 'Información original proporcionada por Seúl. Puedes solicitar una traducción en los detalles. Confirma fechas y precios con el organizador.', privacy: 'Los eventos guardados, el idioma y los datos recientes se guardan en este navegador. Las traducciones envían solo contenido público del evento a MyMemory.', saveLimit: 'Puedes guardar hasta 500 eventos.'
  }
};
