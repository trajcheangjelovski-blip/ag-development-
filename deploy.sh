#!/usr/bin/env bash
# One-command deploy: pull latest code, rebuild, restart, clean up.
# Usage on the server:  ./deploy.sh
set -euo pipefail

echo "→ Pulling latest from GitHub…"
git pull

echo "→ Syncing client demos (demos/ → .demos-live/)…"
# git's demos/ folder is the source of truth; Caddy serves .demos-live/ and the
# admin panel deletes from it. Sync contents in place (the folder itself is a
# bind mount, so it must never be removed/recreated).
mkdir -p .demos-live
for d in .demos-live/*/; do
  [ -d "$d" ] || continue
  [ -d "demos/$(basename "$d")" ] || rm -rf "$d"
done
for d in demos/*/; do
  [ -d "$d" ] || continue
  n=$(basename "$d")
  rm -rf ".demos-live/$n"
  cp -a "$d" ".demos-live/$n"
done
chown -R 1001:1001 .demos-live   # app container runs as uid 1001 (nextjs)

echo "→ Building & starting containers…"
docker compose up -d --build

echo "→ Removing old/unused images…"
docker image prune -f

echo "✓ Deployed. App is live behind Caddy at https://ag-development.dev"
