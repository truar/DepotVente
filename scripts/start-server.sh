#!/usr/bin/env bash
#
# Start the server for the sale. One command, no Docker knowledge needed.
#
#   ./scripts/start-server.sh
#   ./scripts/start-server.sh --rebuild    # only after a code change
#
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

REBUILD=no
[ "${1:-}" = "--rebuild" ] && REBUILD=yes

printf '\n%s=== Starting the sale server ===%s\n' "$BLD" "$RST"

say "1. Checking Docker"
require_docker || exit 1

say "2. Starting the services"
if [ "$REBUILD" = yes ]; then
  info "Rebuilding from source - this can take a few minutes"
  docker compose up -d --build >/dev/null 2>&1 || {
    bad "The services failed to build."
    info "Run 'docker compose up --build' to see the full error."
    exit 1
  }
else
  docker compose up -d >/dev/null 2>&1 || {
    bad "The services failed to start."
    info "Run 'docker compose up' to see the full error."
    exit 1
  }
fi
ok "Services launched"

say "3. Waiting until everything is ready"
info "This normally takes 20-40 seconds"
wait_healthy 150 || exit 1
for c in $SERVICES; do ok "$c is ready"; done

say "4. Preparing the certificate for this network"
./scripts/prepare-server.sh || {
  bad "Certificate preparation failed - see the message above."
  info "The services are running, but client PCs may not be able to connect."
  exit 1
}

IP="$(lan_ip || echo '')"
printf '\n%s=== The server is running ===%s\n\n' "$GRN" "$RST"
echo "  Open on this Mac:      https://localhost"
[ -n "$IP" ] && echo "  Client PCs open:       https://$HOSTNAME_LAN"
echo
echo "  Check it is healthy:   ./scripts/status.sh"
echo "  Stop at end of day:    ./scripts/stop-server.sh"
echo
warn "Leave this Mac awake and plugged in. Close other applications."
echo
