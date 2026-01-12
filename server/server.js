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
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
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
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        
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
                    role: user.role
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
                role: req.session.role
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

const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// --- User Management Routes ---
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, role, created_at FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, passwordHash, role]
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
        const { username, password, role } = req.body;
        
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.execute(
                'UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?',
                [username, passwordHash, role, id]
            );
        } else {
            await pool.execute(
                'UPDATE users SET username = ?, role = ? WHERE id = ?',
                [username, role, id]
            );
        }
        
        await logActivity(req.session.userId, 'USER_UPDATE', `Updated user ID: ${id}`);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        await logActivity(req.session.userId, 'USER_DELETE', `Deleted user ID: ${id}`);
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

// --- Initialize Default Admin User ---
async function initializeDefaultAdmin() {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        if (rows.length === 0) {
            const passwordHash = await bcrypt.hash('password123', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ['admin', passwordHash, 'admin']
            );
            console.log('Default admin user created (admin/password123)');
        }
        
        // Also create storekeeper and auditor
        const [storekeeper] = await pool.execute('SELECT * FROM users WHERE username = ?', ['storekeeper']);
        if (storekeeper.length === 0) {
            const passwordHash = await bcrypt.hash('store123', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ['storekeeper', passwordHash, 'storekeeper']
            );
            console.log('Default storekeeper user created (storekeeper/store123)');
        }
        
        const [auditor] = await pool.execute('SELECT * FROM users WHERE username = ?', ['auditor']);
        if (auditor.length === 0) {
            const passwordHash = await bcrypt.hash('audit123', 10);
            await pool.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ['auditor', passwordHash, 'auditor']
            );
            console.log('Default auditor user created (auditor/audit123)');
        }
    } catch (err) {
        console.error('Error initializing default admin:', err);
    }
}

// --- Catch-all for SPA ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`BMU Store Server running on port ${PORT}`);
    await initializeDefaultAdmin();
});

module.exports = app;
