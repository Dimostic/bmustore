// api.js - API Client for BMU Store (replaces IndexedDB)
// This file provides the same interface as idb.js but uses REST API

const API_BASE_URL = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    if (options.body && typeof options.body === 'object') {
        mergedOptions.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

// Store name mapping (frontend to backend)
const storeNameMap = {
    'activity_log': 'activity_log',
    'activityLog': 'activity_log',
    'grn': 'grn',
    'srv': 'srv',
    'srf': 'srf',
    'items': 'items'
};

// Field name mapping (frontend camelCase to backend snake_case)
const fieldMaps = {
    grn: {
        toBackend: {
            drnNo: 'drn_no',
            lpoNo: 'lpo_no',
            issueDate: 'issue_date',
            deliveryDate: 'delivery_date',
            supplierName: 'supplier_name',
            waybillNo: 'waybill_no',
            invoiceNo: 'invoice_no',
            examinedBy: 'examined_by',
            examinedDept: 'examined_dept',
            examinedSig: 'examined_sig',
            receivedBy: 'received_by',
            receivedDept: 'received_dept',
            receivedSig: 'received_sig',
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toFrontend: {
            drn_no: 'drnNo',
            lpo_no: 'lpoNo',
            issue_date: 'issueDate',
            delivery_date: 'deliveryDate',
            supplier_name: 'supplierName',
            waybill_no: 'waybillNo',
            invoice_no: 'invoiceNo',
            examined_by: 'examinedBy',
            examined_dept: 'examinedDept',
            examined_sig: 'examinedSig',
            received_by: 'receivedBy',
            received_dept: 'receivedDept',
            received_sig: 'receivedSig',
            created_at: 'createdAt',
            updated_at: 'updatedAt'
        }
    },
    srv: {
        toBackend: {
            docNum: 'doc_num',
            poLsoNo: 'po_lso_no',
            totalValue: 'total_value',
            orderNo: 'order_no',
            orderDate: 'order_date',
            invoiceNo: 'invoice_no',
            invoiceDate: 'invoice_date',
            certifiedBy: 'certified_by',
            certifiedDesignation: 'certified_designation',
            certifiedDate: 'certified_date',
            certifiedSig: 'certified_sig',
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toFrontend: {
            doc_num: 'docNum',
            po_lso_no: 'poLsoNo',
            total_value: 'totalValue',
            order_no: 'orderNo',
            order_date: 'orderDate',
            invoice_no: 'invoiceNo',
            invoice_date: 'invoiceDate',
            certified_by: 'certifiedBy',
            certified_designation: 'certifiedDesignation',
            certified_date: 'certifiedDate',
            certified_sig: 'certifiedSig',
            created_at: 'createdAt',
            updated_at: 'updatedAt'
        }
    },
    srf: {
        toBackend: {
            srfNo: 'srf_no',
            costCode: 'cost_code',
            departmentUnit: 'department_unit',
            requesterName: 'requester_name',
            requesterSig: 'requester_sig',
            approvedBy: 'approved_by',
            approvalDate: 'approval_date',
            approvalSig: 'approval_sig',
            issuedBy: 'issued_by',
            issueDate: 'issue_date',
            storeSig: 'store_sig',
            receivedBy: 'received_by',
            receiverSig: 'receiver_sig',
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toFrontend: {
            srf_no: 'srfNo',
            cost_code: 'costCode',
            department_unit: 'departmentUnit',
            requester_name: 'requesterName',
            requester_sig: 'requesterSig',
            approved_by: 'approvedBy',
            approval_date: 'approvalDate',
            approval_sig: 'approvalSig',
            issued_by: 'issuedBy',
            issue_date: 'issueDate',
            store_sig: 'storeSig',
            received_by: 'receivedBy',
            receiver_sig: 'receiverSig',
            created_at: 'createdAt',
            updated_at: 'updatedAt'
        }
    },
    items: {
        toBackend: {
            minStock: 'min_stock',
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toFrontend: {
            min_stock: 'minStock',
            created_at: 'createdAt',
            updated_at: 'updatedAt'
        }
    }
};

function mapFields(data, store, direction) {
    const map = fieldMaps[store]?.[direction] || {};
    const result = {};
    
    for (const [key, value] of Object.entries(data)) {
        const mappedKey = map[key] || key;
        result[mappedKey] = value;
    }
    
    return result;
}

// --- CRUD Operations ---
async function addRecord(store, record) {
    const backendStore = storeNameMap[store] || store;
    const mappedRecord = mapFields(record, backendStore, 'toBackend');
    const result = await apiCall(`/${backendStore}`, {
        method: 'POST',
        body: mappedRecord
    });
    return result.id;
}

async function getAllRecords(store) {
    const backendStore = storeNameMap[store] || store;
    const records = await apiCall(`/${backendStore}`);
    return records.map(record => mapFields(record, backendStore, 'toFrontend'));
}

async function getRecordByKey(store, key) {
    const backendStore = storeNameMap[store] || store;
    const record = await apiCall(`/${backendStore}/${key}`);
    return mapFields(record, backendStore, 'toFrontend');
}

async function updateRecord(store, record) {
    const backendStore = storeNameMap[store] || store;
    const { id, ...data } = record;
    const mappedRecord = mapFields(data, backendStore, 'toBackend');
    await apiCall(`/${backendStore}/${id}`, {
        method: 'PUT',
        body: mappedRecord
    });
    return id;
}

async function deleteRecord(store, id) {
    const backendStore = storeNameMap[store] || store;
    await apiCall(`/${backendStore}/${id}`, { method: 'DELETE' });
}

// --- Authentication ---
async function authenticateUser(username, password) {
    return await apiCall('/auth/login', {
        method: 'POST',
        body: { username, password }
    });
}

async function registerUser(username, password, role = 'user') {
    return await apiCall('/users', {
        method: 'POST',
        body: { username, password, role }
    });
}

async function createSession(userId) {
    // Session is created on login
    return 'session-managed-by-server';
}

async function getSession(sessionId) {
    return await apiCall('/auth/check');
}

async function logoutSession(sessionId) {
    return await apiCall('/auth/logout', { method: 'POST' });
}

// --- Roles ---
async function addRole(roleName, permissions = []) {
    console.warn('Role management is handled by admin');
    return null;
}

async function getRole(roleName) {
    console.warn('Role management is handled by admin');
    return null;
}

// --- Audit ---
async function logAudit(action, userId, details = {}) {
    // Activity logging is handled by the server
    return null;
}

// --- Toast Notification ---
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// --- Sync Functions (now just refresh from server) ---
async function syncStoreToRemote(store) {
    showToast(`${store} data is already synced with server`);
}

async function fetchStoreFromRemote(store) {
    showToast(`Refreshing ${store} from server...`);
    // Just return - the app will call getAllRecords which fetches from server
}

// --- Dashboard Stats ---
async function getDashboardStats() {
    return await apiCall('/dashboard/stats');
}

// --- Bin Card ---
async function getBinCard() {
    return await apiCall('/bincard');
}

// --- Change Password ---
async function changePassword(currentPassword, newPassword) {
    return await apiCall('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
    });
}

// --- Get Roles ---
async function getRoles() {
    return await apiCall('/roles');
}

// Expose all functions on window for global access (same interface as idb.js)
window.IDB = {
    addRecord,
    getAllRecords,
    getRecordByKey,
    updateRecord,
    deleteRecord,
    registerUser,
    authenticateUser,
    createSession,
    getSession,
    logoutSession,
    addRole,
    getRole,
    logAudit,
    showToast,
    syncStoreToRemote,
    fetchStoreFromRemote,
    getDashboardStats,
    getBinCard,
    changePassword,
    getRoles
};
