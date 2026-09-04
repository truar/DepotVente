#!/usr/bin/env bash
#
# Shared helpers for the operator scripts (start / stop / status).
# Not meant to be run directly.

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; BLD=$'\033[1m'; RST=$'\033[0m'

say()  { printf '\n%s%s%s\n' "$BLD" "$*" "$RST"; }
ok()   { printf '  %s✓%s %s\n' "$GRN" "$RST" "$*"; }
bad()  { printf '  %s✗%s %s\n' "$RED" "$RST" "$*"; }
warn() { printf '  %s!%s %s\n' "$YEL" "$RST" "$*"; }
info() { printf '    %s\n' "$*"; }

SERVICES="cmr_postgres cmr_backend cmr_frontend cmr_caddy"
HOSTNAME_LAN="bourseauski.local"

# Docker Desktop is a GUI app; on a fresh boot it is usually not running.
require_docker() {
  if docker info >/dev/null 2>&1; then ok "Docker is running"; return 0; fi
  warn "Docker Desktop is not running - starting it (this takes up to a minute)"
  open -a Docker >/dev/null 2>&1 || {
    bad "Could not start Docker Desktop."
    info "Open it from the Applications folder, wait for the whale icon in the"
    info "menu bar to stop animating, then run this script again."
    return 1
  }
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && { ok "Docker started"; return 0; }
    sleep 2
  done
  bad "Docker Desktop did not start within two minutes."
  info "Open it manually, wait for the whale icon to settle, then try again."
  return 1
}

container_health() {
  local out
  out="$(docker inspect "$1" \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    2>/dev/null | tr -d '\r\n')"
  [ -n "$out" ] && printf '%s' "$out" || printf 'missing'
}

wait_healthy() {
  local timeout=${1:-150} waited=0 all pending
  while [ "$waited" -lt "$timeout" ]; do
    all=yes; pending=""
    for c in $SERVICES; do
      case "$(container_health "$c")" in
        healthy|running) ;;
        *) all=no; pending="$pending $c" ;;
      esac
    done
    [ "$all" = yes ] && return 0
    sleep 3; waited=$((waited+3))
  done
  bad "The services did not become ready in time. Still waiting on:$pending"
  info "Run ./scripts/status.sh for detail, or 'docker compose logs' to see why."
  return 1
}

lan_ip() {
  local ip
  for iface in en0 en1 en2 en3; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  done
  return 1
}
