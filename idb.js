// idb.js - IndexedDB utility functions for BMU Store App
// Uses best practices for IndexedDB usage

const DB_NAME = 'bmu_store_db';
const DB_VERSION = 2; // bump version for new stores
const STORE_NAMES = ['grn', 'srv', 'srf', 'items', 'activity_log', 'users', 'sessions', 'roles', 'audit_log'];

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            STORE_NAMES.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                }
            });
            // users: username, passwordHash, role
            // sessions: sessionId, userId, expiresAt
            // roles: roleName, permissions
            // audit_log: action, userId, timestamp, details
        };
        request.onsuccess = function(e) { resolve(e.target.result); };
        request.onerror = function(e) { reject(e.target.error); };
    });
}

export async function addRecord(store, record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).add(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getAllRecords(store) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getRecordByKey(store, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function updateRecord(store, record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).put(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteRecord(store, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// --- Authentication & User Management ---
export async function registerUser(username, password, role = 'user') {
    // Hash password (simple hash for demo, use bcrypt in production)
    const passwordHash = await simpleHash(password);
    const user = { username, passwordHash, role };
    return addRecord('users', user);
}

export async function authenticateUser(username, password) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const req = store.openCursor();
        req.onsuccess = async function(e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.username === username) {
                    const hash = await simpleHash(password);
                    if (cursor.value.passwordHash === hash) {
                        resolve(cursor.value);
                        return;
                    }
                }
                cursor.continue();
            } else {
                reject(new Error('Invalid credentials'));
            }
        };
        req.onerror = () => reject(req.error);
    });
}

function simpleHash(str) {
    // Simple hash for demo only
    return Promise.resolve(btoa(str));
}

export async function createSession(userId) {
    const sessionId = Math.random().toString(36).substr(2, 16);
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour
    await addRecord('sessions', { sessionId, userId, expiresAt });
    return sessionId;
}

export async function getSession(sessionId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const req = store.openCursor();
        req.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.sessionId === sessionId && cursor.value.expiresAt > Date.now()) {
                    resolve(cursor.value);
                    return;
                }
                cursor.continue();
            } else {
                reject(new Error('Session not found or expired'));
            }
        };
        req.onerror = () => reject(req.error);
    });
}

export async function logoutSession(sessionId) {
    // Remove session
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite');
        const store = tx.objectStore('sessions');
        const req = store.openCursor();
        req.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.sessionId === sessionId) {
                    store.delete(cursor.key);
                    resolve();
                    return;
                }
                cursor.continue();
            } else {
                resolve();
            }
        };
        req.onerror = () => reject(req.error);
    });
}

// --- Roles & Permissions ---
export async function addRole(roleName, permissions = []) {
    return addRecord('roles', { roleName, permissions });
}

export async function getRole(roleName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('roles', 'readonly');
        const store = tx.objectStore('roles');
        const req = store.openCursor();
        req.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.roleName === roleName) {
                    resolve(cursor.value);
                    return;
                }
                cursor.continue();
            } else {
                reject(new Error('Role not found'));
            }
        };
        req.onerror = () => reject(req.error);
    });
}

// --- Audit Logging ---
export async function logAudit(action, userId, details = {}) {
    return addRecord('audit_log', {
        action,
        userId,
        details,
        timestamp: new Date().toISOString()
    });
}

// Utility for showing toast notifications
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// --- Remote Sync Utilities ---
// Replace with your real API endpoint
const API_BASE_URL = 'https://your-enterprise-api.example.com/api';

export async function syncStoreToRemote(store) {
    const records = await getAllRecords(store);
    try {
        const res = await fetch(`${API_BASE_URL}/sync/${store}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
        });
        if (!res.ok) throw new Error('Sync failed');
        showToast(`${store} synced to server`);
    } catch (err) {
        showToast(`Sync error: ${err.message}`);
    }
}

export async function fetchStoreFromRemote(store) {
    try {
        const res = await fetch(`${API_BASE_URL}/sync/${store}`);
        if (!res.ok) throw new Error('Fetch failed');
        const records = await res.json();
        // Optionally clear local store and re-add
        const db = await openDB();
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).clear();
        records.forEach(r => tx.objectStore(store).add(r));
        showToast(`${store} updated from server`);
    } catch (err) {
        showToast(`Fetch error: ${err.message}`);
    }
}
