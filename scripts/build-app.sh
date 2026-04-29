#!/bin/bash
set -e
cd /home/ec2-user/POneStop

echo "=== Building Server ==="
cd server
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..

echo "=== Building Client ==="
cd client
npm install
npx next build
cd ..

echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== Starting Apps ==="
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'p1s-api',
      cwd: './server',
      script: 'node_modules/.bin/tsx',
      args: 'src/index.ts',
      env: { NODE_ENV: 'production', PORT: 4000 },
      autorestart: true,
    },
    {
      name: 'p1s-web',
      cwd: './client',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      autorestart: true,
    },
  ],
};
PMEOF

pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "=== DONE ==="
pm2 list
echo ""
echo "API: http://63.181.137.168:4000/api/health"
echo "Web: http://63.181.137.168:3000"
