#!/bin/bash
# BMU Store Deployment Script
# Usage: ./deploy.sh [--full|--code|--restart|--logs|--status|--env]

set -e

# Configuration
VPS_HOST="root@154.113.83.116"
VPS_APP_DIR="/var/www/bmustore"
VPS_ENV_BACKUP="/root/.bmustore-env-backup"
LOCAL_SERVER_DIR="./server"
DOMAIN="bmustore.mehetti.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  BMU Store Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --full      Full deployment (backup .env, sync files, restore .env, npm install, restart)"
    echo "  --code      Code only (sync files preserving .env, restart) [DEFAULT]"
    echo "  --restart   Just restart the PM2 process"
    echo "  --logs      Show recent logs"
    echo "  --status    Show PM2 status"
    echo "  --env       Update .env file on server from local .env.production"
    echo "  --help      Show this help message"
    echo ""
}

# Function to backup .env on VPS
backup_env() {
    echo -e "${YELLOW}→ Backing up .env file on VPS...${NC}"
    ssh $VPS_HOST "if [ -f $VPS_APP_DIR/.env ]; then cp $VPS_APP_DIR/.env $VPS_ENV_BACKUP; echo 'Backup created at $VPS_ENV_BACKUP'; else echo 'No .env to backup'; fi"
}

# Function to restore .env on VPS
restore_env() {
    echo -e "${YELLOW}→ Restoring .env file on VPS...${NC}"
    ssh $VPS_HOST "if [ -f $VPS_ENV_BACKUP ]; then cp $VPS_ENV_BACKUP $VPS_APP_DIR/.env; echo 'Restored from backup'; else echo 'No backup found'; fi"
}

# Function to ensure .env exists with default values
ensure_env() {
    echo -e "${YELLOW}→ Ensuring .env file exists on VPS...${NC}"
    ssh $VPS_HOST "if [ ! -f $VPS_APP_DIR/.env ]; then
        echo 'Creating default .env file...'
        cat > $VPS_APP_DIR/.env << 'ENVEOF'
# Database Configuration
DB_HOST=localhost
DB_USER=bmustore_user
DB_PASSWORD=BMUStore@2026Secure!
DB_NAME=bmustore_db
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=production

# Session Secret
SESSION_SECRET=bmu-store-session-secret-2026-secure

# API Base URL
API_URL=https://bmustore.mehetti.com/api
ENVEOF
        echo '.env file created with defaults'
    else
        echo '.env file exists'
    fi"
}

# Function to sync code files (excluding .env and node_modules)
sync_code() {
    echo -e "${YELLOW}→ Syncing code to VPS (preserving .env)...${NC}"
    
    # Sync server directory excluding .env and node_modules
    rsync -avz --progress \
        --exclude '.env' \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude 'package-lock.json' \
        $LOCAL_SERVER_DIR/ $VPS_HOST:$VPS_APP_DIR/
    
    echo -e "${GREEN}✓ Code synced successfully${NC}"
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}→ Installing npm dependencies on VPS...${NC}"
    ssh $VPS_HOST "cd $VPS_APP_DIR && npm install --production"
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to restart PM2
restart_pm2() {
    echo -e "${YELLOW}→ Restarting PM2 process...${NC}"
    ssh $VPS_HOST "cd $VPS_APP_DIR && pm2 delete bmustore 2>/dev/null || true && pm2 start server.js --name bmustore && pm2 save"
    echo -e "${GREEN}✓ PM2 process restarted${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}→ Recent PM2 logs:${NC}"
    ssh $VPS_HOST "pm2 logs bmustore --lines 40 --nostream"
}

# Function to show status
show_status() {
    echo -e "${YELLOW}→ PM2 Status:${NC}"
    ssh $VPS_HOST "pm2 status"
}

# Function to update .env from local file
update_env() {
    echo -e "${YELLOW}→ Updating .env file on VPS...${NC}"
    
    if [ -f "$LOCAL_SERVER_DIR/.env.production" ]; then
        scp $LOCAL_SERVER_DIR/.env.production $VPS_HOST:$VPS_APP_DIR/.env
        echo -e "${GREEN}✓ .env updated from .env.production${NC}"
    elif [ -f ".env.production" ]; then
        scp .env.production $VPS_HOST:$VPS_APP_DIR/.env
        echo -e "${GREEN}✓ .env updated from .env.production${NC}"
    else
        echo -e "${RED}✗ No .env.production file found${NC}"
        echo "Create server/.env.production or .env.production with your production settings"
        exit 1
    fi
}

# Function to test server health
test_health() {
    echo -e "${YELLOW}→ Testing server health...${NC}"
    sleep 2
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Server is healthy (HTTP 200)${NC}"
    else
        echo -e "${RED}✗ Server returned HTTP $RESPONSE${NC}"
        echo "Check logs with: $0 --logs"
    fi
}

# Function for full deployment
deploy_full() {
    echo -e "${GREEN}Starting FULL deployment...${NC}"
    echo ""
    backup_env
    sync_code
    restore_env
    ensure_env
    install_deps
    restart_pm2
    test_health
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Full Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    show_status
}

# Function for code-only deployment
deploy_code() {
    echo -e "${GREEN}Starting CODE-ONLY deployment...${NC}"
    echo ""
    backup_env
    sync_code
    restore_env
    ensure_env
    restart_pm2
    test_health
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Code Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    show_status
}

# Main script logic
case "${1:-}" in
    --full)
        deploy_full
        ;;
    --code|"")
        deploy_code
        ;;
    --restart)
        restart_pm2
        test_health
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --status)
        show_status
        ;;
    --env)
        update_env
        restart_pm2
        test_health
        ;;
    --help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  App URL:    https://${DOMAIN}${NC}"
echo -e "${BLUE}  DB Admin:   https://db.${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
