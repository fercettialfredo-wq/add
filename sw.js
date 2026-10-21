const CACHE_NAME = 'ravens-v4';
const assets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const CACHE_NAME = 'ravens-v4';
const assets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Responder con recursos del cache
self.addEventListener('fetch', event => {
  // 1. Ignorar esquemas que no sean HTTP/HTTPS (ej. extensiones del navegador)
  if (!event.request.url.startsWith('http')) return;

  // 2. Prevenir el conocido bug de "only-if-cached" en Chromium
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna la versión del caché si existe
      if (response) {
        return response;
      }

      // 3. Intenta descargar de la red y ATRAPA el error para evitar el colapso
      return fetch(event.request).catch(error => {
        console.error('El SW no pudo descargar:', event.request.url, error);
      });
    })
  );
});
// Instalar y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Responder con recursos del cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
