#!/bin/bash
# filepath: /Users/BYSG/Documents/BMU/Store/BMU storeapp4/server/deploy/setup-adminer.sh
# Setup Adminer for database access at db.bmustore.mehetti.com

set -e

echo "=========================================="
echo "  Setting up Adminer Database Manager"
echo "=========================================="

# Install PHP if not installed
if ! command -v php &> /dev/null; then
    echo "Installing PHP..."
    apt-get update
    apt-get install -y php php-mysql php-fpm
fi

# Create Adminer directory
ADMINER_DIR="/var/www/adminer"
mkdir -p $ADMINER_DIR

# Download Adminer
echo "Downloading Adminer..."
wget -O $ADMINER_DIR/index.php https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1-mysql.php

# Create custom CSS for Adminer (matching BMU theme)
cat > $ADMINER_DIR/adminer.css << 'EOF'
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    min-height: 100vh;
}

#content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    margin: 20px;
    padding: 20px;
}

h1 {
    color: #1e3c72;
    border-bottom: 3px solid #8dc63f;
    padding-bottom: 10px;
}

a {
    color: #1e3c72;
}

a:hover {
    color: #8dc63f;
}

input[type="submit"], 
input[type="button"],
.button {
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

input[type="submit"]:hover,
input[type="button"]:hover,
.button:hover {
    background: linear-gradient(135deg, #8dc63f, #6ba32b);
    transform: translateY(-2px);
}

input[type="text"],
input[type="password"],
select,
textarea {
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    padding: 8px 12px;
    transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="password"]:focus,
select:focus,
textarea:focus {
    border-color: #1e3c72;
    outline: none;
}

table {
    border-collapse: collapse;
    width: 100%;
}

table th {
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: white;
    padding: 12px;
    text-align: left;
}

table td {
    padding: 10px 12px;
    border-bottom: 1px solid #e0e0e0;
}

table tr:hover td {
    background: #f5f5f5;
}

.error {
    background: #fff0f0;
    border-left: 4px solid #800020;
    padding: 15px;
    margin: 10px 0;
}

.message {
    background: #f0fff0;
    border-left: 4px solid #8dc63f;
    padding: 15px;
    margin: 10px 0;
}

#menu {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
}

#menu h1 {
    font-size: 1.2em;
    margin: 0 0 15px 0;
}

#menu a {
    display: block;
    padding: 8px 10px;
    margin: 2px 0;
    border-radius: 4px;
    transition: background 0.2s ease;
}

#menu a:hover {
    background: #e0e0e0;
    text-decoration: none;
}

/* Login form */
form[action=""] {
    max-width: 400px;
    margin: 50px auto;
    padding: 30px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

form[action=""] h1 {
    text-align: center;
    margin-bottom: 30px;
}

form[action=""]::before {
    content: "BMU Store Database";
    display: block;
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    color: #1e3c72;
    margin-bottom: 10px;
}
EOF

# Create Nginx config for Adminer
cat > /etc/nginx/sites-available/adminer << 'EOF'
server {
    listen 80;
    server_name db.bmustore.mehetti.com;

    root /var/www/adminer;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/adminer /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Get SSL certificate for Adminer subdomain
echo "Getting SSL certificate for db.bmustore.mehetti.com..."
certbot --nginx -d db.bmustore.mehetti.com --non-interactive --agree-tos --email admin@bmustore.mehetti.com || true

echo ""
echo "=========================================="
echo "  Adminer Setup Complete!"
echo "=========================================="
echo ""
echo "  Access URL: https://db.bmustore.mehetti.com"
echo ""
echo "  Login Credentials:"
echo "  - Server: localhost"
echo "  - Username: bmustore_user"
echo "  - Password: BMUStore@2026Secure!"
echo "  - Database: bmustore_db"
echo ""
echo "=========================================="
