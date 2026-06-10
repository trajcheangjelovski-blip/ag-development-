#!/bin/bash
# deploy.sh — run this on your Hetzner server to deploy/update the app
# Usage: bash deploy.sh

set -e

APP_DIR="/var/www/agdev"
cd $APP_DIR

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Building Docker image ==="
docker compose build --no-cache

echo "=== Stopping old container ==="
docker compose down || true

echo "=== Starting new container ==="
docker compose up -d

echo "=== Cleaning up old images ==="
docker image prune -f

echo ""
echo "=== Deploy complete! ==="
echo "App running at http://localhost:3000"
docker compose ps
