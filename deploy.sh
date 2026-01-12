#!/bin/bash
# BMU Store - Complete Deployment Script
# Run this from your Mac to deploy to VPS

set -e

# Configuration
VPS_IP="168.231.115.240"
VPS_USER="root"
APP_DIR="/var/www/bmustore"
LOCAL_DIR="/Users/BYSG/Documents/BMU/Store/BMU storeapp4"
DOMAIN="bmustore.mehetti.com"
DB_NAME="bmustore_db"
DB_USER="bmustore_user"
DB_PASS="BMUStore@2026Secure!"

echo "=========================================="
echo "BMU Store Deployment to VPS"
echo "=========================================="
echo "VPS: ${VPS_USER}@${VPS_IP}"
echo "Domain: ${DOMAIN}"
echo "=========================================="

# Step 1: Prepare public directory with frontend files
echo ""
echo "[1/7] Preparing frontend files..."
mkdir -p "${LOCAL_DIR}/server/public"
cp "${LOCAL_DIR}/index.html" "${LOCAL_DIR}/server/public/"
cp "${LOCAL_DIR}/style.css" "${LOCAL_DIR}/server/public/"
cp "${LOCAL_DIR}/app.js" "${LOCAL_DIR}/server/public/"
cp "${LOCAL_DIR}/manifest.json" "${LOCAL_DIR}/server/public/"
cp "${LOCAL_DIR}/sw.js" "${LOCAL_DIR}/server/public/"
cp "${LOCAL_DIR}/bmulogo.png" "${LOCAL_DIR}/server/public/" 2>/dev/null || true
cp "${LOCAL_DIR}/favicon.ico" "${LOCAL_DIR}/server/public/" 2>/dev/null || true
cp -r "${LOCAL_DIR}/icons" "${LOCAL_DIR}/server/public/" 2>/dev/null || true

# Modify index.html to use api.js instead of idb.js
echo "[1.5/7] Updating index.html to use API..."
sed -i '' 's|<script src="idb.js"></script>|<script src="api.js"></script>|g' "${LOCAL_DIR}/server/public/index.html"

echo "Frontend files prepared!"

# Step 2: Setup VPS base system
echo ""
echo "[2/7] Setting up VPS base system..."
sshpass -p "" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'REMOTE_SETUP'
set -e

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y curl wget git nginx mysql-server certbot python3-certbot-nginx ufw

# Install Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install PM2 globally
npm install -g pm2

# Configure firewall
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable || true

echo "Base system setup complete!"
REMOTE_SETUP

# Step 3: Configure MySQL
echo ""
echo "[3/7] Configuring MySQL database..."
sshpass -p "" ssh ${VPS_USER}@${VPS_IP} << REMOTE_MYSQL
set -e

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "MySQL configured!"
REMOTE_MYSQL

# Step 4: Create app directory and transfer files
echo ""
echo "[4/7] Transferring application files..."
sshpass -p "" ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${APP_DIR}"

# Transfer server directory
sshpass -p "" scp -r "${LOCAL_DIR}/server" ${VPS_USER}@${VPS_IP}:${APP_DIR}/

echo "Files transferred!"

# Step 5: Setup database schema and install dependencies
echo ""
echo "[5/7] Setting up database and installing dependencies..."
sshpass -p "" ssh ${VPS_USER}@${VPS_IP} << REMOTE_APP
set -e

cd ${APP_DIR}/server

# Run database schema
mysql ${DB_NAME} < database/schema.sql

# Create .env file
cat > .env << ENV
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
DB_PORT=3306
PORT=3000
NODE_ENV=production
SESSION_SECRET=bmu-store-$(openssl rand -hex 32)
API_URL=https://${DOMAIN}/api
ENV

# Install Node.js dependencies
npm install --production

echo "App setup complete!"
REMOTE_APP

# Step 6: Configure Nginx
echo ""
echo "[6/7] Configuring Nginx..."
sshpass -p "" ssh ${VPS_USER}@${VPS_IP} << 'REMOTE_NGINX'
set -e

cat > /etc/nginx/sites-available/bmustore << 'NGINX'
server {
    listen 80;
    server_name bmustore.mehetti.com;
    
    root /var/www/bmustore/server/public;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
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
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/bmustore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Nginx configured!"
REMOTE_NGINX

# Step 7: Start application and get SSL
echo ""
echo "[7/7] Starting application and configuring SSL..."
sshpass -p "" ssh ${VPS_USER}@${VPS_IP} << REMOTE_START
set -e

cd ${APP_DIR}/server

# Stop any existing instance
pm2 delete bmustore 2>/dev/null || true

# Start the application
pm2 start server.js --name bmustore

# Save PM2 config and setup startup
pm2 save
pm2 startup systemd -u root --hp /root

# Get SSL certificate
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@mehetti.com --redirect || echo "SSL setup may need manual intervention"

# Restart nginx after SSL
systemctl restart nginx

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Your BMU Store app is now live at:"
echo "  https://${DOMAIN}"
echo ""
echo "Default login credentials:"
echo "  admin / password123"
echo "  storekeeper / store123"
echo "  auditor / audit123"
echo ""
echo "PM2 Commands:"
echo "  pm2 logs bmustore    - View logs"
echo "  pm2 restart bmustore - Restart app"
echo "  pm2 status           - Check status"
echo "=========================================="
REMOTE_START

echo ""
echo "Deployment script completed!"
echo "Visit https://${DOMAIN} to access your app."
