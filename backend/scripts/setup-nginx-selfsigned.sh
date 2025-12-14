#!/bin/bash

# CloudDesk Backend - Nginx + Self-Signed SSL Setup Script
# Use this if you don't have a domain name yet
# Run this on your EC2 instance as root or with sudo

set -e

echo "========================================="
echo "CloudDesk Nginx + Self-Signed SSL Setup"
echo "========================================="
echo ""
echo "WARNING: Self-signed certificates will show"
echo "browser warnings. Use Let's Encrypt for production."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "Please run as root or with sudo"
   exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"
echo ""

read -p "Continue with self-signed certificate? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled"
    exit 0
fi

# Update system
echo ""
echo "Updating system packages..."
apt-get update

# Install Nginx
echo ""
echo "Installing Nginx..."
apt-get install -y nginx openssl

# Create directory for SSL certificates
mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
echo ""
echo "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/clouddesk.key \
    -out /etc/nginx/ssl/clouddesk.crt \
    -subj "/C=US/ST=State/L=City/O=CloudDesk/CN=$SERVER_IP"

# Set proper permissions
chmod 600 /etc/nginx/ssl/clouddesk.key
chmod 644 /etc/nginx/ssl/clouddesk.crt

# Create Nginx configuration
echo ""
echo "Creating Nginx configuration..."

cat > /etc/nginx/sites-available/clouddesk <<EOF
# CloudDesk API - Nginx Configuration (Self-Signed SSL)

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    # Self-signed SSL certificates
    ssl_certificate /etc/nginx/ssl/clouddesk.crt;
    ssl_certificate_key /etc/nginx/ssl/clouddesk.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/clouddesk_access.log;
    error_log /var/log/nginx/clouddesk_error.log;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;

        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/clouddesk /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo ""
echo "Testing Nginx configuration..."
nginx -t

# Start Nginx
echo ""
echo "Starting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Open firewall ports (if UFW is enabled)
if command -v ufw &> /dev/null; then
    echo ""
    echo "Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw delete allow 'Nginx HTTP' 2>/dev/null || true
fi

# Display status
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Nginx is now running with self-signed SSL"
echo "Your API is accessible at: https://$SERVER_IP"
echo ""
echo "SSL Certificate: /etc/nginx/ssl/clouddesk.crt"
echo "SSL Key: /etc/nginx/ssl/clouddesk.key"
echo ""
echo "IMPORTANT:"
echo "- Browsers will show a security warning (accept and proceed)"
echo "- For production, use a proper domain and Let's Encrypt"
echo ""
echo "Next steps:"
echo "1. Ensure your backend is running on localhost:3000"
echo "2. Update frontend NEXT_PUBLIC_API_URL to https://$SERVER_IP"
echo "3. Test the API: curl -k https://$SERVER_IP/api/health"
echo "4. In AWS Security Group, ensure port 443 is open"
echo ""
echo "Useful commands:"
echo "  - Check Nginx status: systemctl status nginx"
echo "  - View logs: tail -f /var/log/nginx/clouddesk_error.log"
echo "  - Restart Nginx: systemctl restart nginx"
echo ""
