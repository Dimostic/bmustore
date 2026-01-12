// server.js - BMU Store Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for secure cookies behind Nginx)
app.set('trust proxy', 1);

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'bmustore_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bmustore_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for local development
}));
app.use(cors({
    origin: ['https://bmustore.mehetti.com', 'http://localhost:8080'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'bmu-store-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ===================== API Routes =====================

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Authentication Routes ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute(
            'SELECT u.*, r.permissions FROM users u LEFT JOIN roles r ON u.role = r.role_name WHERE u.username = ?',
            [username]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        
        // Check if user is active
        if (user.is_active === 0) {
            return res.status(401).json({ error: 'Account is disabled. Contact administrator.' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create session
        const sessionId = uuidv4();
        await pool.execute(
            'INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
            [sessionId, user.id]
        );
        
        // Update last login
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        
        // Parse permissions
        let permissions = {};
        try {
            permissions = user.permissions ? JSON.parse(user.permissions) : {};
        } catch (e) {
            permissions = {};
        }
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.permissions = permissions;
        
        // Log activity
        await logActivity(user.id, 'LOGIN', `User ${username} logged in`);
        
        // Save session before sending response
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name,
                    permissions
                },
                sessionId
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        if (req.session.userId) {
            await logActivity(req.session.userId, 'LOGOUT', `User ${req.session.username} logged out`);
            await pool.execute('DELETE FROM sessions WHERE user_id = ?', [req.session.userId]);
        }
        req.session.destroy();
        res.json({ success: true });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.role,
                permissions: req.session.permissions
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// --- Auth Middleware ---
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Role hierarchy: superadmin > admin > storekeeper > auditor > viewer
const roleHierarchy = {
    'superadmin': 5,
    'admin': 4,
    'storekeeper': 3,
    'auditor': 2,
    'viewer': 1
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!allowedRoles.includes(req.session.role)) {
            return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
        }
        next();
    };
};

const requireAdmin = (req, res, next) => {
    if (!req.session.userId || !['admin', 'superadmin'].includes(req.session.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
    }
    next();
};

// Permission check middleware
const checkPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const role = req.session.role;
        const permissions = req.session.permissions;
        
        // Superadmin and admin have full access
        if (['superadmin', 'admin'].includes(role)) {
            return next();
        }
        
        // Check specific permission
        if (permissions && permissions[resource] && permissions[resource].includes(action)) {
            return next();
        }
        
        return res.status(403).json({ error: `Forbidden - No ${action} permission for ${resource}` });
    };
};

// --- User Management Routes ---
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, username, full_name, email, role, is_active, last_login, created_at FROM users ORDER BY FIELD(role, "superadmin", "admin", "storekeeper", "auditor", "viewer"), username'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get roles
app.get('/api/roles', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM roles ORDER BY id');
        res.json(rows.map(r => ({
            ...r,
            permissions: r.permissions ? JSON.parse(r.permissions) : {}
        })));
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { username, password, role = 'viewer', fullName, email } = req.body;
        
        // Only superadmin can create superadmin or admin users
        if (['superadmin', 'admin'].includes(role) && req.session.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only Super Admin can create admin users' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role, full_name, email, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [username, passwordHash, role, fullName || null, email || null, req.session.userId]
        );
        
        await logActivity(req.session.userId, 'USER_CREATE', `Created user: ${username}`);
        
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role, fullName, email, isActive } = req.body;
        
        // Get the target user's current role
        const [targetUser] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const targetRole = targetUser[0].role;
        
        // Only superadmin can modify admin users
        if (['superadmin', 'admin'].includes(targetRole) && req.session.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only Super Admin can modify admin users' });
        }
        
        // Only superadmin can promote to admin/superadmin
        if (['superadmin', 'admin'].includes(role) && req.session.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only Super Admin can assign admin roles' });
        }
        
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.execute(
                'UPDATE users SET username = ?, password_hash = ?, role = ?, full_name = ?, email = ?, is_active = ? WHERE id = ?',
                [username, passwordHash, role, fullName || null, email || null, isActive !== false ? 1 : 0, id]
            );
        } else {
            await pool.execute(
                'UPDATE users SET username = ?, role = ?, full_name = ?, email = ?, is_active = ? WHERE id = ?',
                [username, role, fullName || null, email || null, isActive !== false ? 1 : 0, id]
            );
        }
        
        await logActivity(req.session.userId, 'USER_UPDATE', `Updated user ID: ${id}`);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change own password
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Get current user
        const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.session.userId]);
        
        await logActivity(req.session.userId, 'PASSWORD_CHANGE', 'User changed their password');
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent self-deletion
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Get the target user's role
        const [targetUser] = await pool.execute('SELECT role, username FROM users WHERE id = ?', [id]);
        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const targetRole = targetUser[0].role;
        
        // Only superadmin can delete admin users
        if (targetRole === 'admin' && req.session.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only Super Admin can delete admin users' });
        }
        
        // Nobody can delete superadmin except themselves (which is blocked above)
        if (targetRole === 'superadmin') {
            return res.status(403).json({ error: 'Cannot delete Super Admin account' });
        }
        
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        await logActivity(req.session.userId, 'USER_DELETE', `Deleted user: ${targetUser[0].username}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Generic CRUD Routes for Stores ---
const stores = ['grn', 'srv', 'srf', 'items'];

stores.forEach(store => {
    // Get all records
    app.get(`/api/${store}`, requireAuth, async (req, res) => {
        try {
            const [rows] = await pool.execute(`SELECT * FROM ${store} ORDER BY id DESC`);
            // Parse JSON fields
            const parsed = rows.map(row => {
                if (row.items) row.items = JSON.parse(row.items);
                if (row.signatures) row.signatures = JSON.parse(row.signatures);
                return row;
            });
            res.json(parsed);
        } catch (err) {
            console.error(`Error fetching ${store}:`, err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Get single record
    app.get(`/api/${store}/:id`, requireAuth, async (req, res) => {
        try {
            const [rows] = await pool.execute(`SELECT * FROM ${store} WHERE id = ?`, [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Record not found' });
            }
            const row = rows[0];
            if (row.items) row.items = JSON.parse(row.items);
            if (row.signatures) row.signatures = JSON.parse(row.signatures);
            res.json(row);
        } catch (err) {
            console.error(`Error fetching ${store}:`, err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Create record
    app.post(`/api/${store}`, requireAuth, async (req, res) => {
        try {
            const data = req.body;
            // Stringify JSON fields
            if (data.items) data.items = JSON.stringify(data.items);
            if (data.signatures) data.signatures = JSON.stringify(data.signatures);
            
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = columns.map(() => '?').join(', ');
            
            const [result] = await pool.execute(
                `INSERT INTO ${store} (${columns.join(', ')}) VALUES (${placeholders})`,
                values
            );
            
            await logActivity(req.session.userId, `${store.toUpperCase()}_CREATE`, `Created ${store} record ID: ${result.insertId}`);
            
            res.json({ success: true, id: result.insertId });
        } catch (err) {
            console.error(`Error creating ${store}:`, err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Update record
    app.put(`/api/${store}/:id`, requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            delete data.id; // Remove id from update data
            
            // Stringify JSON fields
            if (data.items) data.items = JSON.stringify(data.items);
            if (data.signatures) data.signatures = JSON.stringify(data.signatures);
            
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), id];
            
            await pool.execute(`UPDATE ${store} SET ${setClause} WHERE id = ?`, values);
            
            await logActivity(req.session.userId, `${store.toUpperCase()}_UPDATE`, `Updated ${store} record ID: ${id}`);
            
            res.json({ success: true });
        } catch (err) {
            console.error(`Error updating ${store}:`, err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Delete record
    app.delete(`/api/${store}/:id`, requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            await pool.execute(`DELETE FROM ${store} WHERE id = ?`, [id]);
            await logActivity(req.session.userId, `${store.toUpperCase()}_DELETE`, `Deleted ${store} record ID: ${id}`);
            res.json({ success: true });
        } catch (err) {
            console.error(`Error deleting ${store}:`, err);
            res.status(500).json({ error: 'Server error' });
        }
    });
});

// --- Activity Log ---
app.get('/api/activity_log', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT al.*, u.username 
            FROM activity_log al 
            LEFT JOIN users u ON al.user_id = u.id 
            ORDER BY al.timestamp DESC 
            LIMIT 500
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching activity log:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Bin Card (computed from other tables) ---
app.get('/api/bincard', requireAuth, async (req, res) => {
    try {
        const [items] = await pool.execute('SELECT * FROM items');
        const [grn] = await pool.execute('SELECT items FROM grn');
        const [srf] = await pool.execute('SELECT items FROM srf');
        
        const binCardData = items.map(item => {
            let totalReceived = 0;
            let totalIssued = 0;
            let lastSrfNo = '';
            
            // Calculate received from GRN
            grn.forEach(g => {
                const grnItems = g.items ? JSON.parse(g.items) : [];
                grnItems.forEach(gi => {
                    if (gi.code === item.code) {
                        totalReceived += gi.qtyReceived || 0;
                    }
                });
            });
            
            // Calculate issued from SRF
            srf.forEach(s => {
                const srfItems = s.items ? JSON.parse(s.items) : [];
                srfItems.forEach(si => {
                    if (si.code === item.code) {
                        totalIssued += si.qtyIssued || 0;
                    }
                });
            });
            
            const balance = totalReceived - totalIssued;
            
            return {
                codeNo: item.code,
                nameOfItem: item.name,
                unit: item.unit,
                category: item.category || '-',
                location: item.location || '-',
                minStock: item.min_stock || 0,
                quantitySupplied: totalReceived,
                quantityIssued: totalIssued,
                storeBalance: balance,
                lastRequisitionNo: lastSrfNo || '-',
                status: balance <= (item.min_stock || 0) ? 'Low Stock' : 'OK',
                remarks: balance <= 0 ? 'Out of Stock' : (balance <= (item.min_stock || 0) ? 'Reorder Required' : '')
            };
        });
        
        res.json(binCardData);
    } catch (err) {
        console.error('Error computing bin card:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Dashboard Stats ---
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const [[itemCount]] = await pool.execute('SELECT COUNT(*) as count FROM items');
        const [[grnCount]] = await pool.execute('SELECT COUNT(*) as count FROM grn');
        const [[srvCount]] = await pool.execute('SELECT COUNT(*) as count FROM srv');
        const [[srfCount]] = await pool.execute('SELECT COUNT(*) as count FROM srf');
        
        res.json({
            items: itemCount.count,
            grn: grnCount.count,
            srv: srvCount.count,
            srf: srfCount.count
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Helper Functions ---
async function logActivity(userId, action, details) {
    try {
        await pool.execute(
            'INSERT INTO activity_log (user_id, action, details, timestamp) VALUES (?, ?, ?, NOW())',
            [userId, action, details]
        );
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// --- Initialize Default Users and Roles ---
async function initializeDefaultAdmin() {
    try {
        // First, ensure roles table exists and has default roles
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(255),
                description TEXT,
                permissions JSON,
                can_delete_users BOOLEAN DEFAULT FALSE,
                can_delete_admin BOOLEAN DEFAULT FALSE,
                can_create_users BOOLEAN DEFAULT FALSE,
                can_edit_all BOOLEAN DEFAULT FALSE,
                can_view_all BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        
        // Insert default roles
        const defaultRoles = [
            ['superadmin', 'Super Administrator', 'Full system access including ability to delete admins', 
             '{"items":["create","read","update","delete"],"grn":["create","read","update","delete"],"srv":["create","read","update","delete"],"srf":["create","read","update","delete"],"users":["create","read","update","delete"],"reports":["create","read","export"],"settings":["read","update"],"activity_log":["read","export"]}',
             true, true, true, true],
            ['admin', 'Administrator', 'Full access except deleting other admins', 
             '{"items":["create","read","update","delete"],"grn":["create","read","update","delete"],"srv":["create","read","update","delete"],"srf":["create","read","update","delete"],"users":["create","read","update","delete"],"reports":["create","read","export"],"settings":["read"],"activity_log":["read"]}',
             true, false, true, true],
            ['storekeeper', 'Store Keeper', 'Manage inventory, create GRN, SRV, SRF', 
             '{"items":["create","read","update"],"grn":["create","read","update"],"srv":["create","read","update"],"srf":["create","read","update"],"reports":["read"],"activity_log":["read"]}',
             false, false, false, true],
            ['auditor', 'Auditor', 'View all data and activity logs, export reports', 
             '{"items":["read"],"grn":["read"],"srv":["read"],"srf":["read"],"reports":["read","export"],"activity_log":["read","export"]}',
             false, false, false, false],
            ['viewer', 'Viewer', 'View-only access to inventory data', 
             '{"items":["read"],"grn":["read"],"srv":["read"],"srf":["read"],"reports":["read"]}',
             false, false, false, false]
        ];
        
        for (const role of defaultRoles) {
            await pool.execute(`
                INSERT IGNORE INTO roles (role_name, display_name, description, permissions, can_delete_users, can_delete_admin, can_create_users, can_edit_all)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, role);
        }
        
        // Check if users table needs migration (add new columns if missing)
        try {
            await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
            await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
            await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
            await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login DATETIME`);
            await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INT`);
        } catch (e) {
            // Columns might already exist, ignore error
        }
        
        // Modify role enum to include superadmin and viewer
        try {
            await pool.execute(`ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'admin', 'storekeeper', 'auditor', 'viewer') DEFAULT 'viewer'`);
        } catch (e) {
            // Might fail if already correct
        }
        
        // Create superadmin user
        const [superadmin] = await pool.execute('SELECT * FROM users WHERE username = ?', ['superadmin']);
        if (superadmin.length === 0) {
            const passwordHash = await bcrypt.hash('SuperAdmin@2026!', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['superadmin', passwordHash, 'superadmin', 'System Super Administrator', 'superadmin@bmustore.mehetti.com', true]
            );
            console.log('✓ Super Admin created (superadmin / SuperAdmin@2026!)');
        }
        
        // Create admin user
        const [admin] = await pool.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        if (admin.length === 0) {
            const passwordHash = await bcrypt.hash('Admin@2026!', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin', passwordHash, 'admin', 'System Administrator', 'admin@bmustore.mehetti.com', true]
            );
            console.log('✓ Admin created (admin / Admin@2026!)');
        }
        
        // Create storekeeper user
        const [storekeeper] = await pool.execute('SELECT * FROM users WHERE username = ?', ['storekeeper']);
        if (storekeeper.length === 0) {
            const passwordHash = await bcrypt.hash('Store@2026!', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['storekeeper', passwordHash, 'storekeeper', 'Store Keeper', 'storekeeper@bmustore.mehetti.com', true]
            );
            console.log('✓ Store Keeper created (storekeeper / Store@2026!)');
        }
        
        // Create auditor user
        const [auditor] = await pool.execute('SELECT * FROM users WHERE username = ?', ['auditor']);
        if (auditor.length === 0) {
            const passwordHash = await bcrypt.hash('Audit@2026!', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['auditor', passwordHash, 'auditor', 'System Auditor', 'auditor@bmustore.mehetti.com', true]
            );
            console.log('✓ Auditor created (auditor / Audit@2026!)');
        }
        
        // Create viewer user
        const [viewer] = await pool.execute('SELECT * FROM users WHERE username = ?', ['viewer']);
        if (viewer.length === 0) {
            const passwordHash = await bcrypt.hash('View@2026!', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['viewer', passwordHash, 'viewer', 'General Viewer', 'viewer@bmustore.mehetti.com', true]
            );
            console.log('✓ Viewer created (viewer / View@2026!)');
        }
        
        console.log('✓ User initialization complete');
    } catch (err) {
        console.error('Error initializing default admin:', err);
    }
}

// --- Initialize Dummy Data ---
async function initializeDummyData() {
    try {
        // Check if items exist
        const [[itemCount]] = await pool.execute('SELECT COUNT(*) as count FROM items');
        if (itemCount.count > 0) {
            console.log('✓ Dummy data already exists');
            return;
        }
        
        console.log('Inserting dummy data...');
        
        // Items - Medical Supplies
        const items = [
            ['MED-001', 'Syringe 5ml', 'pcs', 'Medical Supplies', 100, 'Shelf A-1', 'Disposable syringes for injections'],
            ['MED-002', 'Surgical Gloves (Pair)', 'box', 'Medical Supplies', 50, 'Shelf A-2', 'Latex-free surgical gloves'],
            ['MED-003', 'Face Mask N95', 'box', 'Medical Supplies', 30, 'Shelf A-3', 'N95 respirator masks'],
            ['MED-004', 'Bandage Roll 4inch', 'roll', 'Medical Supplies', 100, 'Shelf B-1', 'Cotton bandage rolls'],
            ['MED-005', 'Cotton Wool 500g', 'pack', 'Medical Supplies', 40, 'Shelf B-2', 'Absorbent cotton wool'],
            ['MED-006', 'Antiseptic Solution 500ml', 'bottle', 'Medical Supplies', 25, 'Shelf B-3', 'Chlorhexidine antiseptic'],
            ['MED-007', 'Gauze Pads 4x4', 'pack', 'Medical Supplies', 60, 'Shelf B-4', 'Sterile gauze pads'],
            ['STA-001', 'A4 Paper', 'ream', 'Stationery', 50, 'Shelf C-1', '80gsm white paper'],
            ['STA-002', 'Ballpoint Pen (Blue)', 'box', 'Stationery', 20, 'Shelf C-2', 'Box of 12 pens'],
            ['STA-003', 'Stapler', 'pcs', 'Stationery', 10, 'Shelf C-3', 'Heavy duty stapler'],
            ['STA-004', 'File Folders', 'pack', 'Stationery', 30, 'Shelf C-4', 'A4 manila folders'],
            ['EQP-001', 'Stethoscope', 'pcs', 'Equipment', 5, 'Cabinet D-1', 'Professional grade stethoscope'],
            ['EQP-002', 'Blood Pressure Monitor', 'pcs', 'Equipment', 3, 'Cabinet D-2', 'Digital BP monitor'],
            ['EQP-003', 'Thermometer Digital', 'pcs', 'Equipment', 10, 'Cabinet D-3', 'Infrared thermometer'],
            ['CLN-001', 'Hand Sanitizer 500ml', 'bottle', 'Cleaning', 40, 'Shelf E-1', 'Alcohol-based sanitizer'],
            ['CLN-002', 'Disinfectant Spray', 'can', 'Cleaning', 30, 'Shelf E-2', 'Surface disinfectant']
        ];
        
        for (const item of items) {
            await pool.execute(
                'INSERT INTO items (code, name, unit, category, min_stock, location, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                item
            );
        }
        console.log('✓ Items inserted');
        
        // GRN Records
        const grnRecords = [
            {
                drn_no: 'GRN-2026-001', lpo_no: 'LPO-2026-001', issue_date: '2026-01-02', delivery_date: '2026-01-02',
                supplier_name: 'MedSupply Nigeria Ltd.', carrier: 'DHL Express', waybill_no: 'WB-12345', invoice_no: 'INV-001',
                items: JSON.stringify([
                    { sno: 1, description: 'Syringe 5ml', code: 'MED-001', qtyOrdered: 500, qtyReceived: 500, unit: 'pcs', remark: 'Good condition' },
                    { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', qtyOrdered: 100, qtyReceived: 100, unit: 'box', remark: '' }
                ]),
                examined_by: 'Dr. Okeke', examined_dept: 'Quality Control', received_by: 'Mr. James', received_dept: 'Store',
                distribution: 'Finance, Audit, Store'
            },
            {
                drn_no: 'GRN-2026-002', lpo_no: 'LPO-2026-002', issue_date: '2026-01-05', delivery_date: '2026-01-05',
                supplier_name: 'HealthPro Supplies', carrier: 'FedEx', waybill_no: 'WB-12346', invoice_no: 'INV-002',
                items: JSON.stringify([
                    { sno: 1, description: 'Face Mask N95', code: 'MED-003', qtyOrdered: 200, qtyReceived: 200, unit: 'box', remark: '' },
                    { sno: 2, description: 'A4 Paper', code: 'STA-001', qtyOrdered: 100, qtyReceived: 100, unit: 'ream', remark: '' },
                    { sno: 3, description: 'Hand Sanitizer 500ml', code: 'CLN-001', qtyOrdered: 80, qtyReceived: 80, unit: 'bottle', remark: '' }
                ]),
                examined_by: 'Dr. Musa', examined_dept: 'Quality Control', received_by: 'Mr. James', received_dept: 'Store',
                distribution: 'Finance, Audit'
            },
            {
                drn_no: 'GRN-2026-003', lpo_no: 'LPO-2026-003', issue_date: '2026-01-10', delivery_date: '2026-01-10',
                supplier_name: 'Office Essentials Ltd.', carrier: 'Local Delivery', waybill_no: 'WB-12347', invoice_no: 'INV-003',
                items: JSON.stringify([
                    { sno: 1, description: 'Ballpoint Pen (Blue)', code: 'STA-002', qtyOrdered: 50, qtyReceived: 50, unit: 'box', remark: '' },
                    { sno: 2, description: 'File Folders', code: 'STA-004', qtyOrdered: 100, qtyReceived: 95, unit: 'pack', remark: '5 packs damaged' }
                ]),
                examined_by: 'Mrs. Ada', examined_dept: 'Admin', received_by: 'Mr. James', received_dept: 'Store',
                distribution: 'Finance, Admin'
            }
        ];
        
        for (const grn of grnRecords) {
            await pool.execute(
                'INSERT INTO grn (drn_no, lpo_no, issue_date, delivery_date, supplier_name, carrier, waybill_no, invoice_no, items, examined_by, examined_dept, received_by, received_dept, distribution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [grn.drn_no, grn.lpo_no, grn.issue_date, grn.delivery_date, grn.supplier_name, grn.carrier, grn.waybill_no, grn.invoice_no, grn.items, grn.examined_by, grn.examined_dept, grn.received_by, grn.received_dept, grn.distribution]
            );
        }
        console.log('✓ GRN records inserted');
        
        // SRV Records
        const srvRecords = [
            {
                doc_num: 'SRV-2026-001', date: '2026-01-03', po_lso_no: 'PO-001',
                department: 'Pharmacy', source: 'MedSupply Nigeria Ltd.',
                items: JSON.stringify([
                    { sno: 1, description: 'Syringe 5ml', code: 'MED-001', unit: 'pcs', quantity: 200, unitPrice: 50, value: 10000, ledgerFolio: 'LF-001', remarks: '' },
                    { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', unit: 'box', quantity: 50, unitPrice: 2500, value: 125000, ledgerFolio: 'LF-002', remarks: '' }
                ]),
                total_value: 135000, order_no: 'ORD-001', order_date: '2026-01-01', invoice_no: 'INV-001', invoice_date: '2026-01-02',
                certified_by: 'Mr. Adamu', certified_designation: 'Store Officer', certified_date: '2026-01-03'
            },
            {
                doc_num: 'SRV-2026-002', date: '2026-01-06', po_lso_no: 'PO-002',
                department: 'Laboratory', source: 'HealthPro Supplies',
                items: JSON.stringify([
                    { sno: 1, description: 'Face Mask N95', code: 'MED-003', unit: 'box', quantity: 100, unitPrice: 3500, value: 350000, ledgerFolio: 'LF-003', remarks: '' }
                ]),
                total_value: 350000, order_no: 'ORD-002', order_date: '2026-01-04', invoice_no: 'INV-002', invoice_date: '2026-01-05',
                certified_by: 'Mr. Adamu', certified_designation: 'Store Officer', certified_date: '2026-01-06'
            }
        ];
        
        for (const srv of srvRecords) {
            await pool.execute(
                'INSERT INTO srv (doc_num, date, po_lso_no, department, source, items, total_value, order_no, order_date, invoice_no, invoice_date, certified_by, certified_designation, certified_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [srv.doc_num, srv.date, srv.po_lso_no, srv.department, srv.source, srv.items, srv.total_value, srv.order_no, srv.order_date, srv.invoice_no, srv.invoice_date, srv.certified_by, srv.certified_designation, srv.certified_date]
            );
        }
        console.log('✓ SRV records inserted');
        
        // SRF Records
        const srfRecords = [
            {
                srf_no: 'SRF-2026-001', date: '2026-01-07', cost_code: 'CC-SURG-001',
                department_unit: 'Surgery Department', requester_name: 'Dr. Okoro', designation: 'Senior Surgeon',
                items: JSON.stringify([
                    { sno: 1, description: 'Syringe 5ml', code: 'MED-001', unit: 'pcs', qtyRequested: 100, qtyIssued: 100, remarks: 'Urgent' },
                    { sno: 2, description: 'Surgical Gloves (Pair)', code: 'MED-002', unit: 'box', qtyRequested: 20, qtyIssued: 20, remarks: '' }
                ]),
                approved_by: 'Prof. Ibrahim', approval_date: '2026-01-07',
                issued_by: 'Mr. James', issue_date: '2026-01-07', received_by: 'Nurse Ada'
            },
            {
                srf_no: 'SRF-2026-002', date: '2026-01-08', cost_code: 'CC-LAB-001',
                department_unit: 'Laboratory', requester_name: 'Dr. Chukwu', designation: 'Lab Director',
                items: JSON.stringify([
                    { sno: 1, description: 'Face Mask N95', code: 'MED-003', unit: 'box', qtyRequested: 30, qtyIssued: 30, remarks: '' },
                    { sno: 2, description: 'Hand Sanitizer 500ml', code: 'CLN-001', unit: 'bottle', qtyRequested: 10, qtyIssued: 10, remarks: '' }
                ]),
                approved_by: 'Prof. Ibrahim', approval_date: '2026-01-08',
                issued_by: 'Mr. James', issue_date: '2026-01-08', received_by: 'Mr. Emeka'
            },
            {
                srf_no: 'SRF-2026-003', date: '2026-01-10', cost_code: 'CC-ADM-001',
                department_unit: 'Administration', requester_name: 'Mrs. Ngozi', designation: 'Admin Officer',
                items: JSON.stringify([
                    { sno: 1, description: 'A4 Paper', code: 'STA-001', unit: 'ream', qtyRequested: 20, qtyIssued: 20, remarks: '' },
                    { sno: 2, description: 'Ballpoint Pen (Blue)', code: 'STA-002', unit: 'box', qtyRequested: 10, qtyIssued: 10, remarks: '' },
                    { sno: 3, description: 'File Folders', code: 'STA-004', unit: 'pack', qtyRequested: 15, qtyIssued: 15, remarks: '' }
                ]),
                approved_by: 'Dr. Bello', approval_date: '2026-01-10',
                issued_by: 'Mr. James', issue_date: '2026-01-10', received_by: 'Mrs. Ngozi'
            }
        ];
        
        for (const srf of srfRecords) {
            await pool.execute(
                'INSERT INTO srf (srf_no, date, cost_code, department_unit, requester_name, designation, items, approved_by, approval_date, issued_by, issue_date, received_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [srf.srf_no, srf.date, srf.cost_code, srf.department_unit, srf.requester_name, srf.designation, srf.items, srf.approved_by, srf.approval_date, srf.issued_by, srf.issue_date, srf.received_by]
            );
        }
        console.log('✓ SRF records inserted');
        
        console.log('✓ Dummy data initialization complete');
    } catch (err) {
        console.error('Error initializing dummy data:', err);
    }
}

// --- Catch-all for SPA ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(`  BMU Store Server v1.0`);
    console.log(`  Running on port ${PORT}`);
    console.log(`========================================\n`);
    
    await initializeDefaultAdmin();
    await initializeDummyData();
    
    console.log(`\n========================================`);
    console.log(`  Default User Credentials:`);
    console.log(`  - superadmin / SuperAdmin@2026!`);
    console.log(`  - admin / Admin@2026!`);
    console.log(`  - storekeeper / Store@2026!`);
    console.log(`  - auditor / Audit@2026!`);
    console.log(`  - viewer / View@2026!`);
    console.log(`========================================\n`);
});

module.exports = app;
