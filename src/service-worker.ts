/// <reference lib="webworker" />
const worker = globalThis as unknown as ServiceWorkerGlobalScope;
declare const BUILD_ID: string;
const CACHE = 'hiken-shell-' + BUILD_ID;
const assets = ['/', '/main.js', '/style.css', '/favicon-32x32.png'];
worker.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets)).then(() => worker.skipWaiting()));
});
worker.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('hiken-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => worker.clients.claim()));
});
worker.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== worker.location.origin || !assets.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(url.pathname) || new Response('Offline', { status: 503 });
  }));
});
