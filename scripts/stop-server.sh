#!/usr/bin/env bash
#
# Stop the server at the end of the day, taking a final backup first.
#
#   ./scripts/stop-server.sh
#   ./scripts/stop-server.sh --no-backup
#
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

BACKUP=yes
[ "${1:-}" = "--no-backup" ] && BACKUP=no

printf '\n%s=== Stopping the sale server ===%s\n' "$BLD" "$RST"

if ! docker info >/dev/null 2>&1; then
  warn "Docker is not running - nothing to stop."
  exit 0
fi

if [ "$BACKUP" = yes ]; then
  say "1. Taking a final backup"
  if [ "$(container_health cmr_postgres)" = healthy ]; then
    mkdir -p backups
    FILE="backups/cmr_db-$(date +%Y%m%d-%H%M%S).sql"
    if docker exec cmr_postgres pg_dump -U cmr_user -d cmr_db > "$FILE" 2>/dev/null \
       && [ -s "$FILE" ]; then
      ok "Saved $FILE ($(du -h "$FILE" | cut -f1))"
    else
      rm -f "$FILE"
      bad "The backup failed. Not stopping the server."
      info "The data is safe while the server keeps running. Get help before stopping it."
      exit 1
    fi
  else
    bad "The database is not running, so no backup could be taken."
    info "If it crashed, the data on disk is still there and will come back on"
    info "the next start. Stopping now is safe, but do not delete anything."
  fi
fi

say "2. Stopping the services"
docker compose down >/dev/null 2>&1 || { bad "Could not stop cleanly. Try 'docker compose down'."; exit 1; }
ok "All services stopped"

# The database lives in a Docker volume, which 'down' does not touch.
printf '\n%s=== Stopped ===%s\n\n' "$GRN" "$RST"
echo "  The data is kept. Starting again restores everything:"
echo "      ./scripts/start-server.sh"
echo
warn "Copy the backups/ folder and the certs/ folder to a USB key."
info "backups/ contains sellers' names and phone numbers - keep it private."
echo
