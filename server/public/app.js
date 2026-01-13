// IndexedDB utilities will be accessed via window.IDB (loaded from idb.js)

// --- Dummy Data Insertion for Testing ---
async function insertDummyData() {
    const { addRecord, registerUser, showToast, getAllRecords } = window.IDB;
    
    // Check if data already exists
    const existingItems = await getAllRecords('items');
    if (existingItems.length > 0) {
        showToast('Dummy data already exists!');
        return;
    }

    // Items - Medical Supplies
    const items = [
        { code: 'MED-001', name: 'Syringe 5ml', unit: 'pcs', category: 'medical', minStock: 100, location: 'Shelf A-1' },
        { code: 'MED-002', name: 'Surgical Gloves (Pair)', unit: 'box', category: 'medical', minStock: 50, location: 'Shelf A-2' },
        { code: 'MED-003', name: 'Face Mask N95', unit: 'box', category: 'medical', minStock: 30, location: 'Shelf A-3' },
        { code: 'MED-004', name: 'Bandage Roll 4inch', unit: 'roll', category: 'medical', minStock: 100, location: 'Shelf B-1' },
        { code: 'MED-005', name: 'Cotton Wool 500g', unit: 'pack', category: 'medical', minStock: 40, location: 'Shelf B-2' },
        { code: 'STA-001', name: 'A4 Paper', unit: 'ream', category: 'stationery', minStock: 50, location: 'Shelf C-1' },
        { code: 'STA-002', name: 'Ballpoint Pen (Blue)', unit: 'box', category: 'stationery', minStock: 20, location: 'Shelf C-2' },
        { code: 'STA-003', name: 'Stapler', unit: 'pcs', category: 'stationery', minStock: 10, location: 'Shelf C-3' },
        { code: 'EQP-001', name: 'Stethoscope', unit: 'pcs', category: 'equipment', minStock: 5, location: 'Cabinet D-1' },
        { code: 'EQP-002', name: 'Blood Pressure Monitor', unit: 'pcs', category: 'equipment', minStock: 3, location: 'Cabinet D-2' }
    ];
    
    for (const item of items) {
        await addRecord('items', { ...item, createdAt: new Date().toISOString() });
    }

    // GRN Records
    const grnRecords = [
        {
            drnNo: 'GRN-2026-001', lpoNo: 'LPO-2026-001', issueDate: '2026-01-02', deliveryDate: '2026-01-02',
            supplierName: 'MedSupply Nigeria Ltd.', carrier: 'DHL Express', waybillNo: 'WB-12345', invoiceNo: 'INV-001',
            items: [
                { sno: 1, description: 'Syringe 5ml', code: 'MED-001', qtyOrdered: 500, qtyReceived: 500, unit: 'pcs', remark: 'Good condition' },
                { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', qtyOrdered: 100, qtyReceived: 100, unit: 'box', remark: '' }
            ],
            examinedBy: 'Dr. Okeke', examinedDept: 'Quality Control', receivedBy: 'Mr. James', receivedDept: 'Store',
            distribution: 'Finance, Audit, Store', createdAt: '2026-01-02T10:00:00Z'
        },
        {
            drnNo: 'GRN-2026-002', lpoNo: 'LPO-2026-002', issueDate: '2026-01-05', deliveryDate: '2026-01-05',
            supplierName: 'HealthPro Supplies', carrier: 'FedEx', waybillNo: 'WB-12346', invoiceNo: 'INV-002',
            items: [
                { sno: 1, description: 'Face Mask N95', code: 'MED-003', qtyOrdered: 200, qtyReceived: 200, unit: 'box', remark: '' },
                { sno: 2, description: 'A4 Paper', code: 'STA-001', qtyOrdered: 100, qtyReceived: 100, unit: 'ream', remark: '' }
            ],
            examinedBy: 'Dr. Musa', examinedDept: 'Quality Control', receivedBy: 'Mr. James', receivedDept: 'Store',
            distribution: 'Finance, Audit', createdAt: '2026-01-05T11:00:00Z'
        }
    ];

    for (const grn of grnRecords) {
        await addRecord('grn', grn);
    }

    // SRV Records
    const srvRecords = [
        {
            docNum: 'SRV-2026-001', date: '2026-01-03', poLsoNo: 'PO-001',
            department: 'Pharmacy', source: 'MedSupply Nigeria Ltd.',
            items: [
                { sno: 1, description: 'Syringe 5ml', code: 'MED-001', unit: 'pcs', quantity: 200, unitPrice: 50, value: 10000, ledgerFolio: 'LF-001', remarks: '' },
                { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', unit: 'box', quantity: 50, unitPrice: 2500, value: 125000, ledgerFolio: 'LF-002', remarks: '' }
            ],
            orderNo: 'ORD-001', orderDate: '2026-01-01', invoiceNo: 'INV-001', invoiceDate: '2026-01-02',
            certifiedBy: 'Mr. Adamu', certifiedDesignation: 'Store Officer', certifiedDate: '2026-01-03',
            totalValue: 135000, createdAt: '2026-01-03T12:00:00Z'
        },
        {
            docNum: 'SRV-2026-002', date: '2026-01-06', poLsoNo: 'PO-002',
            department: 'Laboratory', source: 'HealthPro Supplies',
            items: [
                { sno: 1, description: 'Face Mask N95', code: 'MED-003', unit: 'box', quantity: 100, unitPrice: 3500, value: 350000, ledgerFolio: 'LF-003', remarks: '' }
            ],
            orderNo: 'ORD-002', orderDate: '2026-01-04', invoiceNo: 'INV-002', invoiceDate: '2026-01-05',
            certifiedBy: 'Mr. Adamu', certifiedDesignation: 'Store Officer', certifiedDate: '2026-01-06',
            totalValue: 350000, createdAt: '2026-01-06T13:00:00Z'
        }
    ];

    for (const srv of srvRecords) {
        await addRecord('srv', srv);
    }

    // SRF Records
    const srfRecords = [
        {
            srfNo: 'SRF-2026-001', date: '2026-01-07', costCode: 'CC-SURG-001',
            departmentUnit: 'Surgery Department', requesterName: 'Dr. Okoro', designation: 'Senior Surgeon',
            items: [
                { sno: 1, description: 'Syringe 5ml', code: 'MED-001', unit: 'pcs', qtyRequested: 100, qtyIssued: 100, remarks: 'Urgent' },
                { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', unit: 'box', qtyRequested: 20, qtyIssued: 20, remarks: '' }
            ],
            approvedBy: 'Prof. Ibrahim', approvalDate: '2026-01-07',
            issuedBy: 'Mr. James', issueDate: '2026-01-07', receivedBy: 'Nurse Ada',
            createdAt: '2026-01-07T14:00:00Z'
        },
        {
            srfNo: 'SRF-2026-002', date: '2026-01-08', costCode: 'CC-PED-001',
            departmentUnit: 'Pediatrics Department', requesterName: 'Dr. Musa', designation: 'Pediatrician',
            items: [
                { sno: 1, description: 'Face Mask N95', code: 'MED-003', unit: 'box', qtyRequested: 10, qtyIssued: 10, remarks: '' },
                { sno: 2, description: 'Cotton Wool 500g', code: 'MED-005', unit: 'pack', qtyRequested: 5, qtyIssued: 5, remarks: '' }
            ],
            approvedBy: 'Dr. Bello', approvalDate: '2026-01-08',
            issuedBy: 'Mr. James', issueDate: '2026-01-08', receivedBy: 'Nurse Fatima',
            createdAt: '2026-01-08T15:00:00Z'
        }
    ];

    for (const srf of srfRecords) {
        await addRecord('srf', srf);
    }

    // Activity Log
    await addRecord('activity_log', {
        user: 'admin', action: 'System Initialization',
        details: 'System initialized with dummy data for testing',
        timestamp: new Date().toISOString()
    });

    // Additional Users
    try {
        await registerUser('storekeeper', 'store123', 'user');
        await registerUser('auditor', 'audit123', 'user');
    } catch (e) {
        console.log('Users may already exist');
    }

    showToast('Dummy data inserted successfully!');
    
    // Refresh current view
    if (typeof window.refreshCurrentView === 'function') {
        window.refreshCurrentView();
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // --- Access IndexedDB utilities from window.IDB ---
    const {
        addRecord, getAllRecords, getRecordByKey, updateRecord, deleteRecord, showToast,
        registerUser, authenticateUser, createSession, getSession, logoutSession,
        addRole, getRole, logAudit,
        syncStoreToRemote, fetchStoreFromRemote
    } = window.IDB;

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    }

    // --- Global State & Variables ---
    let currentUser = null;
    let signaturePads = {};
    let currentSessionId = null;
    let itemsCache = []; // Cache for items autocomplete

    // --- UI Element References ---
    const loginPage = document.getElementById('login-page');
    const appPage = document.getElementById('app');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const modals = {
        grn: document.getElementById('grn-modal'),
        srv: document.getElementById('srv-modal'),
        srf: document.getElementById('srf-modal'),
        item: document.getElementById('item-modal'),
        import: document.getElementById('import-modal'),
    };
    const forms = {
        grn: document.getElementById('grn-form'),
        srv: document.getElementById('srv-form'),
        srf: document.getElementById('srf-form'),
        item: document.getElementById('item-form'),
    };
    
    // DataTables instances
    let dataTables = {};

    // Chart instances
    let charts = {};

    // Dummy passwords
    const DUMMY_PASSWORDS = {
        admin: 'password123',
        storekeeper: 'store123',
        auditor: 'audit123'
    };

    // --- Utility Functions ---
    const logActivity = async (action, details) => {
        try {
            await addRecord('activity_log', {
                user: currentUser,
                action: action,
                details: details,
                timestamp: new Date().toISOString()
            });
            if (isSectionActive('activity-log')) {
                await refreshTable('activityLog');
            }
        } catch (err) {
            console.error('Failed to log activity:', err);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toISOString().split('T')[0];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
    };

    const generateDocNumber = (prefix) => {
        const date = new Date();
        const year = date.getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${year}-${random}`;
    };

    // --- Signature Pad Initialization ---
    const initializeSignaturePads = () => {
        const canvases = document.querySelectorAll('.signature-pad');
        canvases.forEach(canvas => {
            if (!signaturePads[canvas.id]) {
                // Set proper canvas dimensions
                const container = canvas.parentElement;
                canvas.width = container.offsetWidth - 10;
                canvas.height = 100;
                
                signaturePads[canvas.id] = new SignaturePad(canvas, {
                    backgroundColor: 'rgb(255, 255, 255)',
                    penColor: 'rgb(0, 0, 0)'
                });
            }
        });

        // Clear signature button handlers
        document.querySelectorAll('.clear-sig-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                if (signaturePads[targetId]) {
                    signaturePads[targetId].clear();
                }
            });
        });
    };

    const getSignatureData = (canvasId) => {
        if (signaturePads[canvasId] && !signaturePads[canvasId].isEmpty()) {
            return signaturePads[canvasId].toDataURL();
        }
        return null;
    };

    const loadSignatureData = (canvasId, dataUrl) => {
        if (signaturePads[canvasId] && dataUrl) {
            signaturePads[canvasId].fromDataURL(dataUrl);
        }
    };

    // --- CSV Export/Import Functions ---
    const exportToCSV = (data, filename, columns) => {
        if (!data || data.length === 0) {
            showToast('No data to export');
            return;
        }

        const headers = columns.map(col => col.title).join(',');
        const rows = data.map(row => {
            return columns.map(col => {
                let value = col.data ? row[col.data] : '';
                if (typeof value === 'object') value = JSON.stringify(value);
                // Escape quotes and wrap in quotes if contains comma
                value = String(value || '').replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                return value;
            }).join(',');
        });

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast(`${filename} exported successfully`);
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return { headers: [], rows: [] };
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (const char of lines[i]) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }
        
        return { headers, rows };
    };

    // --- Authentication ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        try {
            // Use API authentication
            const response = await authenticateUser(username, password);
            if (response.success) {
                currentUser = response.user.username;
                sessionStorage.setItem('currentUser', response.user.username);
                sessionStorage.setItem('userRole', response.user.role);
                sessionStorage.setItem('userPermissions', JSON.stringify(response.user.permissions || {}));
                loginPage.style.display = 'none';
                appPage.style.display = 'block';
                errorEl.textContent = '';
                
                // Apply role-based UI restrictions
                applyRoleBasedUI(response.user.role, response.user.permissions);
                
                await initializeApp();
                showToast(`Welcome, ${response.user.fullName || response.user.username}!`);
            }
        } catch (err) {
            console.error('Login error:', err);
            errorEl.textContent = err.message || 'Invalid username or password.';
        }
    };

    // Role-based UI control
    const applyRoleBasedUI = (role, permissions) => {
        const isAdmin = ['superadmin', 'admin'].includes(role);
        const canCreate = isAdmin || ['storekeeper'].includes(role);
        const canEdit = isAdmin || ['storekeeper'].includes(role);
        const canDelete = isAdmin;
        
        // Show/hide User Management link based on role
        const userMgmtLink = document.querySelector('[data-target="user-management"]');
        if (userMgmtLink) {
            userMgmtLink.parentElement.style.display = isAdmin ? 'block' : 'none';
        }
        
        // Show/hide Activity Log based on role
        const activityLogLink = document.querySelector('[data-target="activity-log"]');
        if (activityLogLink) {
            const canViewActivity = isAdmin || role === 'auditor';
            activityLogLink.parentElement.style.display = canViewActivity ? 'block' : 'none';
        }
        
        // Show/hide Add buttons based on role
        document.querySelectorAll('.add-btn, [id$="-add-btn"]').forEach(btn => {
            btn.style.display = canCreate ? 'inline-flex' : 'none';
        });
        
        // Store permissions for later use
        window.userPermissions = {
            role,
            permissions,
            canCreate,
            canEdit,
            canDelete,
            isAdmin
        };
        
        // Update header with role badge
        updateHeaderWithRole(role);
    };
    
    // Update header with user role badge
    const updateHeaderWithRole = (role) => {
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) return;
        
        // Remove existing role badge
        const existingBadge = headerContent.querySelector('.role-badge');
        if (existingBadge) existingBadge.remove();
        
        // Create role badge
        const roleBadge = document.createElement('span');
        roleBadge.className = `role-badge role-${role}`;
        roleBadge.innerHTML = `<i class="fas fa-user-shield"></i> ${role.charAt(0).toUpperCase() + role.slice(1)}`;
        roleBadge.style.cssText = `
            background: ${getRoleColor(role)};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75em;
            margin-left: 15px;
            font-weight: 500;
        `;
        
        headerContent.appendChild(roleBadge);
    };
    
    const getRoleColor = (role) => {
        const colors = {
            superadmin: 'linear-gradient(135deg, #800020, #a00030)',
            admin: 'linear-gradient(135deg, #1e3c72, #2a5298)',
            storekeeper: 'linear-gradient(135deg, #27ae60, #2ecc71)',
            auditor: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
            viewer: 'linear-gradient(135deg, #7f8c8d, #95a5a6)'
        };
        return colors[role] || colors.viewer;
    };

    const handleLogout = async () => {
        try {
            await logoutSession();
        } catch (err) {
            console.error('Logout error:', err);
        }
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userPermissions');
        window.userPermissions = null;
        loginPage.style.display = 'block';
        appPage.style.display = 'none';
        // Destroy DataTables and Charts to re-initialize on next login
        Object.values(dataTables).forEach(table => { try { table.destroy(); } catch(e) {} });
        Object.values(charts).forEach(chart => { try { chart.destroy(); } catch(e) {} });
        dataTables = {};
        charts = {};
    };

    // --- Dashboard Functions ---
    const initializeDashboard = async () => {
        await updateDashboardStats();
        await initializeDashboardCharts();
    };

    const updateDashboardStats = async () => {
        try {
            const items = await getAllRecords('items');
            const grn = await getAllRecords('grn');
            const srv = await getAllRecords('srv');
            const srf = await getAllRecords('srf');

            // Update stats in dashboard if elements exist
            const dashboard = document.getElementById('dashboard');
            if (!dashboard) return;

            // Check if stats container exists, if not create it
            let statsContainer = dashboard.querySelector('.stats-container');
            if (!statsContainer) {
                statsContainer = document.createElement('div');
                statsContainer.className = 'stats-container';
                statsContainer.innerHTML = `
                    <div class="stat-card items">
                        <h4>Total Items</h4>
                        <div class="stat-value" id="stat-items">0</div>
                    </div>
                    <div class="stat-card grn">
                        <h4>GRN Records</h4>
                        <div class="stat-value" id="stat-grn">0</div>
                    </div>
                    <div class="stat-card srv">
                        <h4>SRV Records</h4>
                        <div class="stat-value" id="stat-srv">0</div>
                    </div>
                    <div class="stat-card srf">
                        <h4>SRF Records</h4>
                        <div class="stat-value" id="stat-srf">0</div>
                    </div>
                `;
                const h2 = dashboard.querySelector('h2');
                if (h2) h2.after(statsContainer);
            }

            // Update values
            const statItems = document.getElementById('stat-items');
            const statGrn = document.getElementById('stat-grn');
            const statSrv = document.getElementById('stat-srv');
            const statSrf = document.getElementById('stat-srf');

            if (statItems) statItems.textContent = items.length;
            if (statGrn) statGrn.textContent = grn.length;
            if (statSrv) statSrv.textContent = srv.length;
            if (statSrf) statSrf.textContent = srf.length;
        } catch (err) {
            console.error('Error updating dashboard stats:', err);
        }
    };

    const initializeDashboardCharts = async () => {
        try {
            const items = await getAllRecords('items');
            const grn = await getAllRecords('grn');
            const srv = await getAllRecords('srv');
            const srf = await getAllRecords('srf');

            // Stock Value Chart
            const stockValueCtx = document.getElementById('stockValueChart');
            if (stockValueCtx) {
                if (charts.stockValue) charts.stockValue.destroy();
                
                // Group items by category
                const categories = {};
                items.forEach(item => {
                    const cat = item.category || 'other';
                    categories[cat] = (categories[cat] || 0) + 1;
                });

                charts.stockValue = new Chart(stockValueCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(categories).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                        datasets: [{
                            label: 'Items by Category',
                            data: Object.values(categories),
                            backgroundColor: ['#002366', '#800000', '#C4D600', '#17a2b8', '#28a745', '#ffc107']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Items by Category' },
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { stepSize: 1 } }
                        }
                    }
                });
            }

            // Item Movement Chart
            const itemMovementCtx = document.getElementById('itemMovementChart');
            if (itemMovementCtx) {
                if (charts.itemMovement) charts.itemMovement.destroy();
                
                // Calculate movement data
                const totalReceived = grn.reduce((sum, g) => sum + (g.items?.length || 1), 0);
                const totalStored = srv.reduce((sum, s) => sum + (s.items?.length || 1), 0);
                const totalIssued = srf.reduce((sum, s) => sum + (s.items?.length || 1), 0);

                charts.itemMovement = new Chart(itemMovementCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Received (GRN)', 'Stored (SRV)', 'Issued (SRF)'],
                        datasets: [{
                            data: [totalReceived, totalStored, totalIssued],
                            backgroundColor: ['#002366', '#28a745', '#dc3545']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Item Movement Summary' }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error initializing dashboard charts:', err);
        }
    };

    // --- Dynamic Item Rows ---
    const createItemRow = (type, index, data = {}) => {
        const row = document.createElement('tr');
        row.className = `${type}-item-row`;
        row.dataset.index = index;

        // Check if there's an existing image
        const hasImage = data.images && data.images.length > 0;
        const imageUrl = hasImage ? data.images[0] : '';

        if (type === 'grn') {
            row.innerHTML = `
                <td>${index}</td>
                <td class="item-description-cell">
                    <div class="searchable-select-container">
                        <input type="text" name="description" list="item-list-${index}" value="${data.description || ''}" placeholder="Search or type item..." class="item-autocomplete searchable-input">
                        <datalist id="item-list-${index}"></datalist>
                        <button type="button" class="btn-clear-item" title="Clear item" ${!data.description ? 'style="display:none;"' : ''}>×</button>
                    </div>
                </td>
                <td><input type="text" name="code" value="${data.code || ''}" placeholder="Code" readonly></td>
                <td><input type="number" name="qtyOrdered" value="${data.qtyOrdered || ''}" placeholder="0" min="0"></td>
                <td><input type="number" name="qtyReceived" value="${data.qtyReceived || ''}" placeholder="0" min="0"></td>
                <td><input type="text" name="unit" value="${data.unit || ''}" placeholder="Unit" readonly></td>
                <td><input type="text" name="remark" value="${data.remark || ''}" placeholder="Remark"></td>
                <td>
                    <div class="grn-image-upload-container">
                        <div class="image-preview" id="grn-image-preview-${index}" style="display: ${hasImage ? 'flex' : 'none'};">
                            <img src="${imageUrl}" alt="Item image">
                            <button type="button" class="btn-remove-image" data-row="${index}" title="Remove image">×</button>
                        </div>
                        <div class="image-buttons" id="grn-image-buttons-${index}" style="display: ${hasImage ? 'none' : 'flex'};">
                            <button type="button" class="btn-upload-image" data-row="${index}" title="Upload Image">
                                <i class="fas fa-upload"></i>
                                <span>Upload</span>
                            </button>
                            <button type="button" class="btn-camera-image" data-row="${index}" title="Take Photo">
                                <i class="fas fa-camera"></i>
                                <span>Camera</span>
                            </button>
                        </div>
                        <input type="file" class="image-file-input" id="grn-image-file-${index}" accept="image/*" style="display: none;">
                    </div>
                </td>
                <td><button type="button" class="btn-remove-row" onclick="this.closest('tr').remove()">✕</button></td>
            `;
            
            // Populate datalist with items
            const datalist = row.querySelector(`#item-list-${index}`);
            if (datalist && itemsCache) {
                itemsCache.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.dataset.code = item.code;
                    option.dataset.unit = item.unit;
                    datalist.appendChild(option);
                });
            }
        } else if (type === 'srv') {
            row.innerHTML = `
                <td>${index}</td>
                <td><input type="text" name="description" list="item-list" value="${data.description || ''}" placeholder="Item description" class="item-autocomplete"></td>
                <td><input type="text" name="code" value="${data.code || ''}" placeholder="Code" readonly></td>
                <td><input type="text" name="unit" value="${data.unit || ''}" placeholder="Unit" readonly></td>
                <td><input type="number" name="quantity" value="${data.quantity || ''}" placeholder="0" min="0" class="calc-qty"></td>
                <td><input type="number" name="unitPrice" value="${data.unitPrice || ''}" placeholder="0.00" min="0" step="0.01" class="calc-price"></td>
                <td><input type="number" name="value" value="${data.value || ''}" placeholder="0.00" readonly class="row-value"></td>
                <td><input type="text" name="ledgerFolio" value="${data.ledgerFolio || ''}" placeholder="L/F"></td>
                <td><input type="text" name="remarks" value="${data.remarks || ''}" placeholder="Remarks"></td>
                <td><button type="button" class="btn-remove-row" onclick="this.closest('tr').remove(); calculateSrvTotal();">✕</button></td>
            `;
        } else if (type === 'srf') {
            row.innerHTML = `
                <td>${index}</td>
                <td><input type="text" name="description" list="item-list" value="${data.description || ''}" placeholder="Item description" class="item-autocomplete"></td>
                <td><input type="text" name="code" value="${data.code || ''}" placeholder="Code" readonly></td>
                <td><input type="text" name="unit" value="${data.unit || ''}" placeholder="Unit" readonly></td>
                <td><input type="number" name="qtyRequested" value="${data.qtyRequested || ''}" placeholder="0" min="0"></td>
                <td><input type="number" name="qtyIssued" value="${data.qtyIssued || ''}" placeholder="0" min="0"></td>
                <td><input type="text" name="remarks" value="${data.remarks || ''}" placeholder="Remarks"></td>
                <td><button type="button" class="btn-remove-row" onclick="this.closest('tr').remove()">✕</button></td>
            `;
        }

        // Add autocomplete handler
        const descInput = row.querySelector('.item-autocomplete');
        if (descInput) {
            // Handle item selection
            descInput.addEventListener('change', function() {
                const item = itemsCache.find(i => i.name === this.value);
                const clearBtn = row.querySelector('.btn-clear-item');
                if (item) {
                    row.querySelector('[name="code"]').value = item.code;
                    row.querySelector('[name="unit"]').value = item.unit;
                    if (clearBtn) clearBtn.style.display = 'flex';
                } else if (!this.value) {
                    row.querySelector('[name="code"]').value = '';
                    row.querySelector('[name="unit"]').value = '';
                    if (clearBtn) clearBtn.style.display = 'none';
                }
            });
            
            // Handle input to show/hide clear button
            descInput.addEventListener('input', function() {
                const clearBtn = row.querySelector('.btn-clear-item');
                if (clearBtn) {
                    clearBtn.style.display = this.value ? 'flex' : 'none';
                }
            });
        }
        
        // Handle clear item button
        const clearBtn = row.querySelector('.btn-clear-item');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                const descInput = row.querySelector('[name="description"]');
                if (descInput) {
                    descInput.value = '';
                    descInput.focus();
                }
                row.querySelector('[name="code"]').value = '';
                row.querySelector('[name="unit"]').value = '';
                this.style.display = 'none';
            });
        }

        // Add calculation handler for SRV
        if (type === 'srv') {
            const qtyInput = row.querySelector('.calc-qty');
            const priceInput = row.querySelector('.calc-price');
            const valueInput = row.querySelector('.row-value');

            const calculate = () => {
                const qty = parseFloat(qtyInput.value) || 0;
                const price = parseFloat(priceInput.value) || 0;
                valueInput.value = (qty * price).toFixed(2);
                calculateSrvTotal();
            };

            qtyInput.addEventListener('input', calculate);
            priceInput.addEventListener('input', calculate);
        }

        return row;
    };

    const calculateSrvTotal = () => {
        const container = document.getElementById('srv-items-container');
        if (!container) return;
        
        let total = 0;
        container.querySelectorAll('.row-value').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        
        const totalEl = document.getElementById('srv-total-value');
        if (totalEl) {
            totalEl.textContent = formatCurrency(total);
        }
    };

    const getItemRowsData = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        const rows = [];
        container.querySelectorAll('tr').forEach((tr, idx) => {
            const rowData = { sno: idx + 1 };
            tr.querySelectorAll('input').forEach(input => {
                const name = input.name;
                if (name) {
                    rowData[name] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
                }
            });
            if (rowData.description) rows.push(rowData);
        });
        return rows;
    };

    const getGrnItemRowsData = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        const rows = [];
        container.querySelectorAll('tr').forEach((tr, idx) => {
            const rowData = { sno: idx + 1 };
            tr.querySelectorAll('input').forEach(input => {
                const name = input.name;
                if (name) {
                    rowData[name] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
                }
            });
            
            // Collect images for GRN items - store relative URL path
            const preview = tr.querySelector('.image-preview img');
            if (preview && preview.src) {
                // Extract relative path from full URL (e.g., /uploads/grn/...)
                try {
                    const url = new URL(preview.src);
                    if (url.pathname.startsWith('/uploads/')) {
                        rowData.images = [url.pathname];
                    }
                } catch (e) {
                    // If already a relative path
                    if (preview.src.startsWith('/uploads/')) {
                        rowData.images = [preview.src];
                    }
                }
            }
            
            if (rowData.description) rows.push(rowData);
        });
        return rows;
    };

    const loadItemRows = (type, containerId, items) => {
        const container = document.getElementById(containerId);
        if (!container || !items) return;
        
        container.innerHTML = '';
        items.forEach((item, idx) => {
            const row = createItemRow(type, idx + 1, item);
            container.appendChild(row);
        });
    };

    // Add row button handlers
    const setupAddRowButtons = () => {
        $('#add-grn-item-row').off('click').on('click', function() {
            const container = document.getElementById('grn-items-container');
            const index = container.querySelectorAll('tr').length + 1;
            container.appendChild(createItemRow('grn', index));
        });

        $('#add-srv-item-row').off('click').on('click', function() {
            const container = document.getElementById('srv-items-container');
            const index = container.querySelectorAll('tr').length + 1;
            container.appendChild(createItemRow('srv', index));
        });

        $('#add-srf-item-row').off('click').on('click', function() {
            const container = document.getElementById('srf-items-container');
            const index = container.querySelectorAll('tr').length + 1;
            container.appendChild(createItemRow('srf', index));
        });
    };

    // --- Bin Card Functions ---
    const updateBinCard = async () => {
        try {
            const items = await getAllRecords('items');
            const srv = await getAllRecords('srv');
            const srf = await getAllRecords('srf');
            const grn = await getAllRecords('grn');

            // Build comprehensive bin card data
            const binCardData = [];

            items.forEach(item => {
                // Calculate quantities from GRN (received)
                let totalReceived = 0;
                grn.forEach(g => {
                    if (g.items) {
                        g.items.forEach(gi => {
                            if (gi.code === item.code) {
                                totalReceived += gi.qtyReceived || 0;
                            }
                        });
                    }
                });

                // Calculate quantities from SRV (stored/received into store)
                let totalStored = 0;
                srv.forEach(s => {
                    if (s.items) {
                        s.items.forEach(si => {
                            if (si.code === item.code) {
                                totalStored += si.quantity || 0;
                            }
                        });
                    }
                });

                // Calculate quantities from SRF (issued)
                let totalIssued = 0;
                let lastSrfNo = '';
                srf.forEach(s => {
                    if (s.items) {
                        s.items.forEach(si => {
                            if (si.code === item.code) {
                                totalIssued += si.qtyIssued || 0;
                                lastSrfNo = s.srfNo;
                            }
                        });
                    }
                });

                // Store balance = received - issued
                const balance = totalReceived - totalIssued;

                binCardData.push({
                    codeNo: item.code,
                    nameOfItem: item.name,
                    unit: item.unit,
                    category: item.category || '-',
                    location: item.location || '-',
                    minStock: item.minStock || 0,
                    quantitySupplied: totalReceived,
                    quantityIssued: totalIssued,
                    storeBalance: balance,
                    lastRequisitionNo: lastSrfNo || '-',
                    status: balance <= (item.minStock || 0) ? 'Low Stock' : 'OK',
                    remarks: balance <= 0 ? 'Out of Stock' : (balance <= (item.minStock || 0) ? 'Reorder Required' : '')
                });
            });

            if (dataTables.binCard) {
                dataTables.binCard.clear().rows.add(binCardData).draw();
            }
        } catch (err) {
            console.error('Error updating bin card:', err);
        }
    };

    // --- Navigation ---
    const handleNavigation = (e) => {
        e.preventDefault();
        const targetId = e.target.dataset.target;
        
        navLinks.forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');

        contentSections.forEach(section => {
            section.style.display = section.id === targetId ? 'block' : 'none';
        });

        // Initialize or refresh components for the active section
        switch (targetId) {
            case 'dashboard':
                initializeDashboard();
                break;
            case 'grn':
                initializeTable('grn');
                break;
            case 'srv':
                initializeTable('srv');
                break;
            case 'srf':
                initializeTable('srf');
                break;
            case 'bin-card':
                initializeTable('binCard');
                break;
            case 'items':
                initializeTable('items');
                break;
            case 'activity-log':
                initializeTable('activityLog');
                break;
            case 'user-management':
                renderUserManagement();
                break;
        }
    };
    
    const isSectionActive = (sectionId) => {
        const section = document.getElementById(sectionId);
        return section && section.style.display !== 'none';
    };

    // --- Modal Management ---
    const openModal = (modalId) => {
        if (modals[modalId]) modals[modalId].style.display = 'block';
    };
    const closeModal = (modalId) => {
        if (!modals[modalId]) return;
        modals[modalId].style.display = 'none';
        // Reset form content when closing
        const form = forms[modalId];
        if (form) {
            form.reset();
            // Clear hidden IDs and item rows
            const hiddenId = form.querySelector('input[type="hidden"]');
            if (hiddenId) hiddenId.value = '';
            
            const itemsContainer = form.querySelector('[id$="-items-container"]');
            if (itemsContainer) itemsContainer.innerHTML = '';

            // Clear signature pads safely
            Object.values(signaturePads).forEach(pad => {
                if (pad && typeof pad.clear === 'function') {
                    pad.clear();
                }
            });
        }
    };
    
    // Attach close event listeners
    Object.keys(modals).forEach(key => {
        const modal = modals[key];
        if (modal) {
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => closeModal(key);
            }
        }
    });
    window.onclick = (event) => {
        Object.values(modals).forEach(modal => {
            if (modal && event.target == modal) {
                closeModal(modal.id.replace('-modal', ''));
            }
        });
    };

    // --- Item Management ---
    const initializeItemsLogic = () => {
        const addItemBtn = document.getElementById('add-item-btn');
        if (!addItemBtn) {
            console.warn('add-item-btn not found, skipping item logic initialization');
            return;
        }
        addItemBtn.addEventListener('click', () => {
            if (forms.item) forms.item.reset();
            const itemIdEl = document.getElementById('item-id');
            if (itemIdEl) itemIdEl.value = '';
            // Generate code
            $('#item-code').val(generateDocNumber('ITM'));
            // Reset image preview
            resetItemImagePreview();
            openModal('item');
        });

        if (forms.item) {
            forms.item.addEventListener('submit', async (e) => {
                e.preventDefault();
                const itemIdEl = document.getElementById('item-id');
                const id = itemIdEl ? itemIdEl.value : '';
                const itemData = {
                    code: document.getElementById('item-code')?.value || '',
                    name: document.getElementById('item-name')?.value || '',
                    unit: document.getElementById('item-unit')?.value || '',
                    category: document.getElementById('item-category')?.value || '',
                    minStock: parseInt(document.getElementById('item-min-stock')?.value) || 0,
                    location: document.getElementById('item-location')?.value || '',
                    description: document.getElementById('item-description')?.value || '',
                    updatedAt: new Date().toISOString()
                };

                try {
                    let savedId = id;
                    if (id) {
                        await updateRecord('items', { id: Number(id), ...itemData });
                        logActivity('Item Update', `Updated item: ${itemData.name} (${itemData.code})`);
                        showToast('Item updated successfully!');
                    } else {
                        itemData.createdAt = new Date().toISOString();
                        savedId = await addRecord('items', itemData);
                        logActivity('Item Create', `Created new item: ${itemData.name} (${itemData.code})`);
                        showToast('Item created successfully!');
                    }
                    
                    // Handle image upload if there's new image data
                    const imageData = document.getElementById('item-image-data')?.value;
                    if (imageData && savedId) {
                        try {
                            await uploadItemImage(savedId, imageData);
                        } catch (imgErr) {
                            console.error('Error uploading image:', imgErr);
                            showToast('Item saved but image upload failed');
                        }
                    }
                    
                    closeModal('item');
                    await refreshTable('items');
                    // Update items cache
                    itemsCache = await getAllRecords('items');
                    await createItemDatalist();
                    await updateBinCard();
                } catch (err) {
                    console.error('Error saving item:', err);
                    showToast('Error saving item: ' + err.message);
                }
            });
        }
        
        // Initialize image upload handlers
        initializeItemImageHandlers();
    };
    
    // --- Item Image Upload Functions ---
    const resetItemImagePreview = () => {
        const preview = document.getElementById('item-image-preview');
        const removeBtn = document.getElementById('item-remove-image-btn');
        const imageDataInput = document.getElementById('item-image-data');
        
        if (preview) {
            preview.innerHTML = '<i class="fas fa-image"></i><span>No image</span>';
            preview.classList.remove('has-image');
        }
        if (removeBtn) removeBtn.style.display = 'none';
        if (imageDataInput) imageDataInput.value = '';
    };
    
    const setItemImagePreview = (imageUrl) => {
        const preview = document.getElementById('item-image-preview');
        const removeBtn = document.getElementById('item-remove-image-btn');
        
        if (preview && imageUrl) {
            preview.innerHTML = `<img src="${imageUrl}" alt="Item image">`;
            preview.classList.add('has-image');
        }
        if (removeBtn) removeBtn.style.display = 'inline-flex';
    };
    
    const uploadItemImage = async (itemId, imageData) => {
        const response = await fetch(`/api/items/${itemId}/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageData })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        return response.json();
    };
    
    const deleteItemImage = async (itemId) => {
        const response = await fetch(`/api/items/${itemId}/image`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }
        
        return response.json();
    };
    
    const initializeItemImageHandlers = () => {
        // File upload handler
        const fileInput = document.getElementById('item-image-upload');
        if (fileInput) {
            fileInput.addEventListener('change', handleImageFileSelect);
        }
        
        // Camera button handler
        const cameraBtn = document.getElementById('item-camera-btn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', openCameraModal);
        }
        
        // Remove image button
        const removeBtn = document.getElementById('item-remove-image-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', async () => {
                const itemId = document.getElementById('item-id')?.value;
                if (itemId) {
                    try {
                        await deleteItemImage(itemId);
                        showToast('Image removed');
                    } catch (err) {
                        console.error('Error removing image:', err);
                    }
                }
                resetItemImagePreview();
            });
        }
        
        // Camera modal handlers
        initializeCameraModal();
    };
    
    const handleImageFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
            showToast('Invalid file type. Use JPG, PNG, GIF, or WebP');
            return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image too large. Maximum 2MB allowed');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            const imageData = evt.target.result;
            document.getElementById('item-image-data').value = imageData;
            setItemImagePreview(imageData);
        };
        reader.readAsDataURL(file);
    };
    
    // --- Camera Capture Functions ---
    let cameraStream = null;
    let grnCameraRowIndex = null; // Track which GRN row is using the camera
    
    const openCameraModal = async () => {
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-video');
        const preview = document.getElementById('camera-preview');
        const captureBtn = document.getElementById('camera-capture-btn');
        const retakeBtn = document.getElementById('camera-retake-btn');
        const useBtn = document.getElementById('camera-use-btn');
        
        // Reset state
        if (preview) preview.style.display = 'none';
        if (video) video.style.display = 'block';
        if (captureBtn) captureBtn.style.display = 'inline-flex';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (useBtn) useBtn.style.display = 'none';
        
        try {
            // Request camera access - prefer back camera on mobile
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            if (video) {
                video.srcObject = cameraStream;
            }
            
            if (modal) modal.style.display = 'block';
        } catch (err) {
            console.error('Camera access denied:', err);
            showToast('Camera access denied. Please allow camera permissions.');
        }
    };
    
    const closeCameraModal = () => {
        const modal = document.getElementById('camera-modal');
        if (modal) modal.style.display = 'none';
        
        // Stop camera stream
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    };
    
    const capturePhoto = () => {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const preview = document.getElementById('camera-preview');
        const capturedImage = document.getElementById('captured-image');
        const captureBtn = document.getElementById('camera-capture-btn');
        const retakeBtn = document.getElementById('camera-retake-btn');
        const useBtn = document.getElementById('camera-use-btn');
        
        if (!video || !canvas) return;
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Show preview
        if (capturedImage) capturedImage.src = imageData;
        if (video) video.style.display = 'none';
        if (preview) preview.style.display = 'block';
        if (captureBtn) captureBtn.style.display = 'none';
        if (retakeBtn) retakeBtn.style.display = 'inline-flex';
        if (useBtn) useBtn.style.display = 'inline-flex';
    };
    
    const retakePhoto = () => {
        const video = document.getElementById('camera-video');
        const preview = document.getElementById('camera-preview');
        const captureBtn = document.getElementById('camera-capture-btn');
        const retakeBtn = document.getElementById('camera-retake-btn');
        const useBtn = document.getElementById('camera-use-btn');
        
        if (video) video.style.display = 'block';
        if (preview) preview.style.display = 'none';
        if (captureBtn) captureBtn.style.display = 'inline-flex';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (useBtn) useBtn.style.display = 'none';
    };
    
    const usePhoto = () => {
        const capturedImage = document.getElementById('captured-image');
        if (capturedImage && capturedImage.src) {
            // Check if this is for a GRN item image
            if (typeof grnCameraRowIndex !== 'undefined' && grnCameraRowIndex !== null) {
                const imageData = capturedImage.src;
                const grnId = document.getElementById('grn-id')?.value || 'new';
                uploadGrnItemImage(grnId, grnCameraRowIndex, imageData);
                setGrnItemImagePreview(grnCameraRowIndex, imageData);
                grnCameraRowIndex = null;
            } else {
                // Default behavior for item images
                document.getElementById('item-image-data').value = capturedImage.src;
                setItemImagePreview(capturedImage.src);
            }
        }
        closeCameraModal();
    };
    
    const initializeCameraModal = () => {
        // Cancel button
        const cancelBtn = document.getElementById('camera-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeCameraModal);
        }
        
        // Capture button
        const captureBtn = document.getElementById('camera-capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }
        
        // Retake button
        const retakeBtn = document.getElementById('camera-retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', retakePhoto);
        }
        
        // Use photo button
        const useBtn = document.getElementById('camera-use-btn');
        if (useBtn) {
            useBtn.addEventListener('click', usePhoto);
        }
        
        // Close button
        const closeBtn = document.querySelector('#camera-modal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCameraModal);
        }
    };
    
    const fetchItems = async () => {
        try {
            return await getAllRecords('items');
        } catch (err) {
            console.error("Error fetching items: ", err);
            return [];
        }
    };

    const createItemDatalist = async () => {
        const items = await fetchItems();
        const datalist = document.createElement('datalist');
        datalist.id = 'item-list';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.dataset.code = item.code;
            option.dataset.unit = item.unit;
            datalist.appendChild(option);
        });
        document.body.appendChild(datalist);
    };

    // --- Form & Table Logic (Generic Handlers) ---
    const refreshTable = async (dbName) => {
        if (dataTables[dbName]) {
            // binCard is computed, not a real store
            if (dbName === 'binCard') {
                await updateBinCard();
                return;
            }
            // Map dbName to actual store name (handle activityLog -> activity_log)
            const storeNameMap = { 'activityLog': 'activity_log' };
            const storeName = storeNameMap[dbName] || dbName;
            const data = await getAllRecords(storeName);
            dataTables[dbName].clear().rows.add(data).draw();
        }
         // Refresh related components
        if (dbName === 'items') {
             await createItemDatalist(); // Recreate datalist when items change
        }
        if (dbName === 'srv' || dbName === 'srf' || dbName === 'grn') {
            await updateBinCard();
            if (isSectionActive('dashboard')) {
                await initializeDashboardCharts();
            }
        }
    };

    const handleDelete = async (dbName, id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            await deleteRecord(dbName, id);
            logActivity(`${dbName.toUpperCase()} Delete`, `Deleted record with ID: ${id}`);
            await refreshTable(dbName);
        } catch (err) {
            console.error(`Error deleting ${dbName} record:`, err);
        }
    };

    const createActionButtons = (dbName, data) => {
        return `
            <button class="btn btn-sm btn-info btn-view" data-db="${dbName}" data-id="${data.id}" title="View Details"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-edit" data-db="${dbName}" data-id="${data.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger btn-delete" data-db="${dbName}" data-id="${data.id}" title="Delete"><i class="fas fa-trash"></i></button>
        `;
    };
    
    // --- View Record Modal ---
    const viewRecordTemplates = {
        grn: (doc) => `
            <div class="view-record-header">
                <h3>GOODS RECEIVED NOTE (GRN)</h3>
                <p class="view-subtitle">Bugema University - Store Department</p>
            </div>
            <div class="view-record-body">
                <div class="view-section">
                    <h4>Header Information</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>GRN/DRN No:</label><span>${doc.drnNo || '-'}</span></div>
                        <div class="view-field"><label>LPO No:</label><span>${doc.lpoNo || '-'}</span></div>
                        <div class="view-field"><label>Issue Date:</label><span>${doc.issueDate || '-'}</span></div>
                        <div class="view-field"><label>Delivery Date:</label><span>${doc.deliveryDate || '-'}</span></div>
                    </div>
                </div>
                <div class="view-section">
                    <h4>Supplier Information</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Supplier Name:</label><span>${doc.supplierName || '-'}</span></div>
                        <div class="view-field"><label>Carrier:</label><span>${doc.carrier || '-'}</span></div>
                        <div class="view-field"><label>Waybill No:</label><span>${doc.waybillNo || '-'}</span></div>
                        <div class="view-field"><label>Invoice No:</label><span>${doc.invoiceNo || '-'}</span></div>
                    </div>
                </div>
                <div class="view-section">
                    <h4>Items Received</h4>
                    <table class="view-items-table">
                        <thead>
                            <tr>
                                <th>S/No</th>
                                <th>Description</th>
                                <th>Code</th>
                                <th>Qty Ordered</th>
                                <th>Qty Received</th>
                                <th>Unit</th>
                                <th>Remarks</th>
                                <th>Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(doc.items || []).map((item, i) => `
                                <tr>
                                    <td>${item.sno || i + 1}</td>
                                    <td>${item.description || '-'}</td>
                                    <td>${item.code || '-'}</td>
                                    <td>${item.qtyOrdered || 0}</td>
                                    <td>${item.qtyReceived || 0}</td>
                                    <td>${item.unit || '-'}</td>
                                    <td>${item.remark || '-'}</td>
                                    <td>${item.images && item.images.length > 0 ? `<img src="${item.images[0]}" alt="Item image" class="grn-item-thumbnail" onclick="window.open('${item.images[0]}', '_blank')">` : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="view-section">
                    <h4>Verification & Examination</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Examined By:</label><span>${doc.examinedBy || '-'}</span></div>
                        <div class="view-field"><label>Department:</label><span>${doc.examinedDept || '-'}</span></div>
                        <div class="view-field"><label>Received By:</label><span>${doc.receivedBy || '-'}</span></div>
                        <div class="view-field"><label>Department:</label><span>${doc.receivedDept || '-'}</span></div>
                    </div>
                    ${doc.examinedSig ? `<div class="view-signature"><label>Examined Signature:</label><img src="${doc.examinedSig}" alt="Signature"></div>` : ''}
                    ${doc.receivedSig ? `<div class="view-signature"><label>Received Signature:</label><img src="${doc.receivedSig}" alt="Signature"></div>` : ''}
                </div>
                <div class="view-section">
                    <h4>Distribution</h4>
                    <div class="view-field full-width"><span>${doc.distribution || '-'}</span></div>
                </div>
            </div>
        `,
        srv: (doc) => `
            <div class="view-record-header">
                <h3>STORE RECEIPT VOUCHER (SRV)</h3>
                <p class="view-subtitle">Bugema University - Store Department</p>
            </div>
            <div class="view-record-body">
                <div class="view-section">
                    <h4>Header Information</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>SRV No:</label><span>${doc.docNum || '-'}</span></div>
                        <div class="view-field"><label>Date:</label><span>${doc.date || '-'}</span></div>
                        <div class="view-field"><label>PO/LSO No:</label><span>${doc.poLsoNo || '-'}</span></div>
                        <div class="view-field"><label>Department:</label><span>${doc.department || '-'}</span></div>
                        <div class="view-field"><label>Source:</label><span>${doc.source || '-'}</span></div>
                    </div>
                </div>
                <div class="view-section">
                    <h4>Items</h4>
                    <table class="view-items-table">
                        <thead>
                            <tr>
                                <th>S/No</th>
                                <th>Description</th>
                                <th>Code</th>
                                <th>Unit</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Value</th>
                                <th>Ledger Folio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(doc.items || []).map((item, i) => `
                                <tr>
                                    <td>${item.sno || i + 1}</td>
                                    <td>${item.description || '-'}</td>
                                    <td>${item.code || '-'}</td>
                                    <td>${item.unit || '-'}</td>
                                    <td>${item.quantity || 0}</td>
                                    <td>${formatCurrency(item.unitPrice || 0)}</td>
                                    <td>${formatCurrency(item.value || 0)}</td>
                                    <td>${item.ledgerFolio || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="6" class="text-right"><strong>Total Value:</strong></td>
                                <td colspan="2"><strong>${formatCurrency(doc.totalValue || 0)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="view-section">
                    <h4>Reference Information</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Order No:</label><span>${doc.orderNo || '-'}</span></div>
                        <div class="view-field"><label>Order Date:</label><span>${doc.orderDate || '-'}</span></div>
                        <div class="view-field"><label>Invoice No:</label><span>${doc.invoiceNo || '-'}</span></div>
                        <div class="view-field"><label>Invoice Date:</label><span>${doc.invoiceDate || '-'}</span></div>
                    </div>
                </div>
                <div class="view-section">
                    <h4>Certification</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Certified By:</label><span>${doc.certifiedBy || '-'}</span></div>
                        <div class="view-field"><label>Designation:</label><span>${doc.certifiedDesignation || '-'}</span></div>
                        <div class="view-field"><label>Date:</label><span>${doc.certifiedDate || '-'}</span></div>
                    </div>
                    ${doc.certifiedSig ? `<div class="view-signature"><label>Signature:</label><img src="${doc.certifiedSig}" alt="Signature"></div>` : ''}
                </div>
            </div>
        `,
        srf: (doc) => `
            <div class="view-record-header">
                <h3>STORES REQUISITION FORM (SRF)</h3>
                <p class="view-subtitle">Bugema University - Store Department</p>
            </div>
            <div class="view-record-body">
                <div class="view-section">
                    <h4>Requester Information</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>SRF No:</label><span>${doc.srfNo || '-'}</span></div>
                        <div class="view-field"><label>Date:</label><span>${doc.date || '-'}</span></div>
                        <div class="view-field"><label>Cost Code:</label><span>${doc.costCode || '-'}</span></div>
                        <div class="view-field"><label>Department/Unit:</label><span>${doc.departmentUnit || '-'}</span></div>
                        <div class="view-field"><label>Requester Name:</label><span>${doc.requesterName || '-'}</span></div>
                        <div class="view-field"><label>Designation:</label><span>${doc.designation || '-'}</span></div>
                    </div>
                </div>
                <div class="view-section">
                    <h4>Items Requested</h4>
                    <table class="view-items-table">
                        <thead>
                            <tr>
                                <th>S/No</th>
                                <th>Description</th>
                                <th>Code</th>
                                <th>Unit</th>
                                <th>Qty Requested</th>
                                <th>Qty Issued</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(doc.items || []).map((item, i) => `
                                <tr>
                                    <td>${item.sno || i + 1}</td>
                                    <td>${item.description || '-'}</td>
                                    <td>${item.code || '-'}</td>
                                    <td>${item.unit || '-'}</td>
                                    <td>${item.qtyRequested || 0}</td>
                                    <td>${item.qtyIssued || 0}</td>
                                    <td>${item.remarks || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="view-section">
                    <h4>Approval</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Approved By:</label><span>${doc.approvedBy || '-'}</span></div>
                        <div class="view-field"><label>Approval Date:</label><span>${doc.approvalDate || '-'}</span></div>
                    </div>
                    ${doc.approvalSig ? `<div class="view-signature"><label>Approval Signature:</label><img src="${doc.approvalSig}" alt="Signature"></div>` : ''}
                </div>
                <div class="view-section">
                    <h4>Store Processing</h4>
                    <div class="view-grid">
                        <div class="view-field"><label>Issued By:</label><span>${doc.issuedBy || '-'}</span></div>
                        <div class="view-field"><label>Issue Date:</label><span>${doc.issueDate || '-'}</span></div>
                        <div class="view-field"><label>Received By:</label><span>${doc.receivedBy || '-'}</span></div>
                    </div>
                    ${doc.storeSig ? `<div class="view-signature"><label>Store Signature:</label><img src="${doc.storeSig}" alt="Signature"></div>` : ''}
                    ${doc.receiverSig ? `<div class="view-signature"><label>Receiver Signature:</label><img src="${doc.receiverSig}" alt="Signature"></div>` : ''}
                </div>
            </div>
        `,
        items: (doc) => `
            <div class="view-record-header">
                <h3>ITEM DETAILS</h3>
                <p class="view-subtitle">Inventory Master Record</p>
            </div>
            <div class="view-record-body">
                <div class="view-section">
                    ${doc.image_url ? `<div class="view-item-image"><img src="${doc.image_url}" alt="${doc.name}"></div>` : ''}
                    <div class="view-grid">
                        <div class="view-field"><label>Item Code:</label><span>${doc.code || '-'}</span></div>
                        <div class="view-field"><label>Item Name:</label><span>${doc.name || '-'}</span></div>
                        <div class="view-field"><label>Unit:</label><span>${doc.unit || '-'}</span></div>
                        <div class="view-field"><label>Category:</label><span>${doc.category || '-'}</span></div>
                        <div class="view-field"><label>Min Stock Level:</label><span>${doc.minStock || 0}</span></div>
                        <div class="view-field"><label>Storage Location:</label><span>${doc.location || '-'}</span></div>
                        <div class="view-field full-width"><label>Description:</label><span>${doc.description || '-'}</span></div>
                        <div class="view-field"><label>Created:</label><span>${doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-'}</span></div>
                        <div class="view-field"><label>Last Updated:</label><span>${doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '-'}</span></div>
                    </div>
                </div>
            </div>
        `
    };
    
    const openViewModal = async (dbName, id) => {
        const storeNameMap = { 'activityLog': 'activity_log' };
        const storeName = storeNameMap[dbName] || dbName;
        
        try {
            const records = await getAllRecords(storeName);
            const doc = records.find(r => r.id === id);
            
            if (!doc) {
                showToast('Record not found');
                return;
            }
            
            const template = viewRecordTemplates[dbName];
            if (!template) {
                showToast('View not available for this record type');
                return;
            }
            
            const titleMap = {
                grn: 'Goods Received Note',
                srv: 'Store Receipt Voucher',
                srf: 'Stores Requisition Form',
                items: 'Item Details'
            };
            
            const content = template(doc);
            
            // Create modal HTML
            const modalHtml = `
                <div id="view-record-modal" class="modal" style="display:block;">
                    <div class="modal-content modal-large">
                        <span class="close-btn" onclick="document.getElementById('view-record-modal').remove()">&times;</span>
                        <div id="view-record-content" class="view-record-container">
                            ${content}
                        </div>
                        <div class="form-actions view-record-actions">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('view-record-modal').remove()">Close</button>
                            <button type="button" class="btn btn-info" onclick="printRecord()"><i class="fas fa-print"></i> Print</button>
                            <button type="button" class="btn btn-danger" onclick="exportRecordPDF('${titleMap[dbName]}')"><i class="fas fa-file-pdf"></i> Export PDF</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('view-record-modal');
            if (existingModal) existingModal.remove();
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
        } catch (err) {
            console.error('Error opening view modal:', err);
            showToast('Error loading record');
        }
    };
    
    // Print record function
    window.printRecord = () => {
        const content = document.getElementById('view-record-content');
        if (!content) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>BMU Store - Print Record</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    .view-record-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3c72; padding-bottom: 15px; }
                    .view-record-header h3 { color: #1e3c72; font-size: 18px; margin-bottom: 5px; }
                    .view-subtitle { color: #666; font-size: 12px; }
                    .view-section { margin-bottom: 20px; }
                    .view-section h4 { background: #f5f5f5; padding: 8px 12px; font-size: 14px; color: #1e3c72; border-left: 3px solid #1e3c72; margin-bottom: 10px; }
                    .view-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .view-field { display: flex; flex-direction: column; padding: 5px 0; }
                    .view-field.full-width { grid-column: span 2; }
                    .view-field label { font-weight: bold; font-size: 11px; color: #666; margin-bottom: 2px; }
                    .view-field span { font-size: 13px; }
                    .view-items-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    .view-items-table th, .view-items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .view-items-table th { background: #1e3c72; color: white; }
                    .view-items-table tbody tr:nth-child(even) { background: #f9f9f9; }
                    .view-signature { margin-top: 10px; }
                    .view-signature label { font-weight: bold; font-size: 11px; color: #666; }
                    .view-signature img { max-width: 200px; max-height: 80px; border: 1px solid #ddd; margin-top: 5px; }
                    .view-item-image { text-align: center; margin-bottom: 15px; }
                    .view-item-image img { max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 8px; }
                    .text-right { text-align: right; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${content.innerHTML}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };
    
    // Export record as PDF using pdfmake
    window.exportRecordPDF = (title) => {
        const content = document.getElementById('view-record-content');
        if (!content) return;
        
        // Use html2canvas and jsPDF if available, otherwise use print
        if (typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
            html2canvas(content).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                const imgWidth = 190;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            });
        } else {
            // Fallback to print as PDF
            showToast('Please use Print and save as PDF');
            printRecord();
        }
    };

    // Edit handlers for different record types
    const editHandlers = {
        grn: (doc) => {
            $('#grn-id').val(doc.id);
            $('#grn-drn-no').val(doc.drnNo);
            $('#grn-lpo-no').val(doc.lpoNo);
            $('#grn-issue-date').val(doc.issueDate);
            $('#grn-delivery-date').val(doc.deliveryDate);
            $('#grn-supplier-name').val(doc.supplierName);
            $('#grn-carrier').val(doc.carrier);
            $('#grn-waybill-no').val(doc.waybillNo);
            $('#grn-invoice-no').val(doc.invoiceNo);
            $('#grn-examined-by').val(doc.examinedBy);
            $('#grn-examined-dept').val(doc.examinedDept);
            $('#grn-received-by').val(doc.receivedBy);
            $('#grn-received-dept').val(doc.receivedDept);
            $('#grn-distribution').val(doc.distribution);
            
            // Load items
            loadItemRows('grn', 'grn-items-container', doc.items || []);
            
            // Load signatures if they exist
            if (doc.examinedSig) loadSignatureData('grn-examined-sig', doc.examinedSig);
            if (doc.receivedSig) loadSignatureData('grn-received-sig', doc.receivedSig);
            
            openModal('grn');
        },
        srv: (doc) => {
            $('#srv-id').val(doc.id);
            $('#srv-doc-num').val(doc.docNum);
            $('#srv-date').val(doc.date);
            $('#srv-po-lso-no').val(doc.poLsoNo);
            $('#srv-department').val(doc.department);
            $('#srv-source').val(doc.source);
            $('#srv-order-no').val(doc.orderNo);
            $('#srv-order-date').val(doc.orderDate);
            $('#srv-invoice-no').val(doc.invoiceNo);
            $('#srv-invoice-date').val(doc.invoiceDate);
            $('#srv-certified-by').val(doc.certifiedBy);
            $('#srv-certified-designation').val(doc.certifiedDesignation);
            $('#srv-certified-date').val(doc.certifiedDate);
            
            // Load items
            loadItemRows('srv', 'srv-items-container', doc.items || []);
            calculateSrvTotal();
            
            // Load signature
            if (doc.certifiedSig) loadSignatureData('srv-certified-sig', doc.certifiedSig);
            
            openModal('srv');
        },
        srf: (doc) => {
            $('#srf-id').val(doc.id);
            $('#srf-no').val(doc.srfNo);
            $('#srf-date').val(doc.date);
            $('#srf-code').val(doc.costCode);
            $('#srf-department').val(doc.departmentUnit);
            $('#srf-requester').val(doc.requesterName);
            $('#srf-designation').val(doc.designation);
            $('#srf-approved-by').val(doc.approvedBy);
            $('#srf-approval-date').val(doc.approvalDate);
            $('#srf-issued-by').val(doc.issuedBy);
            $('#srf-issue-date').val(doc.issueDate);
            $('#srf-received-by').val(doc.receivedBy);
            
            // Load items
            loadItemRows('srf', 'srf-items-container', doc.items || []);
            
            // Load signatures
            if (doc.requesterSig) loadSignatureData('srf-requester-sig', doc.requesterSig);
            if (doc.approvalSig) loadSignatureData('srf-approval-sig', doc.approvalSig);
            if (doc.storeSig) loadSignatureData('srf-store-sig', doc.storeSig);
            if (doc.receiverSig) loadSignatureData('srf-receiver-sig', doc.receiverSig);
            
            openModal('srf');
        },
        items: (doc) => {
            $('#item-id').val(doc.id);
            $('#item-code').val(doc.code);
            $('#item-name').val(doc.name);
            $('#item-unit').val(doc.unit);
            $('#item-category').val(doc.category);
            $('#item-min-stock').val(doc.minStock);
            $('#item-location').val(doc.location);
            $('#item-description').val(doc.description);
            
            // Load image if exists
            resetItemImagePreview();
            if (doc.image_url) {
                setItemImagePreview(doc.image_url);
            }
            
            openModal('item');
        }
    };
    
    // --- DataTables Initializers ---
    const tableConfigs = {
        grn: {
            columns: [
                { data: 'drnNo', title: 'GRN/DRN No' },
                { data: 'lpoNo', title: 'LPO No' },
                { data: 'supplierName', title: 'Supplier' },
                { data: 'deliveryDate', title: 'Delivery Date' },
                { data: 'items', title: 'Items', render: (d) => d ? d.length + ' item(s)' : '0' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('grn', d) }
            ]
        },
        srv: {
            columns: [
                { data: 'docNum', title: 'SRV No' },
                { data: 'department', title: 'Department' },
                { data: 'source', title: 'Source/Supplier' },
                { data: 'date', title: 'Date' },
                { data: 'totalValue', title: 'Total Value', render: (d) => formatCurrency(d) },
                { data: 'items', title: 'Items', render: (d) => d ? d.length + ' item(s)' : '0' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srv', d) }
            ]
        },
        srf: {
            columns: [
                { data: 'srfNo', title: 'SRF No' },
                { data: 'departmentUnit', title: 'Department/Unit' },
                { data: 'requesterName', title: 'Requester' },
                { data: 'designation', title: 'Designation' },
                { data: 'date', title: 'Date' },
                { data: 'items', title: 'Items', render: (d) => d ? d.length + ' item(s)' : '0' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srf', d) }
            ]
        },
        binCard: {
            columns: [
                { data: 'codeNo', title: 'Code No' },
                { data: 'nameOfItem', title: 'Item Name' },
                { data: 'unit', title: 'Unit' },
                { data: 'category', title: 'Category' },
                { data: 'quantitySupplied', title: 'Qty Received' },
                { data: 'quantityIssued', title: 'Qty Issued' },
                { data: 'storeBalance', title: 'Balance', render: (d, t, r) => {
                    const cls = d <= 0 ? 'badge-danger' : (d <= r.minStock ? 'badge-warning' : 'badge-success');
                    return `<span class="badge ${cls}">${d}</span>`;
                }},
                { data: 'location', title: 'Location' },
                { data: 'lastRequisitionNo', title: 'Last SRF No' },
                { data: 'remarks', title: 'Remarks' }
            ]
        },
        items: {
            columns: [
                { data: 'image_url', title: 'Image', render: (d) => {
                    if (d) {
                        return `<img src="${d}" alt="Item" class="item-thumbnail">`;
                    }
                    return '<div class="item-no-image"><i class="fas fa-image"></i></div>';
                }},
                { data: 'code', title: 'Code' },
                { data: 'name', title: 'Name' },
                { data: 'unit', title: 'Unit' },
                { data: 'category', title: 'Category' },
                { data: 'minStock', title: 'Min Stock', defaultContent: '0' },
                { data: 'location', title: 'Location', defaultContent: '-' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('items', d) }
            ]
        },
        activityLog: {
            columns: [
                { data: 'timestamp', title: 'Timestamp', render: (d) => d ? new Date(d).toLocaleString() : '-' },
                { data: 'username', title: 'User', defaultContent: 'System' },
                { data: 'action', title: 'Action' },
                { data: 'details', title: 'Details', defaultContent: '-' }
            ],
            options: { order: [[0, 'desc']] }
        }
    };
    
    // Common DataTables button configuration for export
    const getTableButtons = (tableName) => {
        return {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="fas fa-copy"></i> Copy',
                    className: 'btn btn-sm btn-secondary',
                    exportOptions: { columns: ':not(:last-child)' }
                },
                {
                    extend: 'excel',
                    text: '<i class="fas fa-file-excel"></i> Excel',
                    className: 'btn btn-sm btn-success',
                    title: `BMU Store - ${tableName}`,
                    exportOptions: { columns: ':not(:last-child)' }
                },
                {
                    extend: 'pdf',
                    text: '<i class="fas fa-file-pdf"></i> PDF',
                    className: 'btn btn-sm btn-danger',
                    title: `BMU Store - ${tableName}`,
                    exportOptions: { columns: ':not(:last-child)' },
                    customize: function(doc) {
                        doc.defaultStyle.fontSize = 9;
                        doc.styles.tableHeader.fontSize = 10;
                        doc.styles.tableHeader.fillColor = '#1e3c72';
                    }
                },
                {
                    extend: 'print',
                    text: '<i class="fas fa-print"></i> Print',
                    className: 'btn btn-sm btn-info',
                    title: `BMU Store - ${tableName}`,
                    exportOptions: { columns: ':not(:last-child)' }
                }
            ]
        };
    };
    
    const initializeTable = async (dbName) => {
        if (dataTables[dbName]) {
            // Already initialized, just refresh data
            await refreshTable(dbName);
            return;
        }

        // Map dbName to actual table ID (handle hyphenated IDs)
        const tableIdMap = {
            'binCard': 'bin-card-table',
            'activityLog': 'activity-log-table'
        };
        const tableId = tableIdMap[dbName] || `${dbName}-table`;
        const config = tableConfigs[dbName];
        if (!config) return;

        // Check if table element exists
        const tableEl = document.getElementById(tableId);
        if (!tableEl) {
            console.warn(`Table element #${tableId} not found`);
            return;
        }

        // Handle binCard specially - it's computed, not a store
        let data;
        if (dbName === 'binCard') {
            const items = await getAllRecords('items');
            const grn = await getAllRecords('grn');
            const srf = await getAllRecords('srf');
            
            data = items.map(item => {
                let totalReceived = 0;
                grn.forEach(g => {
                    if (g.items) {
                        g.items.forEach(gi => {
                            if (gi.code === item.code) totalReceived += gi.qtyReceived || 0;
                        });
                    }
                });
                
                let totalIssued = 0;
                let lastSrfNo = '';
                srf.forEach(s => {
                    if (s.items) {
                        s.items.forEach(si => {
                            if (si.code === item.code) {
                                totalIssued += si.qtyIssued || 0;
                                lastSrfNo = s.srfNo;
                            }
                        });
                    }
                });
                
                const balance = totalReceived - totalIssued;
                
                return {
                    codeNo: item.code,
                    nameOfItem: item.name,
                    unit: item.unit,
                    category: item.category || '-',
                    quantitySupplied: totalReceived,
                    quantityIssued: totalIssued,
                    storeBalance: totalReceived - totalIssued,
                    location: item.location || '-',
                    minStock: item.minStock || 0,
                    lastRequisitionNo: lastSrfNo || '-',
                    remarks: balance <= 0 ? 'Out of Stock' : (balance <= (item.minStock || 0) ? 'Reorder Required' : '')
                };
            });
        } else {
            // Map store names
            const storeNameMap = { 'activityLog': 'activity_log' };
            const storeName = storeNameMap[dbName] || dbName;
            data = await getAllRecords(storeName);
        }

        // Map table names for display
        const tableDisplayNames = {
            'grn': 'Goods Received Notes',
            'srv': 'Store Receipt Vouchers',
            'srf': 'Store Requisition Forms',
            'binCard': 'Bin Card / Stock Status',
            'items': 'Items Master',
            'activityLog': 'Activity Log'
        };

        const options = {
            data: data,
            columns: config.columns,
            responsive: true,
            destroy: true, // Allow re-initialization
            ...getTableButtons(tableDisplayNames[dbName] || dbName),
            ...config.options
        };
        
        dataTables[dbName] = $(`#${tableId}`).DataTable(options);
        
        // Add event listeners for view/edit/delete after table is created (skip for binCard)
        if (dbName !== 'binCard') {
            $(`#${tableId} tbody`).off('click', '.btn-delete').on('click', '.btn-delete', function () {
                const id = $(this).data('id');
                handleDelete(dbName, id);
            });

            $(`#${tableId} tbody`).off('click', '.btn-edit').on('click', '.btn-edit', async function () {
                const id = $(this).data('id');
                if (!id) {
                    console.error('No ID found for edit button');
                    return;
                }
                const storeNameMap = { 'activityLog': 'activity_log' };
                const storeName = storeNameMap[dbName] || dbName;
                const records = await getAllRecords(storeName);
                const doc = records.find(record => record.id === id || record.id === parseInt(id));
                if (!doc) {
                    showToast('Record not found');
                    return;
                }
                // This needs specific edit handlers per form type
                if (editHandlers[dbName]) {
                    editHandlers[dbName](doc);
                }
            });
            
            // View button handler
            $(`#${tableId} tbody`).off('click', '.btn-view').on('click', '.btn-view', function () {
                const id = $(this).data('id');
                openViewModal(dbName, id);
            });
        }
    };

    // --- GRN Logic ---
    $('#add-grn-btn').on('click', function() {
        if ($('#grn-form').length) $('#grn-form')[0].reset();
        $('#grn-id').val('');
        $('#grn-drn-no').val(generateDocNumber('GRN'));
        $('#grn-issue-date').val(new Date().toISOString().split('T')[0]);
        $('#grn-items-container').empty();
        // Add first empty row
        $('#grn-items-container').append(createItemRow('grn', 1));
        // Clear signatures safely
        Object.values(signaturePads).forEach(pad => {
            if (pad && typeof pad.clear === 'function') pad.clear();
        });
        openModal('grn');
    });

    $('#grn-form').on('submit', async function(e) {
        e.preventDefault();
        const id = $('#grn-id').val();
        const grnData = {
            drnNo: $('#grn-drn-no').val(),
            lpoNo: $('#grn-lpo-no').val(),
            issueDate: $('#grn-issue-date').val(),
            deliveryDate: $('#grn-delivery-date').val(),
            supplierName: $('#grn-supplier-name').val(),
            carrier: $('#grn-carrier').val(),
            waybillNo: $('#grn-waybill-no').val(),
            invoiceNo: $('#grn-invoice-no').val(),
            items: getGrnItemRowsData('grn-items-container'),
            examinedBy: $('#grn-examined-by').val(),
            examinedDept: $('#grn-examined-dept').val(),
            examinedSig: getSignatureData('grn-examined-sig'),
            receivedBy: $('#grn-received-by').val(),
            receivedDept: $('#grn-received-dept').val(),
            receivedSig: getSignatureData('grn-received-sig'),
            distribution: $('#grn-distribution').val(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            if (id) {
                await updateRecord('grn', { id: Number(id), ...grnData });
                logActivity('GRN Update', `Updated GRN: ${grnData.drnNo}`);
                showToast('GRN updated successfully!');
            } else {
                grnData.createdAt = new Date().toISOString();
                await addRecord('grn', grnData);
                logActivity('GRN Create', `Created GRN: ${grnData.drnNo}`);
                showToast('GRN saved successfully!');
            }
            closeModal('grn');
            await refreshTable('grn');
            await updateBinCard();
        } catch (err) {
            showToast('Error saving GRN: ' + err.message);
        }
    });

    // --- SRV Logic ---
    $('#add-srv-btn').on('click', function() {
        if ($('#srv-form').length) $('#srv-form')[0].reset();
        $('#srv-id').val('');
        $('#srv-doc-num').val(generateDocNumber('SRV'));
        $('#srv-date').val(new Date().toISOString().split('T')[0]);
        $('#srv-items-container').empty();
        $('#srv-items-container').append(createItemRow('srv', 1));
        $('#srv-total-value').text('₦0.00');
        Object.values(signaturePads).forEach(pad => pad && pad.clear());
        openModal('srv');
    });

    $('#srv-form').on('submit', async function(e) {
        e.preventDefault();
        const id = $('#srv-id').val();
        const items = getItemRowsData('srv-items-container');
        const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
        
        const srvData = {
            docNum: $('#srv-doc-num').val(),
            date: $('#srv-date').val(),
            poLsoNo: $('#srv-po-lso-no').val(),
            department: $('#srv-department').val(),
            source: $('#srv-source').val(),
            items: items,
            totalValue: totalValue,
            orderNo: $('#srv-order-no').val(),
            orderDate: $('#srv-order-date').val(),
            invoiceNo: $('#srv-invoice-no').val(),
            invoiceDate: $('#srv-invoice-date').val(),
            certifiedBy: $('#srv-certified-by').val(),
            certifiedDesignation: $('#srv-certified-designation').val(),
            certifiedDate: $('#srv-certified-date').val(),
            certifiedSig: getSignatureData('srv-certified-sig'),
            updatedAt: new Date().toISOString()
        };
        
        try {
            if (id) {
                await updateRecord('srv', { id: Number(id), ...srvData });
                logActivity('SRV Update', `Updated SRV: ${srvData.docNum}`);
                showToast('SRV updated successfully!');
            } else {
                srvData.createdAt = new Date().toISOString();
                await addRecord('srv', srvData);
                logActivity('SRV Create', `Created SRV: ${srvData.docNum}`);
                showToast('SRV saved successfully!');
            }
            closeModal('srv');
            await refreshTable('srv');
            await updateBinCard();
        } catch (err) {
            showToast('Error saving SRV: ' + err.message);
        }
    });

    // --- SRF Logic ---
    $('#add-srf-btn').on('click', function() {
        if ($('#srf-form').length) $('#srf-form')[0].reset();
        $('#srf-id').val('');
        $('#srf-no').val(generateDocNumber('SRF'));
        $('#srf-date').val(new Date().toISOString().split('T')[0]);
        $('#srf-items-container').empty();
        $('#srf-items-container').append(createItemRow('srf', 1));
        Object.values(signaturePads).forEach(pad => pad && pad.clear());
        openModal('srf');
    });

    $('#srf-form').on('submit', async function(e) {
        e.preventDefault();
        const id = $('#srf-id').val();
        const srfData = {
            srfNo: $('#srf-no').val(),
            date: $('#srf-date').val(),
            costCode: $('#srf-code').val(),
            departmentUnit: $('#srf-department').val(),
            requesterName: $('#srf-requester').val(),
            designation: $('#srf-designation').val(),
            requesterSig: getSignatureData('srf-requester-sig'),
            items: getItemRowsData('srf-items-container'),
            approvedBy: $('#srf-approved-by').val(),
            approvalDate: $('#srf-approval-date').val(),
            approvalSig: getSignatureData('srf-approval-sig'),
            issuedBy: $('#srf-issued-by').val(),
            issueDate: $('#srf-issue-date').val(),
            storeSig: getSignatureData('srf-store-sig'),
            receivedBy: $('#srf-received-by').val(),
            receiverSig: getSignatureData('srf-receiver-sig'),
            updatedAt: new Date().toISOString()
        };
        
        try {
            if (id) {
                await updateRecord('srf', { id: Number(id), ...srfData });
                logActivity('SRF Update', `Updated SRF: ${srfData.srfNo}`);
                showToast('SRF updated successfully!');
            } else {
                srfData.createdAt = new Date().toISOString();
                await addRecord('srf', srfData);
                logActivity('SRF Create', `Created SRF: ${srfData.srfNo}`);
                showToast('SRF saved successfully!');
            }
            closeModal('srf');
            await refreshTable('srf');
            await updateBinCard();
        } catch (err) {
            showToast('Error saving SRF: ' + err.message);
        }
    });

    // --- Accessibility ---
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.modal:visible').hide();
        }
    });

    // --- CSV Export Handlers ---
    $('#export-grn').on('click', async function() {
        const data = await getAllRecords('grn');
        exportToCSV(data, 'GRN_Records', tableConfigs.grn.columns.slice(0, -1));
    });

    $('#export-srv').on('click', async function() {
        const data = await getAllRecords('srv');
        exportToCSV(data, 'SRV_Records', tableConfigs.srv.columns.slice(0, -1));
    });

    $('#export-srf').on('click', async function() {
        const data = await getAllRecords('srf');
        exportToCSV(data, 'SRF_Records', tableConfigs.srf.columns.slice(0, -1));
    });

    $('#export-bin-card').on('click', async function() {
        const items = await getAllRecords('items');
        const grn = await getAllRecords('grn');
        const srf = await getAllRecords('srf');
        
        // Build bin card data
        const binCardData = items.map(item => {
            let totalReceived = 0;
            grn.forEach(g => {
                if (g.items) {
                    g.items.forEach(gi => {
                        if (gi.code === item.code) totalReceived += gi.qtyReceived || 0;
                    });
                }
            });
            
            let totalIssued = 0;
            srf.forEach(s => {
                if (s.items) {
                    s.items.forEach(si => {
                        if (si.code === item.code) totalIssued += si.qtyIssued || 0;
                    });
                }
            });
            
            return {
                codeNo: item.code,
                nameOfItem: item.name,
                unit: item.unit,
                category: item.category || '',
                quantitySupplied: totalReceived,
                quantityIssued: totalIssued,
                storeBalance: totalReceived - totalIssued,
                location: item.location || ''
            };
        });
        
        exportToCSV(binCardData, 'Bin_Card', tableConfigs.binCard.columns.slice(0, -1));
    });

    $('#export-items').on('click', async function() {
        const data = await getAllRecords('items');
        exportToCSV(data, 'Items_Master', tableConfigs.items.columns.slice(0, -1));
    });

    $('#export-activity-log').on('click', async function() {
        const data = await getAllRecords('activity_log');
        exportToCSV(data, 'Activity_Log', tableConfigs.activityLog.columns);
    });

    // --- Bin Card Category Filter ---
    $('#bin-card-filter').on('change', function() {
        const filterValue = $(this).val();
        if (dataTables.binCard) {
            if (filterValue) {
                dataTables.binCard.column(3).search('^' + filterValue + '$', true, false).draw();
            } else {
                dataTables.binCard.column(3).search('').draw();
            }
        }
    });

    // --- CSV Import Handler (for SRV) ---
    let importData = null;
    
    $('#import-srv').on('click', function() {
        $('#import-file').val('');
        $('#import-preview').hide();
        $('#confirm-import-btn').prop('disabled', true);
        importData = null;
        openModal('import');
    });

    $('#import-file').on('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            const parsed = parseCSV(evt.target.result);
            importData = parsed;
            
            // Show preview
            let html = '<table><thead><tr>';
            parsed.headers.forEach(h => html += `<th>${h}</th>`);
            html += '</tr></thead><tbody>';
            
            parsed.rows.slice(0, 5).forEach(row => {
                html += '<tr>';
                parsed.headers.forEach(h => html += `<td>${row[h] || ''}</td>`);
                html += '</tr>';
            });
            html += '</tbody></table>';
            
            if (parsed.rows.length > 5) {
                html += `<p>...and ${parsed.rows.length - 5} more rows</p>`;
            }
            
            $('#preview-table-container').html(html);
            $('#import-preview').show();
            $('#confirm-import-btn').prop('disabled', false);
        };
        reader.readAsText(file);
    });

    $('#confirm-import-btn').on('click', async function() {
        if (!importData || !importData.rows.length) {
            showToast('No data to import');
            return;
        }
        
        try {
            for (const row of importData.rows) {
                const srvData = {
                    docNum: row['SRV No'] || row['docNum'] || generateDocNumber('SRV'),
                    date: row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
                    department: row['Department'] || row['department'] || '',
                    source: row['Source/Supplier'] || row['source'] || '',
                    totalValue: parseFloat(row['Total Value'] || row['totalValue']) || 0,
                    createdAt: new Date().toISOString(),
                    importedFrom: 'CSV'
                };
                await addRecord('srv', srvData);
            }
            
            showToast(`${importData.rows.length} records imported successfully`);
            logActivity('SRV Import', `Imported ${importData.rows.length} SRV records from CSV`);
            closeModal('import');
            await refreshTable('srv');
        } catch (err) {
            showToast('Import error: ' + err.message);
        }
    });

    // --- Responsive Handling ---
    $(window).on('resize', function() {
        $('.modal-content').css('max-width', $(window).width() < 800 ? '95%' : '800px');
        // Reinitialize signature pads on resize
        Object.keys(signaturePads).forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const container = canvas.parentElement;
                canvas.width = container.offsetWidth - 10;
            }
        });
    });

    // --- Main App Initialization ---
    const initializeApp = async () => {
        // Initial setup after login
        navLinks.forEach(link => link.addEventListener('click', handleNavigation));
        
        // Setup add row buttons for forms
        setupAddRowButtons();
        
        // Initialize signature pads
        initializeSignaturePads();
        
        // Cache items for autocomplete
        itemsCache = await getAllRecords('items');
        await createItemDatalist();
        
        // Initialize form logic
        initializeItemsLogic();
        
        // Show dashboard by default
        document.querySelector('.nav-link[data-target="dashboard"]').click();
        
        // Initial update of bin card
        await updateBinCard();
    };

    // Expose refresh function globally
    window.refreshCurrentView = async () => {
        const activeSection = document.querySelector('.content-section[style*="block"]');
        if (activeSection) {
            const sectionId = activeSection.id;
            const dbNameMap = {
                'dashboard': null,
                'grn': 'grn',
                'srv': 'srv',
                'srf': 'srf',
                'bin-card': 'binCard',
                'items': 'items',
                'activity-log': 'activityLog'
            };
            if (sectionId === 'dashboard') {
                await initializeDashboard();
            } else if (dbNameMap[sectionId]) {
                await initializeTable(dbNameMap[sectionId]);
            }
        }
    };

    // Make calculateSrvTotal and closeModal available globally
    window.calculateSrvTotal = calculateSrvTotal;
    window.closeModal = closeModal;

    // --- Change Password Handler ---
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const modal = `<div id="password-modal" class="modal" style="display:block;"><div class="modal-content" style="max-width: 400px;">
                <span class="close-btn" onclick="document.getElementById('password-modal').remove()">&times;</span>
                <div class="form-header"><h3><i class="fas fa-key"></i> Change Password</h3></div>
                <form id="change-password-form" style="padding: 20px;">
                    <div class="form-section">
                        <div class="form-group">
                            <label>Current Password <span class="required">*</span></label>
                            <input type="password" id="current-password" required autocomplete="current-password">
                        </div>
                        <div class="form-group">
                            <label>New Password <span class="required">*</span></label>
                            <input type="password" id="new-password" required minlength="6" autocomplete="new-password">
                            <small style="color: #666;">Minimum 6 characters</small>
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password <span class="required">*</span></label>
                            <input type="password" id="confirm-password" required minlength="6" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('password-modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Change Password</button>
                    </div>
                </form>
            </div></div>`;
            $('body').append(modal);
        });
    }
    
    // Handle change password form submission
    $(document).on('submit', '#change-password-form', async function(e) {
        e.preventDefault();
        const currentPassword = $('#current-password').val();
        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();
        
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match!');
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters!');
            return;
        }
        
        try {
            const { changePassword } = window.IDB;
            await changePassword(currentPassword, newPassword);
            showToast('Password changed successfully!');
            $('#password-modal').remove();
        } catch (err) {
            showToast('Error: ' + (err.message || 'Failed to change password'));
        }
    });

    // --- Startup ---
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Check for existing session with server
    const checkExistingSession = async () => {
        try {
            const response = await getSession();
            if (response.authenticated) {
                currentUser = response.user.username;
                sessionStorage.setItem('currentUser', response.user.username);
                sessionStorage.setItem('userRole', response.user.role);
                sessionStorage.setItem('userPermissions', JSON.stringify(response.user.permissions || {}));
                loginPage.style.display = 'none';
                appPage.style.display = 'block';
                
                // Apply role-based UI restrictions
                applyRoleBasedUI(response.user.role, response.user.permissions);
                
                await initializeApp();
            } else {
                // Clear stale session data
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('userPermissions');
            }
        } catch (err) {
            console.log('No active session');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userPermissions');
        }
    };
    
    // Check session on page load
    checkExistingSession();

    // --- User Management Screen ---
    async function renderUserManagement() {
        const currentRole = sessionStorage.getItem('userRole');
        const isSuperAdmin = currentRole === 'superadmin';
        const isAdmin = ['superadmin', 'admin'].includes(currentRole);
        
        const users = await getAllRecords('users');
        
        let html = `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">User Management</h3>
                ${isAdmin ? '<button id="add-user-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add User</button>' : ''}
            </div>
            <div class="role-legend" style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; background: #800020; border-radius: 50%;"></span> Super Admin</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; background: #1e3c72; border-radius: 50%;"></span> Admin</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; background: #27ae60; border-radius: 50%;"></span> Storekeeper</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; background: #8e44ad; border-radius: 50%;"></span> Auditor</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; background: #7f8c8d; border-radius: 50%;"></span> Viewer</span>
            </div>
            <table id="users-table" class="display" width="100%">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
        
        users.forEach(u => {
            const roleColor = {
                superadmin: '#800020',
                admin: '#1e3c72',
                storekeeper: '#27ae60',
                auditor: '#8e44ad',
                viewer: '#7f8c8d'
            }[u.role] || '#7f8c8d';
            
            const statusBadge = u.is_active !== 0 
                ? '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">Active</span>'
                : '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">Disabled</span>';
            
            const canEditUser = isSuperAdmin || (isAdmin && !['superadmin', 'admin'].includes(u.role));
            const canDeleteUser = (isSuperAdmin && u.role !== 'superadmin') || (isAdmin && !['superadmin', 'admin'].includes(u.role));
            
            html += `<tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.full_name || '-'}</td>
                <td>${u.email || '-'}</td>
                <td><span style="background: ${roleColor}; color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.85em;">${u.role || 'viewer'}</span></td>
                <td>${statusBadge}</td>
                <td>${u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                <td>
                    ${canEditUser ? `<button class="btn btn-sm btn-edit edit-user-btn" data-id="${u.id}" data-user='${JSON.stringify(u).replace(/'/g, "&#39;")}'>Edit</button>` : ''}
                    ${canDeleteUser ? `<button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.id}" data-username="${u.username}">Delete</button>` : ''}
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        
        $('#user-management-content').html(html);
        
        if ($.fn.DataTable.isDataTable('#users-table')) {
            $('#users-table').DataTable().destroy();
        }
        $('#users-table').DataTable({
            responsive: true,
            order: [[3, 'asc'], [0, 'asc']]
        });
    }

    // Add User Modal - using event delegation
    $(document).on('click', '#add-user-btn', function() {
        const currentRole = sessionStorage.getItem('userRole');
        const isSuperAdmin = currentRole === 'superadmin';
        
        const roleOptions = isSuperAdmin 
            ? `<option value="superadmin">Super Admin</option>
               <option value="admin">Admin</option>
               <option value="storekeeper">Storekeeper</option>
               <option value="auditor">Auditor</option>
               <option value="viewer" selected>Viewer</option>`
            : `<option value="storekeeper">Storekeeper</option>
               <option value="auditor">Auditor</option>
               <option value="viewer" selected>Viewer</option>`;
        
        const modal = `<div id="user-modal" class="modal" style="display:block;"><div class="modal-content">
            <span class="close-btn">&times;</span>
            <div class="form-header"><h3>Add New User</h3></div>
            <form id="user-form" style="padding: 20px;">
                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Username <span class="required">*</span></label>
                            <input type="text" id="new-username" required>
                        </div>
                        <div class="form-group">
                            <label>Password <span class="required">*</span></label>
                            <input type="password" id="new-password" required minlength="6">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="new-fullname">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="new-email">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Role</label>
                            <select id="new-role">${roleOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="new-status">
                                <option value="1" selected>Active</option>
                                <option value="0">Disabled</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary close-btn-action">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save User</button>
                </div>
            </form>
        </div></div>`;
        $('body').append(modal);
    });

    // Save new user
    $(document).on('submit', '#user-form', async function(e) {
        e.preventDefault();
        const userData = {
            username: $('#new-username').val(),
            password: $('#new-password').val(),
            role: $('#new-role').val(),
            fullName: $('#new-fullname').val(),
            email: $('#new-email').val(),
            isActive: $('#new-status').val() === '1'
        };
        
        try {
            await registerUser(userData.username, userData.password, userData.role, userData.fullName, userData.email);
            showToast('User added successfully!');
            $('#user-modal').remove();
            renderUserManagement();
        } catch (err) {
            showToast('Error: ' + (err.message || 'Failed to create user'));
        }
    });

    // Close user modal - handle both close button and cancel button
    $(document).on('click', '#user-modal .close-btn, #user-modal .close-btn-action', function() {
        $('#user-modal').remove();
    });

    // Edit user
    $(document).on('click', '.edit-user-btn', function() {
        const userData = JSON.parse($(this).attr('data-user'));
        const currentRole = sessionStorage.getItem('userRole');
        const isSuperAdmin = currentRole === 'superadmin';
        
        const roleOptions = isSuperAdmin 
            ? `<option value="superadmin" ${userData.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
               <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
               <option value="storekeeper" ${userData.role === 'storekeeper' ? 'selected' : ''}>Storekeeper</option>
               <option value="auditor" ${userData.role === 'auditor' ? 'selected' : ''}>Auditor</option>
               <option value="viewer" ${userData.role === 'viewer' ? 'selected' : ''}>Viewer</option>`
            : `<option value="storekeeper" ${userData.role === 'storekeeper' ? 'selected' : ''}>Storekeeper</option>
               <option value="auditor" ${userData.role === 'auditor' ? 'selected' : ''}>Auditor</option>
               <option value="viewer" ${userData.role === 'viewer' ? 'selected' : ''}>Viewer</option>`;
        
        const modal = `<div id="user-modal" class="modal" style="display:block;"><div class="modal-content">
            <span class="close-btn">&times;</span>
            <div class="form-header"><h3>Edit User: ${userData.username}</h3></div>
            <form id="edit-user-form" style="padding: 20px;">
                <input type="hidden" id="edit-user-id" value="${userData.id}">
                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Username <span class="required">*</span></label>
                            <input type="text" id="edit-username" value="${userData.username}" required>
                        </div>
                        <div class="form-group">
                            <label>New Password (leave blank to keep current)</label>
                            <input type="password" id="edit-password" minlength="6" placeholder="Leave blank to keep current">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="edit-fullname" value="${userData.full_name || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" value="${userData.email || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Role</label>
                            <select id="edit-role">${roleOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status">
                                <option value="1" ${userData.is_active !== 0 ? 'selected' : ''}>Active</option>
                                <option value="0" ${userData.is_active === 0 ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary close-btn-action">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update User</button>
                </div>
            </form>
        </div></div>`;
        $('body').append(modal);
    });
    
    // Update user
    $(document).on('submit', '#edit-user-form', async function(e) {
        e.preventDefault();
        const userId = $('#edit-user-id').val();
        const userData = {
            username: $('#edit-username').val(),
            role: $('#edit-role').val(),
            fullName: $('#edit-fullname').val(),
            email: $('#edit-email').val(),
            isActive: $('#edit-status').val() === '1'
        };
        
        const password = $('#edit-password').val();
        if (password) {
            userData.password = password;
        }
        
        try {
            await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(userData)
            });
            showToast('User updated successfully!');
            $('#user-modal').remove();
            renderUserManagement();
        } catch (err) {
            showToast('Error: ' + (err.message || 'Failed to update user'));
        }
    });

    // Delete user
    $(document).on('click', '.delete-user-btn', async function() {
        const username = $(this).data('username');
        const userId = $(this).data('id');
        
        if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;
        
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }
            
            showToast('User deleted successfully');
            renderUserManagement();
        } catch (err) {
            showToast('Error: ' + err.message);
        }
    });

    // --- Remote Sync UI ---
    $('#sync-to-remote').on('click', async function() {
        await syncStoreToRemote('grn');
        await syncStoreToRemote('srv');
        await syncStoreToRemote('srf');
        await syncStoreToRemote('items');
        await syncStoreToRemote('activity_log');
        showToast('All data synced to server');
    });
    $('#sync-from-remote').on('click', async function() {
        await fetchStoreFromRemote('grn');
        await fetchStoreFromRemote('srv');
        await fetchStoreFromRemote('srf');
        await fetchStoreFromRemote('items');
        await fetchStoreFromRemote('activity_log');
        showToast('All data updated from server');
    });

    // --- GRN Item Image Functions ---
    const resetGrnItemImagePreview = (rowIndex) => {
        const preview = document.getElementById(`grn-image-preview-${rowIndex}`);
        const buttons = document.getElementById(`grn-image-buttons-${rowIndex}`);
        
        if (preview) {
            preview.style.display = 'none';
            const img = preview.querySelector('img');
            if (img) img.src = '';
        }
        if (buttons) buttons.style.display = 'flex';
    };
    
    const setGrnItemImagePreview = (rowIndex, imageUrl) => {
        const preview = document.getElementById(`grn-image-preview-${rowIndex}`);
        const buttons = document.getElementById(`grn-image-buttons-${rowIndex}`);
        
        if (preview && imageUrl) {
            const img = preview.querySelector('img');
            if (img) img.src = imageUrl;
            preview.style.display = 'block';
        }
        if (buttons) buttons.style.display = 'none';
    };
    
    const uploadGrnItemImage = async (grnId, rowIndex, imageData) => {
        try {
            const response = await fetch(`/api/grn/${grnId}/items/${rowIndex}/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ imageData })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const result = await response.json();
            return result;
        } catch (err) {
            console.error('Error uploading GRN image:', err);
            throw err;
        }
    };
    
    const deleteGrnItemImage = async (grnId, rowIndex, imageUrl) => {
        try {
            const response = await fetch(`/api/grn/${grnId}/items/${rowIndex}/image`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ imageUrl })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Delete failed');
            }
            
            return await response.json();
        } catch (err) {
            console.error('Error deleting GRN image:', err);
            throw err;
        }
    };
    
    const initializeGrnImageHandlers = () => {
        // Handle GRN image upload buttons - use closest() to handle clicks on child elements (icons)
        // Use both click and touchend for better mobile support
        const handleImageAction = (e) => {
            const uploadBtn = e.target.closest('.btn-upload-image');
            if (uploadBtn && uploadBtn.closest('.grn-item-row')) {
                e.preventDefault();
                e.stopPropagation();
                const rowIndex = uploadBtn.dataset.row;
                const fileInput = document.getElementById(`grn-image-file-${rowIndex}`);
                if (fileInput) {
                    // Small delay for mobile to ensure the click registers
                    setTimeout(() => fileInput.click(), 10);
                }
                return;
            }
            
            const cameraBtn = e.target.closest('.btn-camera-image');
            if (cameraBtn && cameraBtn.closest('.grn-item-row')) {
                e.preventDefault();
                e.stopPropagation();
                const rowIndex = cameraBtn.dataset.row;
                openGrnCameraModal(rowIndex);
                return;
            }
            
            const removeBtn = e.target.closest('.btn-remove-image');
            if (removeBtn && removeBtn.closest('.grn-item-row')) {
                e.preventDefault();
                e.stopPropagation();
                const rowIndex = removeBtn.dataset.row;
                const grnId = document.getElementById('grn-id')?.value || 'new';
                const preview = document.getElementById(`grn-image-preview-${rowIndex}`);
                const img = preview?.querySelector('img');
                let imageUrl = null;
                if (img && img.src) {
                    try {
                        const url = new URL(img.src);
                        if (url.pathname.startsWith('/uploads/')) {
                            imageUrl = url.pathname;
                        }
                    } catch (err) {
                        if (img.src.startsWith('/uploads/')) {
                            imageUrl = img.src;
                        }
                    }
                }
                deleteGrnItemImage(grnId, rowIndex, imageUrl);
                resetGrnItemImagePreview(rowIndex);
                return;
            }
        };
        
        document.addEventListener('click', handleImageAction);
        
        // Handle file selection for GRN images
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('image-file-input') && e.target.id.startsWith('grn-image-file-')) {
                const rowIndex = e.target.id.split('-').pop();
                handleGrnImageFileSelect(e, rowIndex);
            }
        });
    };
    
    const handleGrnImageFileSelect = (e, rowIndex) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
            showToast('Invalid file type. Use JPG, PNG, GIF, or WebP');
            return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image too large. Maximum 2MB allowed');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            const imageData = evt.target.result;
            const grnId = document.getElementById('grn-id')?.value || 'new';
            uploadGrnItemImage(grnId, rowIndex, imageData);
            setGrnItemImagePreview(rowIndex, imageData);
        };
        reader.readAsDataURL(file);
    };
    
    // GRN Camera functions
    const openGrnCameraModal = async (rowIndex) => {
        grnCameraRowIndex = rowIndex;
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-video');
        const preview = document.getElementById('camera-preview');
        const captureBtn = document.getElementById('camera-capture-btn');
        const retakeBtn = document.getElementById('camera-retake-btn');
        const useBtn = document.getElementById('camera-use-btn');
        
        // Reset state
        if (preview) preview.style.display = 'none';
        if (video) video.style.display = 'block';
        if (captureBtn) captureBtn.style.display = 'inline-flex';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (useBtn) useBtn.style.display = 'none';
        
        try {
            // Request camera access - prefer back camera on mobile
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            if (video) {
                video.srcObject = cameraStream;
            }
            
            if (modal) modal.style.display = 'block';
        } catch (err) {
            console.error('Camera access denied:', err);
            showToast('Camera access denied. Please allow camera permissions.');
        }
    };
    
    // Initialize GRN image handlers
    initializeGrnImageHandlers();

});
// End of DOMContentLoaded
