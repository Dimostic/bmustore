
document.addEventListener('DOMContentLoaded', () => {

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    }

    // --- PouchDB Databases ---
    const db = {
        grn: new PouchDB('grn'),
        srv: new PouchDB('srv'),
        srf: new PouchDB('srf'),
        items: new PouchDB('items'),
        binCard: new PouchDB('binCard'),
        activityLog: new PouchDB('activityLog')
    };

    // --- Global State & Variables ---
    let currentUser = null;
    let signaturePads = {};

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
        admin: 'password123'
    };

    // --- Utility Functions ---
    const logActivity = async (action, details) => {
        try {
            await db.activityLog.post({
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
    
    const showToast = (message, type = 'success') => {
        // A simple toast notification function
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toISOString().split('T')[0];
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
    const openModal = (modalId) => modals[modalId].style.display = 'block';
    const closeModal = (modalId) => {
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

            // Clear signature pads
            Object.values(signaturePads).forEach(pad => pad.clear());
        }
    };
    
    // Attach close event listeners
    Object.keys(modals).forEach(key => {
        const modal = modals[key];
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.onclick = () => closeModal(key);
    });
    window.onclick = (event) => {
        Object.values(modals).forEach(modal => {
            if (event.target == modal) {
                closeModal(modal.id.replace('-modal', ''));
            }
        });
    };

    // --- Item Management ---
    const initializeItemsLogic = () => {
        document.getElementById('add-item-btn').addEventListener('click', () => {
            forms.item.reset();
            document.getElementById('item-id').value = '';
            openModal('item');
        });

        forms.item.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('item-id').value;
            const itemData = {
                code: document.getElementById('item-code').value,
                name: document.getElementById('item-name').value,
                unit: document.getElementById('item-unit').value,
            };

            try {
                if (id) {
                    const doc = await db.items.get(id);
                    await db.items.put({ ...doc, ...itemData });
                    logActivity('Item Update', `Updated item: ${itemData.name}`);
                } else {
                    await db.items.post({ ...itemData, _id: `item_${Date.now()}` });
                     logActivity('Item Create', `Created new item: ${itemData.name}`);
                }
                closeModal('item');
                await refreshTable('items');
                await updateBinCard(); // Items might affect bin card
            } catch (err) {
                console.error('Error saving item:', err);
            }
        });
    };
    
    const fetchItems = async () => {
        try {
            const result = await db.items.allDocs({ include_docs: true });
            return result.rows.map(row => row.doc);
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
    const getDbData = async (dbName) => {
        const result = await db[dbName].allDocs({ include_docs: true });
        return result.rows.map(row => row.doc);
    };

    const refreshTable = async (dbName) => {
        if (dataTables[dbName]) {
            const data = await getDbData(dbName);
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
            const doc = await db[dbName].get(id);
            await db[dbName].remove(doc);
            logActivity(`${dbName.toUpperCase()} Delete`, `Deleted record with ID: ${id}`);
            await refreshTable(dbName);
        } catch (err) {
            console.error(`Error deleting ${dbName} record:`, err);
        }
    };

    const createActionButtons = (dbName, data) => {
        return `
            <button class="btn btn-sm btn-edit" data-db="${dbName}" data-id="${data._id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete" data-db="${dbName}" data-id="${data._id}">Delete</button>
        `;
    };
    
    // --- DataTables Initializers ---
    const tableConfigs = {
        grn: {
            columns: [
                { data: 'drn_no', title: 'DRN No' },
                { data: 'supplier_name', title: 'Supplier' },
                { data: 'delivery_date', title: 'Delivery Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('grn', d) }
            ]
        },
        srv: {
            columns: [
                { data: 'doc_num', title: 'Doc No' },
                { data: 'department', title: 'Department' },
                { data: 'source', title: 'Source' },
                { data: 'date', title: 'Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srv', d) }
            ]
        },
        srf: {
            columns: [
                { data: 'srf_no', title: 'SRF No' },
                { data: 'department_unit', title: 'Department' },
                { data: 'requester_name', title: 'Requester' },
                { data: 'date', title: 'Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srf', d) }
            ]
        },
        binCard: {
            columns: [
                { data: 'code_no', title: 'Code No' },
                { data: 'name_of_item', title: 'Item Name' },
                { data: 'unit', title: 'Unit' },
                { data: 'store_balance', title: 'Balance' },
            ]
        },
        items: {
            columns: [
                { data: 'code', title: 'Code' },
                { data: 'name', title: 'Name' },
                { data: 'unit', title: 'Unit' },
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

        // A helper function was added to handle the conversion:
const toKebabCase = (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

// And the line inside initializeTable was changed to this:
const tableId = `${toKebabCase(dbName)}-table`;
        const config = tableConfigs[dbName];
        if (!config) return;

        const data = await getDbData(dbName);
        const options = {
            data: data,
            columns: config.columns,
            responsive: true,
            destroy: true, // Allow re-initialization
            ...config.options
        };
        
        dataTables[dbName] = $(`#${tableId}`).DataTable(options);
        
        // Add event listeners for edit/delete after table is created
        $(`#${tableId} tbody`).on('click', '.btn-delete', function () {
            const id = $(this).data('id');
            handleDelete(dbName, id);
        });

        $(`#${tableId} tbody`).on('click', '.btn-edit', async function () {
            const id = $(this).data('id');
            const doc = await db[dbName].get(id);
            // This needs specific edit handlers per form type
            if (editHandlers[dbName]) {
                editHandlers[dbName](doc);
            }
        });
    };

    // --- Specific Form Logic ---
    
    // GRN Logic
    const initializeGrnLogic = () => {
        document.getElementById('add-grn-btn').addEventListener('click', () => {
            forms.grn.reset();
            document.getElementById('grn-id').value = '';
            document.getElementById('grn-items-container').innerHTML = ''; // Clear items
            addGrnItemRow(); // Add one empty row
            openModal('grn');
        });

        document.getElementById('grn-add-item-row').addEventListener('click', addGrnItemRow);

        forms.grn.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('grn-id').value;
            const items = [];
            document.querySelectorAll('.grn-item-row').forEach(row => {
                items.push({
                    s_no: row.querySelector('.grn-item-sno').value,
                    description: row.querySelector('.grn-item-desc').value,
                    code: row.querySelector('.grn-item-code').value,
                    quantity: row.querySelector('.grn-item-qty').value,
                    remark: row.querySelector('.grn-item-remark').value,
                });
            });

            const docData = {
                supplier_name: document.getElementById('grn-supplier-name').value,
                carrier_transporter: document.getElementById('grn-carrier').value,
                delivery_date: document.getElementById('grn-delivery-date').value,
                drn_no: document.getElementById('grn-drn-no').value,
                lpo_no: document.getElementById('grn-lpo-no').value,
                date_issued: document.getElementById('grn-issue-date').value,
                items: items,
                examined_by: document.getElementById('grn-examined-by').value,
                examined_dept: document.getElementById('grn-examined-dept').value,
                examined_date: document.getElementById('grn-examined-date').value,
                received_by: document.getElementById('grn-received-by').value,
                received_dept: document.getElementById('grn-received-dept').value,
                received_date: document.getElementById('grn-received-date').value,
                // Signatures would be saved as base64 data URLs
                // examined_sig: signaturePads['grn-examined'].toDataURL(),
                // received_sig: signaturePads['grn-received'].toDataURL(),
            };

            try {
                if (id) {
                    const doc = await db.grn.get(id);
                    await db.grn.put({ ...doc, ...docData });
                    logActivity('GRN Update', `Updated GRN: ${docData.drn_no}`);
                } else {
                    await db.grn.post({ ...docData, _id: `grn_${Date.now()}` });
                    logActivity('GRN Create', `Created GRN: ${docData.drn_no}`);
                }
                closeModal('grn');
                await refreshTable('grn');
            } catch (err) {
                console.error("Error saving GRN:", err);
            }
        });
    };

    const addGrnItemRow = () => {
        const container = document.getElementById('grn-items-container');
        const count = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'grn-item-row';
        row.innerHTML = `
            <input type="text" class="grn-item-sno" value="${count}" placeholder="S/NO">
            <input type="text" list="item-list" class="grn-item-desc" placeholder="Item Description" required>
            <input type="text" class="grn-item-code" placeholder="Code">
            <input type="number" class="grn-item-qty" placeholder="Quantity" required>
            <input type="text" class="grn-item-remark" placeholder="Remark">
            <button type="button" class="btn btn-sm btn-danger remove-row-btn">&times;</button>
        `;
        container.appendChild(row);
        row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    };
    
    // SRV Logic
    const initializeSrvLogic = () => {
        document.getElementById('add-srv-btn').addEventListener('click', () => {
            forms.srv.reset();
            document.getElementById('srv-id').value = '';
            document.getElementById('srv-items-container').innerHTML = ''; // Clear items
            addSrvItemRow(); // Add one empty row
            openModal('srv');
        });

        document.getElementById('srv-add-item-row').addEventListener('click', addSrvItemRow);

        forms.srv.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('srv-id').value;
            const items = [];
            document.querySelectorAll('.srv-item-row').forEach(row => {
                items.push({
                    s_n: row.querySelector('.srv-item-sn').value,
                    item_description: row.querySelector('.srv-item-desc').value,
                    denomination_of_quantity: row.querySelector('.srv-item-denom').value,
                    quantity_to_be_received: row.querySelector('.srv-item-qty').value,
                    value: row.querySelector('.srv-item-value').value,
                    ledger_folio: row.querySelector('.srv-item-ledger').value,
                    purpose_remarks: row.querySelector('.srv-item-remarks').value
                });
            });
            const doc_num = `SRV-${Date.now()}`;
            const docData = {
                department: document.getElementById('srv-dept').value,
                source: document.getElementById('srv-source').value,
                po_lso_no: document.getElementById('srv-po-no').value,
                date: document.getElementById('srv-date').value,
                items: items,
                order_no: document.getElementById('srv-order-no').value,
                order_date: document.getElementById('srv-order-date').value,
                invoice_no: document.getElementById('srv-invoice-no').value,
                invoice_date: document.getElementById('srv-invoice-date').value,
                receiving_officer: document.getElementById('srv-officer').value,
                designation: document.getElementById('srv-designation').value,
                signature_date: document.getElementById('srv-sig-date').value
            };

            try {
                if (id) {
                    const doc = await db.srv.get(id);
                    await db.srv.put({ ...doc, ...docData });
                    logActivity('SRV Update', `Updated SRV for PO: ${docData.po_lso_no}`);
                } else {
                    await db.srv.post({ ...docData, _id: `srv_${Date.now()}`, doc_num });
                    logActivity('SRV Create', `Created SRV for PO: ${docData.po_lso_no}`);
                }
                closeModal('srv');
                await refreshTable('srv');
            } catch (err) {
                console.error("Error saving SRV:", err);
            }
        });
    };
    
    const addSrvItemRow = () => {
        const container = document.getElementById('srv-items-container');
        const count = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'srv-item-row';
        row.innerHTML = `
            <input type="text" class="srv-item-sn" value="${count}" placeholder="S/N">
            <input type="text" list="item-list" class="srv-item-desc" placeholder="Item Description" required>
            <input type="text" class="srv-item-denom" placeholder="Unit">
            <input type="number" class="srv-item-qty" placeholder="Qty Received" required>
            <input type="number" class="srv-item-value" placeholder="Value (₦)">
            <input type="text" class="srv-item-ledger" placeholder="Ledger/Folio">
            <input type="text" class="srv-item-remarks" placeholder="Purpose/Remarks">
            <button type="button" class="btn btn-sm btn-danger remove-row-btn">&times;</button>
        `;
        container.appendChild(row);
        // Auto-fill unit based on item selection
        row.querySelector('.srv-item-desc').addEventListener('change', async (e) => {
           const selectedOption = document.querySelector(`#item-list option[value="${e.target.value}"]`);
           if (selectedOption) {
               row.querySelector('.srv-item-denom').value = selectedOption.dataset.unit || '';
           }
        });
        row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    };

    // SRF Logic
     const initializeSrfLogic = () => {
        document.getElementById('add-srf-btn').addEventListener('click', () => {
            forms.srf.reset();
            document.getElementById('srf-id').value = '';
            document.getElementById('srf-items-container').innerHTML = ''; // Clear items
            addSrfItemRow(); // Add one empty row
            openModal('srf');
        });

        document.getElementById('srf-add-item-row').addEventListener('click', addSrfItemRow);

        forms.srf.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('srf-id').value;
            const items = [];
            document.querySelectorAll('.srf-item-row').forEach(row => {
                items.push({
                    s_no: row.querySelector('.srf-item-sno').value,
                    description_of_item: row.querySelector('.srf-item-desc').value,
                    quantity_requested: row.querySelector('.srf-item-qty-req').value,
                    quantity_issued: row.querySelector('.srf-item-qty-iss').value,
                    remarks: row.querySelector('.srf-item-remarks').value
                });
            });
            const docData = {
                department_unit: document.getElementById('srf-dept').value,
                requester_name: document.getElementById('srf-requester-name').value,
                requester_designation: document.getElementById('srf-requester-designation').value,
                srf_no: document.getElementById('srf-no').value,
                code: document.getElementById('srf-code').value,
                date: document.getElementById('srf-date').value,
                items: items,
                store_keeper: document.getElementById('srf-store-keeper').value,
                store_keeper_date: document.getElementById('srf-keeper-date').value
            };

            try {
                if (id) {
                    const doc = await db.srf.get(id);
                    await db.srf.put({ ...doc, ...docData });
                    logActivity('SRF Update', `Updated SRF: ${docData.srf_no}`);
                } else {
                    await db.srf.post({ ...docData, _id: `srf_${Date.now()}` });
                    logActivity('SRF Create', `Created SRF: ${docData.srf_no}`);
                }
                closeModal('srf');
                await refreshTable('srf');
            } catch (err) {
                console.error("Error saving SRF:", err);
            }
        });
    };
    
    const addSrfItemRow = () => {
        const container = document.getElementById('srf-items-container');
        const count = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'srf-item-row';
        row.innerHTML = `
            <input type="text" class="srf-item-sno" value="${count}" placeholder="S/NO">
            <input type="text" list="item-list" class="srf-item-desc" placeholder="Item Description" required>
            <input type="number" class="srf-item-qty-req" placeholder="Qty Requested" required>
            <input type="number" class="srf-item-qty-iss" placeholder="Qty Issued">
            <input type="text" class="srf-item-remarks" placeholder="Remarks">
            <button type="button" class="btn btn-sm btn-danger remove-row-btn">&times;</button>
        `;
        container.appendChild(row);
        row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
    };
    
    // --- Edit Handlers ---
    const editHandlers = {
        items: (doc) => {
            document.getElementById('item-id').value = doc._id;
            document.getElementById('item-code').value = doc.code;
            document.getElementById('item-name').value = doc.name;
            document.getElementById('item-unit').value = doc.unit;
            openModal('item');
        },
        // TODO: Add edit handlers for GRN, SRV, SRF that populate the form fields and item rows
    };

    // --- Bin Card Logic ---
    const updateBinCard = async () => {
        try {
            const allItems = await getDbData('items');
            const allSrv = await getDbData('srv');
            const allSrf = await getDbData('srf');
            
            const binCardData = [];

            for (const item of allItems) {
                let balance = 0;
                
                // Calculate quantity supplied from SRVs
                allSrv.forEach(srv => {
                    srv.items.forEach(srvItem => {
                        if (srvItem.item_description === item.name) {
                            balance += Number(srvItem.quantity_to_be_received) || 0;
                        }
                    });
                });

                // Calculate quantity issued from SRFs
                allSrf.forEach(srf => {
                    srf.items.forEach(srfItem => {
                        if (srfItem.description_of_item === item.name) {
                            balance -= Number(srfItem.quantity_issued) || 0;
                        }
                    });
                });

                binCardData.push({
                    _id: `bincard_${item.code}`,
                    code_no: item.code,
                    name_of_item: item.name,
                    unit: item.unit,
                    store_balance: balance
                });
            }
            
            // Clear existing bin card and bulk insert
            const oldDocs = await db.binCard.allDocs();
            if (oldDocs.rows.length > 0) {
                 const deleteOps = oldDocs.rows.map(row => ({ _id: row.id, _rev: row.value.rev, _deleted: true }));
                 await db.binCard.bulkDocs(deleteOps);
            }
            await db.binCard.bulkDocs(binCardData);
            
            if (isSectionActive('bin-card')) {
                await refreshTable('binCard');
            }

        } catch (err) {
            console.error('Failed to update bin card:', err);
        }
    };


    // --- Dashboard Logic ---
    const initializeDashboard = () => {
        // This function is called when the dashboard is shown
        initializeDashboardCharts();
    };
    
    const initializeDashboardCharts = async () => {
        const stockValueCtx = document.getElementById('stockValueChart').getContext('2d');
        const itemMovementCtx = document.getElementById('itemMovementChart').getContext('2d');
        
        const allSrv = await getDbData('srv');
        const allSrf = await getDbData('srf');

        // Destroy existing charts before creating new ones
        if (charts.stockValue) charts.stockValue.destroy();
        if (charts.itemMovement) charts.itemMovement.destroy();

        // 1. Stock Value Chart (Pie Chart)
        const stockData = {};
        allSrv.forEach(srv => {
            srv.items.forEach(item => {
                const value = parseFloat(item.value) || 0;
                const qty = parseFloat(item.quantity_to_be_received) || 0;
                const totalValue = value * qty;
                stockData[item.item_description] = (stockData[item.item_description] || 0) + totalValue;
            });
        });
        charts.stockValue = new Chart(stockValueCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(stockData),
                datasets: [{
                    label: 'Stock Value (₦)',
                    data: Object.values(stockData),
                    backgroundColor: ['#002366', '#800000', '#C4D600', '#6c757d', '#f8f9fa'],
                }]
            }
        });

        // 2. Item Movement Chart (Bar Chart)
        const movementData = {};
        allSrv.forEach(srv => {
            srv.items.forEach(item => {
                if (!movementData[item.item_description]) movementData[item.item_description] = { received: 0, issued: 0 };
                movementData[item.item_description].received += parseFloat(item.quantity_to_be_received) || 0;
            });
        });
        allSrf.forEach(srf => {
             srf.items.forEach(item => {
                if (!movementData[item.description_of_item]) movementData[item.description_of_item] = { received: 0, issued: 0 };
                movementData[item.description_of_item].issued += parseFloat(item.quantity_issued) || 0;
            });
        });
        charts.itemMovement = new Chart(itemMovementCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(movementData),
                datasets: [
                    {
                        label: 'Quantity Received',
                        data: Object.values(movementData).map(d => d.received),
                        backgroundColor: '#002366',
                    },
                    {
                        label: 'Quantity Issued',
                        data: Object.values(movementData).map(d => d.issued),
                        backgroundColor: '#C4D600',
                    }
                ]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    };

    // --- Export Logic ---
    const exportToCsv = (filename, rows) => {
        if (!rows || !rows.length) {
            alert("No data to export.");
            return;
        }
        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const initializeExportButtons = () => {
        document.getElementById('export-grn').addEventListener('click', async () => exportToCsv('grn_export.csv', await getDbData('grn')));
        document.getElementById('export-srv').addEventListener('click', async () => exportToCsv('srv_export.csv', await getDbData('srv')));
        document.getElementById('export-srf').addEventListener('click', async () => exportToCsv('srf_export.csv', await getDbData('srf')));
        document.getElementById('export-bin-card').addEventListener('click', async () => exportToCsv('bincard_export.csv', await getDbData('binCard')));
        document.getElementById('export-items').addEventListener('click', async () => exportToCsv('items_export.csv', await getDbData('items')));
        document.getElementById('export-activity-log').addEventListener('click', async () => exportToCsv('activity_log_export.csv', await getDbData('activityLog')));
    };

    // --- Signature Pad Initialization ---
    const initializeSignaturePads = () => {
        document.querySelectorAll('.signature-pad').forEach(canvas => {
            signaturePads[canvas.id] = new SignaturePad(canvas, {
                backgroundColor: 'rgb(238, 242, 247)'
            });
        });
        document.querySelectorAll('.clear-sig-btn').forEach(btn => {
           btn.addEventListener('click', (e) => {
               const canvas = e.target.previousElementSibling;
               if (signaturePads[canvas.id]) {
                   signaturePads[canvas.id].clear();
               }
           });
        });
    };
    

    // --- Main App Initialization ---
    const initializeApp = async () => {
        // Initial setup after login
        navLinks.forEach(link => link.addEventListener('click', handleNavigation));
        
        // Show dashboard by default
        document.querySelector('.nav-link[data-target="dashboard"]').click();
        
        await createItemDatalist();
        
        // Initialize form logic
        initializeGrnLogic();
        initializeSrvLogic();
        initializeSrfLogic();
        initializeItemsLogic();
        
        initializeSignaturePads();
        initializeExportButtons();
        
        // Initial update of bin card
        await updateBinCard();

    };

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
});
