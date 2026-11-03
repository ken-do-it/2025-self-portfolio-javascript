import type { CultureEvent } from './events.ts';
import { coordinates } from './events.ts';
export function mapLinks(event: CultureEvent) {
  const hasCoords = Object.keys(coordinates(event.latitude, event.longitude)).length === 2;
  const query = `${event.district} ${event.place}`.trim() || '서울';
  const location = hasCoords ? `${event.latitude},${event.longitude}` : `서울 ${query}`;
  const google = new URL('https://www.google.com/maps/dir/');
  google.search = new URLSearchParams({ api: '1', destination: location, travelmode: 'transit' }).toString();
  return {
    naver: `https://map.naver.com/p/search/${encodeURIComponent(`서울 ${query}`)}`,
    kakao: hasCoords ? `https://map.kakao.com/link/to/${encodeURIComponent(event.place)},${event.latitude},${event.longitude}` : `https://map.kakao.com/link/search/${encodeURIComponent(`서울 ${query}`)}`,
    google: google.href
  };
}
