// Service Worker for BMU Store - Offline Support

const CACHE_NAME = 'bmustore-v1';
const OFFLINE_CACHE = 'bmustore-offline-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/api.js',
    '/idb.js',
    '/offline-sync.js',
    '/style.css',
    '/manifest.json',
    // External CDN resources
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css',
    'https://cdn.datatables.net/buttons/2.4.1/css/buttons.bootstrap5.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://code.jquery.com/jquery-3.7.1.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js',
    'https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js',
    'https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js',
    'https://cdn.datatables.net/buttons/2.4.1/js/buttons.bootstrap5.min.js',
    'https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js',
    'https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js'
];

// API endpoints to cache
const API_CACHE_URLS = [
    '/api/items',
    '/api/grn',
    '/api/srv',
    '/api/srf',
    '/api/bincard',
    '/api/dashboard/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
            })
            .then(() => {
                // Cache external CDN resources with no-cors
                return caches.open(CACHE_NAME).then(cache => {
                    const cdnPromises = STATIC_ASSETS
                        .filter(url => url.startsWith('http'))
                        .map(url => {
                            return fetch(url, { mode: 'no-cors' })
                                .then(response => cache.put(url, response))
                                .catch(err => console.log('[ServiceWorker] Failed to cache:', url));
                        });
                    return Promise.all(cdnPromises);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        // For POST/PUT/DELETE, queue for offline sync if offline
        if (!navigator.onLine && url.pathname.startsWith('/api/')) {
            event.respondWith(handleOfflineRequest(event.request));
            return;
        }
        return;
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
    }
    
    // Handle static assets - Cache First strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return offline page if available
                        return caches.match('/index.html');
                    });
            })
    );
});

// Handle API requests - Network First with Cache Fallback
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Try network first
        const response = await fetch(request);
        
        // Cache successful GET responses
        if (response && response.status === 200) {
            const responseClone = response.clone();
            const cache = await caches.open(OFFLINE_CACHE);
            await cache.put(request, responseClone);
        }
        
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Network failed, trying cache:', url.pathname);
        
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add offline indicator to response
            const data = await cachedResponse.json();
            return new Response(JSON.stringify({
                ...data,
                _offline: true,
                _cachedAt: cachedResponse.headers.get('date')
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Return empty response with offline indicator
        return new Response(JSON.stringify({
            error: 'Offline - No cached data available',
            _offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle offline write requests
async function handleOfflineRequest(request) {
    // Queue the request for later sync
    const requestData = {
        url: request.url,
        method: request.method,
        body: await request.clone().text(),
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: Date.now()
    };
    
    // Send to offline sync queue
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'QUEUE_OFFLINE_REQUEST',
                data: requestData
            });
        });
    });
    
    return new Response(JSON.stringify({
        success: true,
        _queued: true,
        message: 'Request queued for sync when online'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('[ServiceWorker] Background sync triggered');
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Notify clients to sync their queued data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_NOW' });
    });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_API_DATA') {
        // Pre-cache API data
        caches.open(OFFLINE_CACHE).then(cache => {
            API_CACHE_URLS.forEach(url => {
                fetch(url, { credentials: 'include' })
                    .then(response => {
                        if (response.ok) {
                            cache.put(url, response);
                        }
                    })
                    .catch(err => console.log('[ServiceWorker] Failed to cache API:', url));
            });
        });
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 1
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'BMU Store', options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
