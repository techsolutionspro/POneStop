#!/bin/bash
# Nginx reverse proxy setup for Pharmacy One Stop
# Run after deploy-ec2.sh

set -e

echo "Setting up Nginx..."

sudo dnf install -y nginx

# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_IP")

sudo tee /etc/nginx/conf.d/pharmacy-one-stop.conf > /dev/null << NGINXEOF
server {
    listen 80;
    server_name $PUBLIC_IP _;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }

    # Webhooks (raw body needed for Stripe)
    location /api/webhooks/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    location /uploads/ {
        alias /home/ec2-user/POneStop/server/uploads/;
        expires 30d;
    }

    client_max_body_size 10M;
}
NGINXEOF

# Remove default config
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null

# Test and start
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "Nginx configured!"
echo "Site available at: http://$PUBLIC_IP"
echo ""
echo "To add SSL later:"
echo "  sudo dnf install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d yourdomain.co.uk"
