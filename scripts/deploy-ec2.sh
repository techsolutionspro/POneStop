#!/bin/bash
# Pharmacy One Stop — EC2 Deployment Script (Amazon Linux 2023)
# Run this on your EC2 instance

set -e

echo "=============================================="
echo "Pharmacy One Stop — EC2 Setup"
echo "=============================================="

# 1. Install dependencies
echo ""
echo "[1/8] Installing system dependencies..."
sudo dnf update -y
sudo dnf install -y git nodejs npm postgresql16 postgresql16-server docker

# 2. Start Docker
echo ""
echo "[2/8] Starting Docker..."
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 3. Install Docker Compose
echo ""
echo "[3/8] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repo
echo ""
echo "[4/8] Cloning repository..."
cd ~
if [ -d "POneStop" ]; then
  cd POneStop && git pull origin main
else
  git clone https://github.com/techsolutionspro/POneStop.git
  cd POneStop
fi

# 5. Setup environment
echo ""
echo "[5/8] Creating production environment..."
if [ ! -f server/.env ]; then
  cat > server/.env << 'ENVEOF'
DATABASE_URL="postgresql://p1s_user:p1s_secure_password_2026@localhost:5432/pharmacy_one_stop?schema=public"
JWT_SECRET="CHANGE_ME_production_jwt_secret_$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="CHANGE_ME_production_refresh_secret_$(openssl rand -hex 32)"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=production
FRONTEND_URL="http://63.181.137.168"
ENVEOF
  echo "  Created server/.env — EDIT THIS with your real values!"
fi

if [ ! -f client/.env.local ]; then
  cat > client/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://63.181.137.168/api
ENVEOF
  echo "  Created client/.env.local — EDIT THIS with your real domain/IP!"
fi

# 6. Setup PostgreSQL
echo ""
echo "[6/8] Setting up PostgreSQL..."
sudo postgresql-setup --initdb 2>/dev/null || true
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER p1s_user WITH PASSWORD 'p1s_secure_password_2026';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE pharmacy_one_stop OWNER p1s_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pharmacy_one_stop TO p1s_user;" 2>/dev/null || true

# Allow password auth
sudo sed -i 's/ident$/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/peer$/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql

# 7. Install app dependencies and build
echo ""
echo "[7/8] Installing dependencies and building..."
cd ~/POneStop

# Server
cd server
npm install --production=false
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..

# Client
cd client
npm install
npx next build
cd ..

# 8. Install PM2 for process management
echo ""
echo "[8/8] Setting up PM2..."
sudo npm install -g pm2

# Create PM2 ecosystem
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'p1s-api',
      cwd: './server',
      script: 'node_modules/.bin/tsx',
      args: 'src/index.ts',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'p1s-web',
      cwd: './client',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
PM2EOF

# Start apps
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash

echo ""
echo "=============================================="
echo "DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Apps running:"
pm2 list
echo ""
echo "NEXT STEPS:"
echo "1. Edit server/.env with your real JWT secrets and domain"
echo "2. Edit client/.env.local with your real domain/IP"
echo "3. Setup Nginx: sudo dnf install nginx -y"
echo "4. Configure SSL with certbot"
echo "5. Restart: pm2 restart all"
echo ""
echo "URLs:"
echo "  API:      http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo YOUR_IP):4000/api/health"
echo "  Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo YOUR_IP):3000"
