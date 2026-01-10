
const CACHE_NAME = 'bmu-inventory-v2';

// List of files that make up the "app shell"
const assetsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/idb.js',
    '/manifest.json',
    '/bmulogo.png',
    '/icons/92.png',
    '/icons/128.png',
    '/icons/192.png',
    '/icons/512.png',
    // Third-party libraries from CDNs
    'https://code.jquery.com/jquery-3.7.0.min.js',
    'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js',
    'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/signature_pad@4.0.0/dist/signature_pad.umd.min.js'
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(assetsToCache);
        })
        .catch(error => {
            console.error('[Service Worker] Caching failed', error);
        })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch event: serve cached content when offline
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            // If the request is in the cache, return the cached response
            if (response) {
                return response;
            }
            
            // If the request is not in the cache, fetch it from the network
            console.log(`[Service Worker] Fetching resource: ${event.request.url}`);
            return fetch(event.request).then((networkResponse) => {
                // Optionally, cache the newly fetched resource for future use
                // Be careful with what you cache, especially large files or dynamic API responses
                return networkResponse;
            }).catch(error => {
                console.error('[Service Worker] Fetch failed:', error);
                // You could return a custom offline page here if needed
            });
        })
    );
});
