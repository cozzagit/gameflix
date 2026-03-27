#!/bin/bash
set -e

APP_DIR="/opt/gameflix"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== Gameflix Deploy ==="
echo "$(date)"

cd "$APP_DIR"

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Build and restart
echo "Building containers..."
docker compose -f $COMPOSE_FILE build --no-cache

echo "Starting services..."
docker compose -f $COMPOSE_FILE up -d

# Wait for backend health
echo "Waiting for backend..."
for i in $(seq 1 30); do
    if docker compose -f $COMPOSE_FILE exec -T backend wget -q --spider http://localhost:4000/api/categories 2>/dev/null; then
        echo "Backend healthy!"
        break
    fi
    echo "  attempt $i/30..."
    sleep 2
done

# Run migrations
echo "Running migrations..."
docker compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy

# Seed if first deploy
echo "Seeding database (if empty)..."
docker compose -f $COMPOSE_FILE exec -T backend npx prisma db seed || true

echo "=== Deploy Complete ==="
echo "https://gameflix.vibecanyon.com"
