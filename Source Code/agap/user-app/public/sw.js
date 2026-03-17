const CACHE_NAME = 'rescuenow-v1';
const ASSETS_TO_CACHE = [
  '/rescue',
  '/manifest.json',
  '/icons/icon.svg',
  '/', // root usually redirects or serves something
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: cache first, fall back to network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/rescue').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Static assets: cache first
  if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // API calls: network first (though we don't have real API calls here)
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
