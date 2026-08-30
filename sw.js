// Cache version — increment this whenever you deploy to force all clients to get fresh files
const CACHE_VERSION = 'aqua-v5-' + '20260830';
const STATIC_CACHE = CACHE_VERSION;
const API_CACHE = 'aqua-api-v5';

// Core files to pre-cache
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './css/styles.css',
  './css/responsive-fix.css',
  './js/app.js',
  './js/firebase-config.js',
  './js/user-management-utils.js',
  './manifest.json'
];

// ── Install: pre-cache core assets ──
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())   // activate immediately, don't wait
  );
});

// ── Activate: delete ALL old caches ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())   // take control of all open tabs
  );
});

// ── Fetch: NETWORK FIRST for JS/CSS/HTML, network-only for API ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // API requests — always network only (never serve from cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // JS / CSS files — Network First (get fresh, fall back to cache if offline)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML pages — Network First
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request) || caches.match('./app.html'))
    );
    return;
  }

  // Other assets (images, fonts) — Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});

console.log('[SW] Service Worker loaded - version:', CACHE_VERSION);
