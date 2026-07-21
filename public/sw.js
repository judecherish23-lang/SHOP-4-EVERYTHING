const CACHE_NAME = 'shop4everything-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// A basic fetch handler is strictly required by browsers to trigger the Install prompt
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline'))
  );
});