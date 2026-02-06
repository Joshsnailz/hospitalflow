#!/bin/sh
set -e

SERVICE="$1"

if [ -z "$SERVICE" ]; then
  echo "Usage: docker-entrypoint.sh <service-name>"
  exit 1
fi

MARKER="/tmp/.seeded-${SERVICE}"

# Run seed scripts for services that have them (only once per container volume)
case "$SERVICE" in
  auth-service)
    if [ ! -f "$MARKER" ]; then
      echo "[entrypoint] Running auth-service seed..."
      node apps/auth-service/dist/database/seeds/run-seed.js && touch "$MARKER" || echo "[entrypoint] Seed failed (may already exist), continuing..."
    fi
    ;;
  rbac-service)
    if [ ! -f "$MARKER" ]; then
      echo "[entrypoint] Running rbac-service seed..."
      node apps/rbac-service/dist/database/seeds/run-seed.js && touch "$MARKER" || echo "[entrypoint] Seed failed (may already exist), continuing..."
    fi
    ;;
  hospital-service)
    if [ ! -f "$MARKER" ]; then
      echo "[entrypoint] Running hospital-service seed..."
      node apps/hospital-service/dist/database/seeds/run-seed.js && touch "$MARKER" || echo "[entrypoint] Seed failed (may already exist), continuing..."
    fi
    ;;
esac

echo "[entrypoint] Starting $SERVICE..."
exec node "apps/${SERVICE}/dist/main.js"
