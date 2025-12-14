#!/bin/bash

# CloudDesk Backend - Nginx + SSL Setup Script
# This script sets up Nginx as a reverse proxy with Let's Encrypt SSL
# Run this on your EC2 instance as root or with sudo

set -e

echo "========================================="
echo "CloudDesk Nginx + SSL Setup"
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "Please run as root or with sudo"
   exit 1
fi

# Prompt for domain name
read -p "Enter your domain name (e.g., api.clouddesk.com): " DOMAIN_NAME
read -p "Enter your email for Let's Encrypt notifications: " EMAIL

if [ -z "$DOMAIN_NAME" ] || [ -z "$EMAIL" ]; then
    echo "Domain name and email are required!"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  Email: $EMAIL"
echo ""
read -p "Continue? (y/n): " CONFIRM

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
apt-get install -y nginx

# Install Certbot for Let's Encrypt
echo ""
echo "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Stop Nginx temporarily for certificate generation
systemctl stop nginx

# Obtain SSL certificate
echo ""
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN_NAME"

# Create Nginx configuration
echo ""
echo "Creating Nginx configuration..."

cat > /etc/nginx/sites-available/clouddesk <<EOF
# CloudDesk API - Nginx Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_NAME;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
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
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo ""
echo "Setting up automatic certificate renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

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
echo "Nginx is now running with SSL enabled"
echo "Your API is accessible at: https://$DOMAIN_NAME"
echo ""
echo "SSL Certificate: /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
echo "SSL Key: /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
echo ""
echo "Certificate auto-renewal is enabled via certbot.timer"
echo ""
echo "Next steps:"
echo "1. Ensure your backend is running on localhost:3000"
echo "2. Update your DNS to point $DOMAIN_NAME to this server's IP"
echo "3. Update frontend NEXT_PUBLIC_API_URL to https://$DOMAIN_NAME"
echo "4. Test the API: curl https://$DOMAIN_NAME/api/health"
echo ""
echo "Useful commands:"
echo "  - Check Nginx status: systemctl status nginx"
echo "  - View logs: tail -f /var/log/nginx/clouddesk_error.log"
echo "  - Restart Nginx: systemctl restart nginx"
echo "  - Renew certificates manually: certbot renew"
echo "  - Test certificate renewal: certbot renew --dry-run"
echo ""
