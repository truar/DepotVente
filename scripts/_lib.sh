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

# --- backup USB key ---------------------------------------------------------
#
# The key is identified by a marker file, not by its path. macOS remounts a
# volume as "CLE 1" after an unclean eject - exactly when things have already
# gone wrong - so a hard-coded /Volumes/CLE silently stops working. Worse, if
# anyone has ever created that directory on the internal disk, the "mirror"
# writes to the same disk as the original, which is not a backup at all.
#
# Bless a key once with:  ./scripts/backup-loop.sh --claim-usb /Volumes/WHATEVER

# Dumps go in a named folder rather than the key's root: the key may well be
# used for other things, and after a sale this folder holds a few hundred files.
# Everything in it is visible on purpose - someone reaching for this is having a
# bad day and should not have to unhide anything to find it.
#
#   cmr-backup/marker                     marks the key, and says what it is
#   cmr-backup/lists/auto-cmr_db-*.sql.gz the dumps
BACKUP_KEY_DIR="cmr-backup"
BACKUP_MARKER="$BACKUP_KEY_DIR/marker"
BACKUP_DUMP_DIR="$BACKUP_KEY_DIR/lists"
# Overridable only so the tests can point it somewhere writable.
BACKUP_VOLUMES_ROOT="${BACKUP_VOLUMES_ROOT:-/Volumes}"

# True when $1 sits on the same filesystem as /, i.e. it is not removable media.
on_boot_volume() {
  [ "$(stat -f %d "$1" 2>/dev/null)" = "$(stat -f %d / 2>/dev/null)" ]
}

# Print the path of the claimed backup volume, or nothing if none is mounted.
# Callers re-run this every cycle: re-discovering is what makes replugging the
# key resume mirroring on its own, with no restart and no operator action.
find_backup_volume() {
  local marker vol
  for marker in "$BACKUP_VOLUMES_ROOT"/*/"$BACKUP_MARKER"; do
    [ -f "$marker" ] || continue
    vol="${marker%/$BACKUP_MARKER}"
    on_boot_volume "$vol" && continue
    [ -w "$vol" ] || continue
    printf '%s' "$vol"
    return 0
  done
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
