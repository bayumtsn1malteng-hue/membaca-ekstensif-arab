const CACHE_NAME = 'meb-cache-v1';
const urlsToCache = [
  'index.html',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Mengembalikan respons gagal yang valid untuk menghindari uncaught promise error
        return new Response('Network error occurred', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});