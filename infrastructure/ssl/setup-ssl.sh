#!/bin/bash
# Pharmacy One Stop — SSL Certificate Setup (Let's Encrypt via Certbot)
# Run once on initial deployment, then certbot auto-renews via cron

set -euo pipefail

DOMAIN="pharmacyonestop.co.uk"
EMAIL="ssl@pharmacyonestop.co.uk"
WEBROOT="/var/www/certbot"

echo "=== Pharmacy One Stop SSL Setup ==="

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    if command -v dnf &> /dev/null; then
        # Amazon Linux 2023
        sudo dnf install -y certbot python3-certbot-nginx
    elif command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
    fi
fi

# Create webroot directory
sudo mkdir -p "$WEBROOT"

# Obtain certificate (with wildcard for subdomains)
echo "Obtaining SSL certificate for $DOMAIN and *.$DOMAIN..."
sudo certbot certonly \
    --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "*.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

# Verify
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL certificate obtained successfully!"
    echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
else
    echo "ERROR: SSL certificate not found. Check certbot logs."
    exit 1
fi

# Setup auto-renewal cron
CRON_JOB="0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "$CRON_JOB") | crontab -
echo "Auto-renewal cron job configured (daily at 3am)"

# Reload nginx
sudo systemctl reload nginx
echo "Nginx reloaded with new certificates"
echo "=== SSL Setup Complete ==="
