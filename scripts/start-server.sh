#!/usr/bin/env bash
#
# Start the server for the sale. One command, no Docker knowledge needed.
#
#   ./scripts/start-server.sh
#   ./scripts/start-server.sh --rebuild    # only after a code change
#
# Without --rebuild nothing is built or downloaded: the server starts from the
# images already on this Mac, so it works on a venue network with no internet.
# Building needs internet (base images from Docker Hub, npm packages), so
# --rebuild has to be run before leaving, never on site.
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
  info "Rebuilding from source - this needs internet and can take a few minutes"
  docker compose up -d --build >/dev/null 2>&1 || {
    bad "The services failed to build."
    info "Building needs an internet connection - check this Mac has one."
    info "Run 'docker compose up --build' to see the full error."
    exit 1
  }
else
  # Left to itself, compose builds or downloads any image it cannot find, and
  # with no internet that fails with an error nobody on site can read. Say
  # plainly what is missing instead.
  MISSING=""
  for img in $(docker compose config --images 2>/dev/null); do
    docker image inspect "$img" >/dev/null 2>&1 || MISSING="$MISSING $img"
  done
  if [ -n "$MISSING" ]; then
    bad "Some images are missing on this Mac:$MISSING"
    info "They have to be built once, with an internet connection:"
    info "    ./scripts/start-server.sh --rebuild"
    exit 1
  fi
  docker compose up -d --no-build --pull never >/dev/null 2>&1 || {
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
