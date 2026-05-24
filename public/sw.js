const CACHE_NAME = 'rasyatech-static-v2';
const RUNTIME_CACHE = 'rasyatech-runtime-v2';

const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell');
      return cache.addAll(ASSETS_TO_PRECACHE).catch(err => {
        console.error('[Service Worker] Pre-cache failed, caching individually:', err);
        return Promise.all(
          ASSETS_TO_PRECACHE.map(url => {
            return cache.add(url).catch(e => {
              console.error(`[Service Worker] Failed to cache asset: ${url}`, e);
            });
          })
        );
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const cacheKeepList = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (!cacheKeepList.includes(key)) {
          console.log('[Service Worker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Ignore non-local API requests and local server-side API endpoints (/api/*)
  if (
    url.origin.includes('supabase.co') || 
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('tawk.to')
  ) {
    return;
  }

  // 3. Navigation requests: Network-First falling back to cached Index HTML (SPA Shell)
  const isNavigation = request.mode === 'navigate' || 
                       (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/').then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 4. Local asset files (JS, CSS, images, JSON, fonts, etc.): Cache-First, fallback to network
  const isSameOrigin = url.origin === self.location.origin;
  
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        }).catch((err) => {
          console.error('[Service Worker] Fetch of asset failed:', url.pathname, err);
          return new Response('Asset not available offline', { status: 404 });
        });
      })
    );
  }
});
