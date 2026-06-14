#!/usr/bin/env bash
# One-command deploy: pull latest code, rebuild, restart, clean up.
# Usage on the server:  ./deploy.sh
set -euo pipefail

echo "→ Pulling latest from GitHub…"
git pull

echo "→ Building & starting containers…"
docker compose up -d --build

echo "→ Removing old/unused images…"
docker image prune -f

echo "✓ Deployed. App is live behind Caddy at https://ag-development.dev"
