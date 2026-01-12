// filepath: /Users/BYSG/Documents/BMU/Store/BMU storeapp4/server/public/sw.js
// This service worker is deprecated. Use service-worker.js instead.
// This file is kept for backwards compatibility to clean up old caches.

self.addEventListener('install', (event) => {
    console.log('[SW-Legacy] Installing - will skip waiting');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW-Legacy] Activating - cleaning up old caches');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key.startsWith('bmu-inventory')) {
                    console.log('[SW-Legacy] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

// No fetch handler - let requests pass through
