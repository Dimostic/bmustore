// IndexedDB utilities will be accessed via window.IDB (loaded from idb.js)

// --- Dummy Data Insertion for Testing ---
async function insertDummyData() {
    const { addRecord, registerUser, showToast } = window.IDB;
    // Items
    await addRecord('items', { code: 'ITM001', name: 'Syringe 5ml', unit: 'pcs', createdAt: '2026-01-01T09:00:00Z' });
    await addRecord('items', { code: 'ITM002', name: 'Gloves', unit: 'box', createdAt: '2026-01-01T09:05:00Z' });
    await addRecord('items', { code: 'ITM003', name: 'Face Mask', unit: 'box', createdAt: '2026-01-01T09:10:00Z' });

    // GRN
    await addRecord('grn', {
        supplierName: 'MedSupply Ltd.',
        carrier: 'DHL',
        deliveryDate: '2026-01-02',
        drnNo: 'GRN-1001',
        lpoNo: 'LPO-2026-01',
        issueDate: '2026-01-02',
        createdAt: '2026-01-02T10:00:00Z'
    });
    await addRecord('grn', {
        supplierName: 'HealthPro',
        carrier: 'FedEx',
        deliveryDate: '2026-01-03',
        drnNo: 'GRN-1002',
        lpoNo: 'LPO-2026-02',
        issueDate: '2026-01-03',
        createdAt: '2026-01-03T11:00:00Z'
    });

    // SRV
    await addRecord('srv', {
        docNum: 'SRV-2001',
        department: 'Pharmacy',
        source: 'MedSupply Ltd.',
        date: '2026-01-04',
        createdAt: '2026-01-04T12:00:00Z'
    });
    await addRecord('srv', {
        docNum: 'SRV-2002',
        department: 'Lab',
        source: 'HealthPro',
        date: '2026-01-05',
        createdAt: '2026-01-05T13:00:00Z'
    });

    // SRF
    await addRecord('srf', {
        srfNo: 'SRF-3001',
        departmentUnit: 'Surgery',
        requesterName: 'Dr. Okoro',
        date: '2026-01-06',
        createdAt: '2026-01-06T14:00:00Z'
    });
    await addRecord('srf', {
        srfNo: 'SRF-3002',
        departmentUnit: 'Pediatrics',
        requesterName: 'Dr. Musa',
        date: '2026-01-07',
        createdAt: '2026-01-07T15:00:00Z'
    });

    // Activity Log
    await addRecord('activity_log', {
        user: 'admin',
        action: 'Test Login',
        details: 'Dummy login for testing',
        timestamp: '2026-01-01T08:00:00Z'
    });
    await addRecord('activity_log', {
        user: 'admin',
        action: 'Test Data Entry',
        details: 'Inserted dummy data',
        timestamp: '2026-01-01T08:05:00Z'
    });

    // Users (besides admin)
    await registerUser('storekeeper', 'store123', 'user');
    await registerUser('auditor', 'audit123', 'user');

    showToast('Dummy data inserted for testing!');
    // Optionally refresh tables if visible
    if (typeof refreshTable === 'function') {
        await refreshTable('items');
        await refreshTable('grn');
        await refreshTable('srv');
        await refreshTable('srf');
        await refreshTable('activityLog');
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
            await addRecord('activityLog', {
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
            // initializeApp();
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

            // Clear signature pads
            Object.values(signaturePads).forEach(pad => pad.clear());
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
                    await updateRecord('items', { id, ...itemData });
                    logActivity('Item Update', `Updated item: ${itemData.name}`);
                } else {
                    await addRecord('items', { ...itemData, createdAt: new Date().toISOString() });
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
            const data = await getAllRecords(dbName);
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
    
    // --- DataTables Initializers ---
    const tableConfigs = {
        grn: {
            columns: [
                { data: 'drnNo', title: 'DRN No' },
                { data: 'supplierName', title: 'Supplier' },
                { data: 'deliveryDate', title: 'Delivery Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('grn', d) }
            ]
        },
        srv: {
            columns: [
                { data: 'docNum', title: 'Doc No' },
                { data: 'department', title: 'Department' },
                { data: 'source', title: 'Source' },
                { data: 'date', title: 'Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srv', d) }
            ]
        },
        srf: {
            columns: [
                { data: 'srfNo', title: 'SRF No' },
                { data: 'departmentUnit', title: 'Department' },
                { data: 'requesterName', title: 'Requester' },
                { data: 'date', title: 'Date' },
                { data: null, title: 'Actions', render: (d) => createActionButtons('srf', d) }
            ]
        },
        binCard: {
            columns: [
                { data: 'codeNo', title: 'Code No' },
                { data: 'nameOfItem', title: 'Item Name' },
                { data: 'unit', title: 'Unit' },
                { data: 'storeBalance', title: 'Balance' },
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

        const tableId = `${dbName}-table`;
        const config = tableConfigs[dbName];
        if (!config) return;

        const data = await getAllRecords(dbName);
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
            const doc = await getAllRecords(dbName).then(records => records.find(record => record.id === id));
            // This needs specific edit handlers per form type
            if (editHandlers[dbName]) {
                editHandlers[dbName](doc);
            }
        });
    };

    // --- GRN Logic ---
    $('#grn-form').on('submit', async function(e) {
        e.preventDefault();
        const grnData = {
            supplierName: $('#grn-supplier-name').val(),
            carrier: $('#grn-carrier').val(),
            deliveryDate: $('#grn-delivery-date').val(),
            drnNo: $('#grn-drn-no').val(),
            lpoNo: $('#grn-lpo-no').val(),
            issueDate: $('#grn-issue-date').val(),
            createdAt: new Date().toISOString()
        };
        try {
            await addRecord('grn', grnData);
            showToast('GRN saved successfully!');
            $('#grn-modal').hide();
            await refreshTable('grn');
        } catch (err) {
            showToast('Error saving GRN: ' + err.message);
        }
    });

    async function loadGrnTable() {
        const records = await getAllRecords('grn');
        $('#grn-table').DataTable({
            data: records,
            destroy: true,
            columns: [
                { title: 'Supplier', data: 'supplierName' },
                { title: 'Carrier', data: 'carrier' },
                { title: 'Delivery Date', data: 'deliveryDate' },
                { title: 'DRN No', data: 'drnNo' },
                { title: 'LPO No', data: 'lpoNo' },
                { title: 'Issue Date', data: 'issueDate' },
            ]
        });
    }

    // --- Accessibility ---
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.modal:visible').hide();
        }
    });

    // --- Responsive Handling ---
    $(window).on('resize', function() {
        $('.modal-content').css('max-width', $(window).width() < 800 ? '95%' : '800px');
    });

    // --- Main App Initialization ---
    const initializeApp = async () => {
        // Initial setup after login
        navLinks.forEach(link => link.addEventListener('click', handleNavigation));
        
        // Show dashboard by default
        document.querySelector('.nav-link[data-target="dashboard"]').click();
        
        await createItemDatalist();
        
        // Initialize form logic
        initializeItemsLogic();
        
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
            showToast('Default admin user created');
        }
    }
    $(document).ready(function() {
        ensureAdminUser();
        // ...existing code for loading tables, etc...
    });

    // --- Example: Audit log for data changes ---
    async function saveGrn(grnData) {
        try {
            const id = await addRecord('grn', grnData);
            showToast('GRN saved successfully!');
            if (currentSessionId) {
                const session = await getSession(currentSessionId);
                logAudit('add_grn', session.userId, { grnId: id });
            }
            $('#grn-modal').hide();
            // Optionally refresh table
        } catch (err) {
            showToast('Error saving GRN: ' + err.message);
        }
    }
    $('#grn-form').on('submit', function(e) {
        e.preventDefault();
        const grnData = {
            supplierName: $('#grn-supplier-name').val(),
            carrier: $('#grn-carrier').val(),
            deliveryDate: $('#grn-delivery-date').val(),
            drnNo: $('#grn-drn-no').val(),
            lpoNo: $('#grn-lpo-no').val(),
            issueDate: $('#grn-issue-date').val(),
            createdAt: new Date().toISOString()
        };
        saveGrn(grnData);
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
        if ($('#manage-users-nav').length === 0) {
            $('.top-nav ul').append('<li><a href="#" id="manage-users-nav" class="nav-link">Manage Users</a></li>');
        }
        if ($('#sync-to-remote').length === 0) {
            $('.top-nav ul').append('<li><a href="#" id="sync-to-remote" class="nav-link">Sync to Server</a></li>');
            $('.top-nav ul').append('<li><a href="#" id="sync-from-remote" class="nav-link">Sync from Server</a></li>');
        }
        if ($('#user-management-section').length === 0) {
            $('#app').append('<section id="user-management-section" class="content-section" style="display:none;"></section>');
        }
    });

    // Add a temporary button for inserting dummy data (remove in production)
    if (!document.getElementById('insert-dummy-btn')) {
        const btn = document.createElement('button');
        btn.id = 'insert-dummy-btn';
        btn.textContent = 'Insert Dummy Data';
        btn.className = 'btn btn-secondary';
        btn.style.position = 'fixed';
        btn.style.bottom = '80px';
        btn.style.right = '20px';
        btn.style.zIndex = 9999;
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = 'Inserting...';
            await insertDummyData();
            btn.textContent = 'Insert Dummy Data';
            btn.disabled = false;
        };
        document.body.appendChild(btn);
    }
});
