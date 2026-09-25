// ExamPro Service Worker
const CACHE_NAME = 'exampro-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install (shell)
const PRECACHE_URLS = [
  '/',
  '/login',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ============================================
// INSTALL — cache the app shell
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore failures on individual assets
      });
    })
  );
  self.skipWaiting();
});

// ============================================
// ACTIVATE — clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ============================================
// FETCH — network-first for API, cache-first for assets
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, DELETE go straight to network)
  if (request.method !== 'GET') return;

  // Skip Supabase API calls — always network
  if (url.hostname.includes('supabase.co')) return;

  // Skip Firebase / external
  if (!url.origin.includes(self.location.origin)) return;

  // For navigation requests (page loads) — network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache fresh page
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // For static assets — cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache JS/CSS/images
        if (
          response.ok &&
          (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/) ||
            url.pathname.startsWith('/assets/'))
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

// ============================================
// MESSAGE — allow skipping waiting from client
// ============================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});