#!/bin/bash
set -e

echo "=== Pharmacy One Stop — Setup ==="
echo ""

# Check for PostgreSQL
if command -v psql &>/dev/null; then
  echo "[OK] PostgreSQL CLI found"
elif command -v docker &>/dev/null; then
  echo "[INFO] No local PostgreSQL — starting via Docker..."
  docker run -d --name p1s-postgres -p 5432:5432 \
    -e POSTGRES_DB=pharmacy_one_stop \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    postgres:16-alpine
  echo "[OK] PostgreSQL started in Docker on port 5432"
  echo "Waiting for PostgreSQL to be ready..."
  sleep 5
else
  echo "[ERROR] Neither PostgreSQL nor Docker found."
  echo "Install one of:"
  echo "  brew install postgresql@16 && brew services start postgresql@16"
  echo "  OR"
  echo "  brew install --cask docker"
  exit 1
fi

# Create database (ignore error if exists)
echo ""
echo "Creating database..."
createdb pharmacy_one_stop 2>/dev/null || echo "[INFO] Database already exists"

# Install dependencies
echo ""
echo "Installing dependencies..."
cd "$(dirname "$0")/.."
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Run migrations
echo ""
echo "Running database migrations..."
cd server
npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma db push
npx prisma generate

# Seed data
echo ""
echo "Seeding sample data..."
npx prisma db seed

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start development:"
echo "  cd $(pwd)/.. && npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "Demo accounts:"
echo "  Super Admin:  admin@pharmacyonestop.co.uk / SuperAdmin1!"
echo "  Owner:        amir@highstreetpharmacy.co.uk / Owner123!"
echo "  Prescriber:   sarah.chen@highstreetpharmacy.co.uk / Pharma123!"
echo "  Patient:      james.davies@email.com / Patient123!"
