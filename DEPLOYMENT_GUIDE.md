# BMU Store Management System - Deployment & Access Guide

## Live Application
- **URL**: https://bmustore.mehetti.com
- **Status**: ✅ Deployed and running

---

## User Credentials

### Default Login Accounts

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Super Admin** | `superadmin` | `SuperAdmin@2026!` | Full access, can delete admin users |
| **Admin** | `admin` | `Admin@2026!` | Full access, cannot delete other admins |
| **Store Keeper** | `storekeeper` | `Store@2026!` | Create/edit GRN, SRV, SRF, Items |
| **Auditor** | `auditor` | `Audit@2026!` | View-only, can export reports |
| **Viewer** | `viewer` | `View@2026!` | View-only access |

> **Note**: Legacy users may still have old passwords (admin/password123, storekeeper/store123, auditor/audit123)

---

## Database Access via Adminer

### Access URL
- **URL**: https://db.bmustore.mehetti.com
- **Status**: ✅ Live with SSL

### Database Credentials
| Field | Value |
|-------|-------|
| **System** | MySQL |
| **Server** | `localhost` |
| **Username** | `bmustore_user` |
| **Password** | `BMUStore@2026Secure!` |
| **Database** | `bmustore_db` |

---

## Role Permissions Matrix

| Feature | Super Admin | Admin | Store Keeper | Auditor | Viewer |
|---------|:-----------:|:-----:|:------------:|:-------:|:------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Items | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Items | ✅ | ✅ | ❌ | ❌ | ❌ |
| View GRN/SRV/SRF | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create GRN/SRV/SRF | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit GRN/SRV/SRF | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete GRN/SRV/SRF | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Activity Log | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Admin Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Admin Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Change Own Password | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Offline Support

The application supports offline mode with data synchronization:

1. **Service Worker**: Caches static assets for offline access
2. **IndexedDB Fallback**: Stores data locally when offline
3. **Sync Queue**: Queues changes made offline for later sync
4. **Auto-Sync**: Automatically syncs when connection is restored

### Offline Indicators
- **Orange banner**: Appears at top when offline
- **Sync badge**: Shows count of pending changes (bottom-right)
- Click the sync badge to manually trigger sync when online

---

## VPS Server Details

| Property | Value |
|----------|-------|
| **IP Address** | 168.231.115.240 |
| **Domain** | bmustore.mehetti.com |
| **SSL** | Let's Encrypt (auto-renewal) |
| **Node.js Port** | 3001 |
| **Process Manager** | PM2 |

### SSH Access
```bash
ssh root@168.231.115.240
```

### Application Location
```
/var/www/bmustore/
├── server/
│   ├── server.js
│   ├── package.json
│   ├── database/
│   │   └── schema.sql
│   └── public/
│       ├── index.html
│       ├── app.js
│       ├── api.js
│       ├── style.css
│       ├── service-worker.js
│       └── offline-sync.js
```

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs bmustore

# Restart application
pm2 restart bmustore

# Stop application
pm2 stop bmustore
```

### Nginx Commands
```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# View status
systemctl status nginx
```

---

## Database Schema

### Tables
- `users` - User accounts with roles
- `roles` - Role definitions with permissions
- `sessions` - Active user sessions
- `items` - Inventory items
- `grn` - Goods Received Notes
- `srv` - Store Receipt Vouchers
- `srf` - Store Requisition Forms
- `activity_log` - Audit trail

---

## Dummy Test Data

The system is pre-loaded with dummy data for testing:

### Items (16 records)
- Medical supplies (MED-001 to MED-007)
- Stationery (STA-001 to STA-004)
- Equipment (EQP-001 to EQP-003)
- Cleaning supplies (CLN-001, CLN-002)

### GRN Records (3 records)
- GRN-2026-001, GRN-2026-002, GRN-2026-003

### SRV Records (2 records)
- SRV-2026-001, SRV-2026-002

### SRF Records (3 records)
- SRF-2026-001, SRF-2026-002, SRF-2026-003

---

## Troubleshooting

### Login Issues
1. Clear browser cookies and cache
2. Ensure correct username/password
3. Check if user account is active (not disabled)

### Offline Mode Not Working
1. Ensure service worker is registered (check DevTools > Application)
2. Clear service worker cache and reload
3. Check browser supports service workers

### Data Not Syncing
1. Check internet connection
2. Click sync badge to force sync
3. Check browser console for errors

### Server Issues
```bash
# Check PM2 logs
pm2 logs bmustore --lines 100

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check MySQL status
systemctl status mysql
```

---

## Support

For technical support or questions, contact the system administrator.

**Last Updated**: January 12, 2026
