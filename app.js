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
    const handleLogin = (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        if (DUMMY_PASSWORDS[username] && DUMMY_PASSWORDS[username] === password) {
            currentUser = username;
            sessionStorage.setItem('currentUser', username);
            loginPage.style.display = 'none';
            appPage.style.display = 'block';
            errorEl.textContent = '';
            initializeApp();
            logActivity('User Login', `User '${username}' logged in.`);
        } else {
            errorEl.textContent = 'Invalid username or password.';
        }
    };

    const handleLogout = () => {
        logActivity('User Logout', `User '${currentUser}' logged out.`);
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        loginPage.style.display = 'block';
        appPage.style.display = 'none';
        // Destroy DataTables and Charts to re-initialize on next login
        Object.values(dataTables).forEach(table => table.destroy());
        Object.values(charts).forEach(chart => chart.destroy());
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

        if (type === 'grn') {
            row.innerHTML = `
                <td>${index}</td>
                <td><input type="text" name="description" list="item-list" value="${data.description || ''}" placeholder="Item description" class="item-autocomplete"></td>
                <td><input type="text" name="code" value="${data.code || ''}" placeholder="Code" readonly></td>
                <td><input type="number" name="qtyOrdered" value="${data.qtyOrdered || ''}" placeholder="0" min="0"></td>
                <td><input type="number" name="qtyReceived" value="${data.qtyReceived || ''}" placeholder="0" min="0"></td>
                <td><input type="text" name="unit" value="${data.unit || ''}" placeholder="Unit" readonly></td>
                <td><input type="text" name="remark" value="${data.remark || ''}" placeholder="Remark"></td>
                <td><button type="button" class="btn-remove-row" onclick="this.closest('tr').remove()">✕</button></td>
            `;
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
            descInput.addEventListener('change', function() {
                const item = itemsCache.find(i => i.name === this.value);
                if (item) {
                    row.querySelector('[name="code"]').value = item.code;
                    row.querySelector('[name="unit"]').value = item.unit;
                }
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
                    if (id) {
                        await updateRecord('items', { id: Number(id), ...itemData });
                        logActivity('Item Update', `Updated item: ${itemData.name} (${itemData.code})`);
                        showToast('Item updated successfully!');
                    } else {
                        itemData.createdAt = new Date().toISOString();
                        await addRecord('items', itemData);
                        logActivity('Item Create', `Created new item: ${itemData.name} (${itemData.code})`);
                        showToast('Item created successfully!');
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
        if (dbName === 'srv' || dbName === 'srf') {
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
            <button class="btn btn-sm btn-edit" data-db="${dbName}" data-id="${data.id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete" data-db="${dbName}" data-id="${data.id}">Delete</button>
        `;
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
                { data: 'timestamp', title: 'Timestamp', render: (d) => new Date(d).toLocaleString() },
                { data: 'user', title: 'User' },
                { data: 'action', title: 'Action' },
                { data: 'details', title: 'Details' }
            ],
            options: { order: [[0, 'desc']] }
        }
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
                    storeBalance: balance,
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

        const options = {
            data: data,
            columns: config.columns,
            responsive: true,
            destroy: true, // Allow re-initialization
            ...config.options
        };
        
        dataTables[dbName] = $(`#${tableId}`).DataTable(options);
        
        // Add event listeners for edit/delete after table is created (skip for binCard)
        if (dbName !== 'binCard') {
            $(`#${tableId} tbody`).on('click', '.btn-delete', function () {
                const id = $(this).data('id');
                handleDelete(dbName, id);
            });

            $(`#${tableId} tbody`).on('click', '.btn-edit', async function () {
                const id = $(this).data('id');
                const storeNameMap = { 'activityLog': 'activity_log' };
                const storeName = storeNameMap[dbName] || dbName;
                const doc = await getAllRecords(storeName).then(records => records.find(record => record.id === id));
                // This needs specific edit handlers per form type
                if (editHandlers[dbName]) {
                    editHandlers[dbName](doc);
                }
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
            items: getItemRowsData('grn-items-container'),
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

    // --- Startup ---
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Check for existing session
    if (sessionStorage.getItem('currentUser')) {
        currentUser = sessionStorage.getItem('currentUser');
        loginPage.style.display = 'none';
        appPage.style.display = 'block';
        initializeApp();
    }

    // --- Authentication Logic ---
    $('#login-form').on('submit', async function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
        try {
            const user = await authenticateUser(username, password);
            currentSessionId = await createSession(user.id);
            showToast('Login successful!');
            logAudit('login', user.id, { username });
            $('#login-page').hide();
            $('#app').show();
            // Optionally, show/hide features based on user.role
        } catch (err) {
            showToast('Login failed: ' + err.message);
            $('#login-error').text('Invalid username or password');
        }
    });

    $('#logout-btn').on('click', async function() {
        if (currentSessionId) {
            await logoutSession(currentSessionId);
            logAudit('logout', null, {});
            currentSessionId = null;
        }
        $('#app').hide();
        $('#login-page').show();
        showToast('Logged out');
    });

    // --- Registration (admin only, example) ---
    async function ensureAdminUser() {
        const users = await getAllRecords('users');
        if (!users.some(u => u.username === 'admin')) {
            await registerUser('admin', 'admin', 'admin');
            await addRole('admin', ['manage_users', 'view_reports', 'edit_inventory']);
            console.log('Default admin user created');
        }
    }
    $(document).ready(function() {
        ensureAdminUser();
    });

    // --- Role-based UI (example) ---
    async function showFeaturesForRole(role) {
        // Hide/show UI elements based on role permissions
        const roleObj = await getRole(role);
        if (!roleObj) return;
        if (!roleObj.permissions.includes('manage_users')) {
            $('#activity-log').hide();
        }
        // ...other UI logic...
    }

    // --- User Management Screen ---
    async function renderUserManagement() {
        const users = await getAllRecords('users');
        const roles = await getAllRecords('roles');
        let html = `<h2>User Management</h2><button id="add-user-btn" class="btn">Add User</button><table id="users-table" class="display"><thead><tr><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody>`;
        users.forEach(u => {
            html += `<tr><td>${u.username}</td><td>${u.role}</td><td><button class="btn btn-secondary edit-user-btn" data-id="${u.id}">Edit</button> <button class="btn btn-danger delete-user-btn" data-id="${u.id}">Delete</button></td></tr>`;
        });
        html += '</tbody></table>';
        $('#user-management-section').html(html);
        $('#users-table').DataTable();
    }

    // Show user management when admin clicks
    $(document).on('click', '#manage-users-nav', function() {
        $('.content-section').hide();
        $('#user-management-section').show();
        renderUserManagement();
    });

    // Add User Modal
    $(document).on('click', '#add-user-btn', function() {
        const modal = `<div id="user-modal" class="modal" style="display:block;"><div class="modal-content"><span class="close-btn">&times;</span><form id="user-form"><h3>Add User</h3><label>Username</label><input type="text" id="new-username" required><label>Password</label><input type="password" id="new-password" required><label>Role</label><select id="new-role"></select><button type="submit" class="btn">Save</button></form></div></div>`;
        $('body').append(modal);
        getAllRecords('roles').then(roles => {
            roles.forEach(r => $('#new-role').append(`<option value="${r.roleName}">${r.roleName}</option>`));
        });
    });

    // Save new user
    $(document).on('submit', '#user-form', async function(e) {
        e.preventDefault();
        await registerUser($('#new-username').val(), $('#new-password').val(), $('#new-role').val());
        showToast('User added');
        $('#user-modal').remove();
        renderUserManagement();
    });

    // Close user modal
    $(document).on('click', '.close-btn', function() {
        $(this).closest('.modal').remove();
    });

    // Delete user
    $(document).on('click', '.delete-user-btn', async function() {
        await deleteRecord('users', Number($(this).data('id')));
        showToast('User deleted');
        renderUserManagement();
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

    // --- Add navigation for user management and sync ---
    $(document).ready(function() {
        // User management section is added to main content, not floating
        if ($('#user-management-section').length === 0) {
            $('main').append('<section id="user-management-section" class="content-section" style="display:none;"></section>');
        }
    });

});
// End of DOMContentLoaded
