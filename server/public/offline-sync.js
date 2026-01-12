// Offline Sync Module for BMU Store

const OfflineSync = {
    dbName: 'bmustore_offline',
    dbVersion: 1,
    syncQueueStore: 'sync_queue',
    cacheDataStore: 'cached_data',
    db: null,
    
    // Initialize offline database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for queued offline requests
                if (!db.objectStoreNames.contains(this.syncQueueStore)) {
                    const syncStore = db.createObjectStore(this.syncQueueStore, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    syncStore.createIndex('timestamp', 'timestamp');
                    syncStore.createIndex('status', 'status');
                }
                
                // Store for cached API data
                if (!db.objectStoreNames.contains(this.cacheDataStore)) {
                    const cacheStore = db.createObjectStore(this.cacheDataStore, { 
                        keyPath: 'endpoint' 
                    });
                    cacheStore.createIndex('updatedAt', 'updatedAt');
                }
            };
        });
    },
    
    // Check if online
    isOnline() {
        return navigator.onLine;
    },
    
    // Queue a request for later sync
    async queueRequest(request) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.syncQueueStore], 'readwrite');
            const store = tx.objectStore(this.syncQueueStore);
            
            const queueItem = {
                ...request,
                status: 'pending',
                createdAt: new Date().toISOString(),
                retryCount: 0
            };
            
            const addRequest = store.add(queueItem);
            addRequest.onsuccess = () => resolve(addRequest.result);
            addRequest.onerror = () => reject(addRequest.error);
        });
    },
    
    // Get all pending requests
    async getPendingRequests() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.syncQueueStore], 'readonly');
            const store = tx.objectStore(this.syncQueueStore);
            const index = store.index('status');
            
            const request = index.getAll('pending');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Mark request as synced
    async markSynced(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.syncQueueStore], 'readwrite');
            const store = tx.objectStore(this.syncQueueStore);
            
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.status = 'synced';
                    item.syncedAt = new Date().toISOString();
                    const updateRequest = store.put(item);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    },
    
    // Mark request as failed
    async markFailed(id, error) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.syncQueueStore], 'readwrite');
            const store = tx.objectStore(this.syncQueueStore);
            
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.status = item.retryCount >= 3 ? 'failed' : 'pending';
                    item.retryCount = (item.retryCount || 0) + 1;
                    item.lastError = error;
                    item.lastAttempt = new Date().toISOString();
                    const updateRequest = store.put(item);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    },
    
    // Cache API data locally
    async cacheData(endpoint, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.cacheDataStore], 'readwrite');
            const store = tx.objectStore(this.cacheDataStore);
            
            const cacheItem = {
                endpoint,
                data,
                updatedAt: new Date().toISOString()
            };
            
            const request = store.put(cacheItem);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    // Get cached data
    async getCachedData(endpoint) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.cacheDataStore], 'readonly');
            const store = tx.objectStore(this.cacheDataStore);
            
            const request = store.get(endpoint);
            request.onsuccess = () => {
                if (request.result) {
                    resolve({
                        data: request.result.data,
                        updatedAt: request.result.updatedAt,
                        _offline: true
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    // Sync all pending requests
    async syncAll() {
        if (!this.isOnline()) {
            console.log('[OfflineSync] Cannot sync - offline');
            return { synced: 0, failed: 0 };
        }
        
        const pending = await this.getPendingRequests();
        let synced = 0;
        let failed = 0;
        
        for (const item of pending) {
            try {
                const response = await fetch(item.url, {
                    method: item.method,
                    headers: item.headers,
                    body: item.body,
                    credentials: 'include'
                });
                
                if (response.ok) {
                    await this.markSynced(item.id);
                    synced++;
                    console.log('[OfflineSync] Synced:', item.url);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                await this.markFailed(item.id, error.message);
                failed++;
                console.error('[OfflineSync] Failed:', item.url, error);
            }
        }
        
        // Dispatch sync complete event
        window.dispatchEvent(new CustomEvent('syncComplete', {
            detail: { synced, failed }
        }));
        
        return { synced, failed };
    },
    
    // Get sync queue count
    async getQueueCount() {
        const pending = await this.getPendingRequests();
        return pending.length;
    },
    
    // Clear synced items
    async clearSynced() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.syncQueueStore], 'readwrite');
            const store = tx.objectStore(this.syncQueueStore);
            const index = store.index('status');
            
            const request = index.openCursor('synced');
            let deletedCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    deletedCount++;
                    cursor.continue();
                } else {
                    resolve(deletedCount);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
};

// Enhanced API wrapper with offline support
const OfflineAPI = {
    // Make API call with offline fallback
    async call(endpoint, options = {}) {
        const url = `/api${endpoint}`;
        const method = options.method || 'GET';
        
        // If online, try the request
        if (OfflineSync.isOnline()) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                // Cache GET responses
                if (method === 'GET' && response.ok) {
                    await OfflineSync.cacheData(endpoint, data);
                }
                
                return data;
            } catch (error) {
                console.log('[OfflineAPI] Network error, checking cache:', endpoint);
            }
        }
        
        // Offline or network error - handle based on method
        if (method === 'GET') {
            // Return cached data for GET requests
            const cached = await OfflineSync.getCachedData(endpoint);
            if (cached) {
                console.log('[OfflineAPI] Returning cached data for:', endpoint);
                return cached.data;
            }
            throw new Error('Offline - No cached data available');
        } else {
            // Queue write requests for later sync
            await OfflineSync.queueRequest({
                url,
                method,
                headers: options.headers || {},
                body: options.body
            });
            
            return {
                success: true,
                _queued: true,
                message: 'Request queued for sync when online'
            };
        }
    },
    
    // Convenience methods
    async get(endpoint) {
        return this.call(endpoint, { method: 'GET' });
    },
    
    async post(endpoint, data) {
        return this.call(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.call(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.call(endpoint, { method: 'DELETE' });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await OfflineSync.init();
    
    // Listen for online/offline events
    window.addEventListener('online', async () => {
        console.log('[OfflineSync] Back online - starting sync');
        showOfflineStatus(false);
        
        const result = await OfflineSync.syncAll();
        if (result.synced > 0) {
            showToastMessage(`Synced ${result.synced} pending changes`, 'success');
            // Refresh current view
            if (window.refreshTable) {
                window.refreshTable();
            }
        }
        if (result.failed > 0) {
            showToastMessage(`${result.failed} items failed to sync`, 'warning');
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('[OfflineSync] Gone offline');
        showOfflineStatus(true);
    });
    
    // Initial status check
    if (!navigator.onLine) {
        showOfflineStatus(true);
    }
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            if (event.data.type === 'QUEUE_OFFLINE_REQUEST') {
                await OfflineSync.queueRequest(event.data.data);
                updateSyncBadge();
            }
            if (event.data.type === 'SYNC_NOW') {
                await OfflineSync.syncAll();
            }
        });
    }
});

// UI Helper functions
function showOfflineStatus(isOffline) {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>You're offline - changes will sync when connected</span>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f39c12, #e74c3c);
            color: white;
            padding: 10px 20px;
            text-align: center;
            z-index: 9999;
            display: none;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.prepend(indicator);
    }
    
    indicator.style.display = isOffline ? 'block' : 'none';
    
    // Adjust main content padding
    const main = document.querySelector('.main-content');
    if (main) {
        main.style.paddingTop = isOffline ? '50px' : '';
    }
}

async function updateSyncBadge() {
    const count = await OfflineSync.getQueueCount();
    let badge = document.getElementById('sync-badge');
    
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'sync-badge';
        badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 9998;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        badge.title = 'Pending sync items';
        badge.onclick = () => {
            if (OfflineSync.isOnline()) {
                OfflineSync.syncAll();
            } else {
                showToastMessage('Cannot sync while offline', 'warning');
            }
        };
        document.body.appendChild(badge);
    }
    
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function showToastMessage(message, type = 'info') {
    // Use existing showToast if available
    if (window.IDB && window.IDB.showToast) {
        window.IDB.showToast(message);
        return;
    }
    
    // Fallback toast
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9997;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export for use in other modules
window.OfflineSync = OfflineSync;
window.OfflineAPI = OfflineAPI;
