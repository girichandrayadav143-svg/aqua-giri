const CACHE_NAME = 'aqua-farming-v2-' + new Date().getTime();
const API_CACHE = 'aqua-api-cache-v2';
const STATIC_CACHE = 'aqua-static-v2';

// Core files that must be cached for app to work
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './landing.html',
  './css/styles.css',
  './css/landing.css',
  './js/app.js',
  './js/firebase-config.js',
  './js/user-management-utils.js',
  './manifest.json'
];

// Install: Cache core assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[ServiceWorker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      }),
      caches.open(API_CACHE)
    ]).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && 
              !cacheName.startsWith('aqua-farming-v2')) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const cache = caches.open(API_CACHE);
            cache.then(c => c.put(request, response.clone()));
            return response;
          }
          return caches.match(request);
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type === 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE)
            .then(cache => cache.put(request, responseToCache));
          return response;
        });
      })
      .catch(err => {
        console.log('[ServiceWorker] Fetch failed:', err);
        // Return offline page if available
        if (request.destination === 'document') {
          return caches.match('./app.html');
        }
      })
  );
});

// Background sync for offline updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(
      syncPendingLogs()
    );
  }
});

async function syncPendingLogs() {
  try {
    const db = new IndexedDB();
    const pendingLogs = await db.getPendingLogs();
    for (const log of pendingLogs) {
      const response = await fetch(log.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log.data)
      });
      if (response.ok) {
        await db.removePendingLog(log.id);
      }
    }
  } catch (err) {
    console.log('[ServiceWorker] Sync failed:', err);
  }
}

console.log('[ServiceWorker] Loaded successfully');
