// Service Worker for PWA - Church-specific
// Cache name will be updated dynamically based on church
const CACHE_VERSION = 'v1';
let CACHE_NAME = 'church-chms-' + CACHE_VERSION;

// URLs to cache
const urlsToCache = [
  '/',
  '/dashboard',
  '/auth/signin',
  '/api/manifest', // Dynamic manifest
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current church cache
          if (cacheName !== CACHE_NAME && cacheName.startsWith('church-chms-')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // CRITICAL: Skip external API calls (AWS Cognito, etc.)
  // Only handle requests from the same origin
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    // Let external requests pass through without service worker interception
    return;
  }

  // Skip API routes that shouldn't be cached (auth, dynamic data)
  if (url.pathname.startsWith('/api/auth/') || 
      url.pathname.startsWith('/api/presentations/') ||
      url.pathname.includes('/api/') && url.pathname.includes('/upload') ||
      url.pathname.includes('/api/') && url.pathname.includes('/download')) {
    // Let these API calls pass through without caching
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Network failed, return offline page if available
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});
