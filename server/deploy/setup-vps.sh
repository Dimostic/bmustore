#!/bin/bash
# BMU Store VPS Deployment Script
# Run this script on the VPS as root

set -e

echo "=========================================="
echo "BMU Store VPS Deployment Script"
echo "=========================================="

# Variables
APP_DIR="/var/www/bmustore"
DOMAIN="bmustore.mehetti.com"
DB_NAME="bmustore_db"
DB_USER="bmustore_user"
DB_PASS="BMUStore@2026Secure!"
NODE_PORT=3001

# Update system
echo "[1/10] Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "[2/10] Installing required packages..."
apt install -y curl wget git nginx mysql-server certbot python3-certbot-nginx ufw

# Install Node.js 20.x
echo "[3/10] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installations
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Configure MySQL
echo "[4/10] Configuring MySQL..."
systemctl start mysql
systemctl enable mysql

# Create database and user
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Run schema
echo "[5/10] Creating database tables..."
mysql ${DB_NAME} < ${APP_DIR}/server/database/schema.sql || echo "Schema might already exist"

# Create app directory
echo "[6/10] Setting up application directory..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/server/public

# Install PM2 globally
echo "[7/10] Installing PM2..."
npm install -g pm2

# Setup Nginx
echo "[8/10] Configuring Nginx..."
cat > /etc/nginx/sites-available/bmustore << 'NGINX'
server {
    listen 80;
    server_name bmustore.mehetti.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bmustore.mehetti.com;
    
    # SSL will be configured by certbot
    
    root /var/www/bmustore/server/public;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # API proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/bmustore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Configure firewall
echo "[9/10] Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "[10/10] Getting SSL certificate..."
# Get SSL certificate (interactive - will prompt for email)
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@mehetti.com --redirect

echo "=========================================="
echo "Base setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Transfer application files to ${APP_DIR}"
echo "2. Run: cd ${APP_DIR}/server && npm install"
echo "3. Create .env file from .env.example"
echo "4. Start app: pm2 start server.js --name bmustore"
echo "5. Save PM2 config: pm2 save && pm2 startup"
echo ""
echo "Default login credentials:"
echo "  admin / password123"
echo "  storekeeper / store123"
echo "  auditor / audit123"
echo "=========================================="
