// Минимален service worker - само за да апката е инсталабилна (PWA).
// Не прави offline кеширање на податоци, бидејќи апката секогаш бара интернет за Google Sheets.

const CACHE_NAME = 'kitchen-log-shell-v1';
const SHELL_FILES = [
  './index.html',
  './entry.html',
  './view.html',
  './css/style.css',
  './js/config.js',
  './js/api.js',
  './js/session.js',
  './js/login.js',
  './js/entry.js',
  './js/view.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first за HTML/JS (секогаш свежо), fallback на кеш ако нема интернет
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // не допирај повици кон Apps Script

  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
