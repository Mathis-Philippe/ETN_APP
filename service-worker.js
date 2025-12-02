// service-worker.js
const CACHE_NAME = 'etn-pwa-cache-v1';
const urlsToCache = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/assets/images/favicon.png',
  // Ajoutez le chemin de votre logo principal si nécessaire :
  '/assets/images/etn.png', 
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: mise en cache des assets');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error('SW Failed to cache during install:', err);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: activation réussie.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});