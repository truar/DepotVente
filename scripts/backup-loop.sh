#!/usr/bin/env bash
#
# Continuous database backup for the day of the sale.
#
#   ./scripts/backup-loop.sh                        # dump every 60s into backups/
#   ./scripts/backup-loop.sh --interval 30
#   ./scripts/backup-loop.sh --mirror /Volumes/CLE  # also copy to the USB key
#   ./scripts/backup-loop.sh --once                 # single dump, then exit
#
# Leave it running in its own terminal window for the whole sale. Ctrl-C stops
# it. It is safe to start and stop at any time, and it survives the database
# container restarting under it.
#
# Cost, measured on this stack (12 MB database, 5388 articles): 0.3s per dump,
# ~450 KB compressed. pg_dump "does not block other users accessing the
# database (readers or writers)" - postgresql.org/docs/current/app-pgdump.html
# - so a dump during checkout does not slow the tills down.
#
set -uo pipefail          # deliberately not -e: one failed cycle must not kill
                          # the loop. The whole point is to keep trying.
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

DB_CONTAINER=cmr_postgres
DB_USER=cmr_user
DB_NAME=cmr_db
BACKUP_DIR=backups
PREFIX=auto-cmr_db-          # only files with this prefix are ever pruned, so
                             # hand-made dumps in backups/ are never deleted
INTERVAL=60
KEEP_MINUTES=120             # newer than this: keep every dump. Older: hourly.
MIRROR=""
ONCE=no
LOCK_WAIT=10s                # fail the cycle rather than queue behind a lock
MIN_FREE_MB=500

usage() {
  sed -n '2,14p' "$0" | sed 's/^#//;s/^ //'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --interval) INTERVAL="${2:?--interval needs a number of seconds}"; shift 2 ;;
    --keep-minutes) KEEP_MINUTES="${2:?--keep-minutes needs a number}"; shift 2 ;;
    --mirror) MIRROR="${2:?--mirror needs a directory}"; shift 2 ;;
    --once) ONCE=yes; shift ;;
    -h|--help) usage 0 ;;
    *) bad "Unknown option: $1"; usage 1 ;;
  esac
done

case "$INTERVAL" in ''|*[!0-9]*) bad "--interval must be a whole number of seconds"; exit 1 ;; esac
[ "$INTERVAL" -lt 5 ] && { bad "--interval below 5s is pointless - the dump itself takes ~0.3s"; exit 1; }

mkdir -p "$BACKUP_DIR"
ERRLOG="$(mktemp -t depotvente-backup)"
trap 'rm -f "$ERRLOG" "$BACKUP_DIR"/*.part 2>/dev/null' EXIT

DUMPS=0; SKIPPED=0; FAILURES=0; LAST_HASH=""; LAST_FILE=""; LAST_BYTES=0
MIRROR_WARNED=no
STARTED="$(date +%s)"

human() { awk -v b="$1" 'BEGIN{ if (b>1048576) printf "%.1f MB", b/1048576; else printf "%.0f KB", b/1024 }'; }
now_hms() { date +%H:%M:%S; }

free_mb() { df -m . 2>/dev/null | tail -1 | awk '{print $4}'; }

# One dump. Returns 0 on a verified new file, 2 when the database is unchanged
# since the last cycle, 1 on any failure.
dump_once() {
  local out tmp rc size prev_pct
  out="$BACKUP_DIR/${PREFIX}$(date +%Y%m%d-%H%M%S).sql.gz"
  tmp="$out.part"

  # gzip -n leaves the timestamp and name out of the header, so the stored file
  # depends only on the data - see the hash check below.
  docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
      --lock-wait-timeout="$LOCK_WAIT" 2>"$ERRLOG" | gzip -n -1 > "$tmp"
  rc="${PIPESTATUS[0]}"

  if [ "$rc" != 0 ]; then
    rm -f "$tmp"
    bad "$(now_hms)  pg_dump failed (exit $rc)"
    info "$(tail -2 "$ERRLOG" | tr '\n' ' ')"
    return 1
  fi

  # A dump that was cut off mid-write still looks like a plausible .gz file.
  # pg_dump only writes this trailer once it has finished, so it is the real
  # completeness check - not the file size.
  # (tail -20, not -3: recent pg_dump versions append a \unrestrict line and a
  # couple of blank lines after the marker.)
  if ! gzip -dc "$tmp" 2>/dev/null | tail -20 | grep -q 'PostgreSQL database dump complete'; then
    rm -f "$tmp"
    bad "$(now_hms)  the dump is incomplete - discarded, not written to $BACKUP_DIR"
    return 1
  fi

  # pg_dump opens with "\restrict <random token>" and closes with the matching
  # \unrestrict, so two dumps of identical data are never byte-identical. Hash
  # everything except those two lines, or nothing is ever detected as unchanged.
  HASH="$(gzip -dc "$tmp" | grep -vE '^\\(un)?restrict ' | shasum -a 256 | cut -d' ' -f1)"
  if [ -n "$LAST_HASH" ] && [ "$HASH" = "$LAST_HASH" ] && [ -f "$LAST_FILE" ]; then
    rm -f "$tmp"
    # Nothing changed, so there is nothing new to store - but the freshness of
    # the backup is still current, and status.sh judges that by mtime. Touching
    # it means "verified identical at this time"; the name keeps the real
    # creation time.
    touch "$LAST_FILE"
    return 2
  fi

  mv "$tmp" "$out"
  size="$(stat -f %z "$out")"

  # A dump that suddenly halves usually means something deleted rows. Worth
  # saying out loud during a sale; not worth refusing the backup over.
  if [ "$LAST_BYTES" -gt 0 ]; then
    prev_pct=$(( size * 100 / LAST_BYTES ))
    [ "$prev_pct" -lt 50 ] && warn "this dump is $prev_pct% of the previous one - did something delete data?"
  fi

  LAST_HASH="$HASH"; LAST_FILE="$out"; LAST_BYTES="$size"

  if [ -n "$MIRROR" ]; then
    if cp "$out" "$MIRROR/" 2>/dev/null; then
      MIRROR_WARNED=no
    elif [ "$MIRROR_WARNED" = no ]; then
      warn "cannot write to $MIRROR - is the USB key still plugged in?"
      info "Dumps are still being written to $BACKUP_DIR. Replug it and they resume."
      MIRROR_WARNED=yes
    fi
  fi
  return 0
}

# Keep every dump from the last KEEP_MINUTES, then one per hour. Filenames sort
# chronologically, so one pass with a "last hour kept" marker is enough - no
# associative arrays, which /bin/bash 3.2 on macOS does not have.
prune() {
  local cutoff f stamp hour kept_hour="" mt
  cutoff=$(( $(date +%s) - KEEP_MINUTES * 60 ))
  for f in "$BACKUP_DIR/$PREFIX"*.sql.gz; do
    [ -f "$f" ] || continue
    mt="$(stat -f %m "$f" 2>/dev/null)" || continue
    [ "$mt" -gt "$cutoff" ] && continue
    stamp="${f##*/$PREFIX}"; stamp="${stamp%.sql.gz}"
    hour="${stamp%????}"                     # YYYYmmdd-HHMMSS -> YYYYmmdd-HH
    if [ "$hour" = "$kept_hour" ]; then
      rm -f "$f"
    else
      kept_hour="$hour"
    fi
  done
}

summary() {
  local elapsed total
  elapsed=$(( $(date +%s) - STARTED ))
  total="$(du -sk "$BACKUP_DIR" 2>/dev/null | cut -f1)"
  printf '\n%s=== Backup loop stopped ===%s\n' "$BLD" "$RST"
  printf '  Ran for %dm, %d dumps written, %d unchanged, %d failed\n' \
    $(( elapsed / 60 )) "$DUMPS" "$SKIPPED" "$FAILURES"
  printf '  %s holds %s\n' "$BACKUP_DIR" "$(human $(( ${total:-0} * 1024 )))"
  [ -n "$LAST_FILE" ] && printf '  Most recent: %s\n' "$LAST_FILE"
  [ "$FAILURES" -gt 0 ] && printf '  %s%d cycle(s) failed - check above%s\n' "$YEL" "$FAILURES" "$RST"
  echo
  exit 0
}
trap summary INT TERM

# --- startup ----------------------------------------------------------------

if [ "$ONCE" = no ]; then
  printf '\n%s=== Continuous database backup ===%s\n' "$BLD" "$RST"
fi

if ! docker info >/dev/null 2>&1; then
  bad "Docker is not running - there is nothing to back up."
  info "Start the server first:  ./scripts/start-server.sh"
  exit 1
fi
if [ "$(container_health "$DB_CONTAINER")" = missing ]; then
  bad "$DB_CONTAINER is not running - there is nothing to back up."
  info "Start the server first:  ./scripts/start-server.sh"
  exit 1
fi

if [ -n "$MIRROR" ]; then
  if [ -d "$MIRROR" ] && [ -w "$MIRROR" ]; then
    ok "Mirroring each dump to $MIRROR"
  else
    bad "$MIRROR is not a writable directory."
    info "Plug the USB key in and check the path, or drop --mirror."
    exit 1
  fi
fi

if [ "$ONCE" = yes ]; then
  dump_once; rc=$?
  case $rc in
    0) ok "Wrote $LAST_FILE ($(human "$LAST_BYTES"))" ;;
    2) ok "Database unchanged since $LAST_FILE" ;;
    *) exit 1 ;;
  esac
  prune
  exit 0
fi

say "Settings"
ok "One dump every ${INTERVAL}s into $BACKUP_DIR/"
ok "Keeping every dump for ${KEEP_MINUTES} minutes, then one per hour"
info "Ctrl-C to stop. Leave this window open for the whole sale."
say "Running"

# --- loop -------------------------------------------------------------------

while true; do
  CYCLE_START="$(date +%s)"

  FREE="$(free_mb)"
  if [ -n "$FREE" ] && [ "$FREE" -lt "$MIN_FREE_MB" ]; then
    bad "$(now_hms)  only ${FREE} MB of disk left - not writing a dump"
    info "Free some space now, or the database itself will start failing."
    FAILURES=$(( FAILURES + 1 ))
  else
    dump_once
    case $? in
      0) DUMPS=$(( DUMPS + 1 ))
         printf '  %s✓%s %s  %-8s  %s\n' "$GRN" "$RST" "$(now_hms)" \
           "$(human "$LAST_BYTES")" "$(basename "$LAST_FILE")" ;;
      2) SKIPPED=$(( SKIPPED + 1 ))
         printf '  %s·%s %s  unchanged\n' "$YEL" "$RST" "$(now_hms)" ;;
      *) FAILURES=$(( FAILURES + 1 ))
         # A container restarting under us is the likely cause and it fixes
         # itself; say so rather than leaving a bare error on screen.
         [ "$(container_health "$DB_CONTAINER")" != healthy ] && \
           info "$DB_CONTAINER is $(container_health "$DB_CONTAINER") - retrying next cycle" ;;
    esac
    prune
  fi

  # Sleep the remainder so cycles stay on the interval instead of drifting by
  # however long the dump took.
  ELAPSED=$(( $(date +%s) - CYCLE_START ))
  REMAIN=$(( INTERVAL - ELAPSED ))
  [ "$REMAIN" -lt 1 ] && REMAIN=1
  sleep "$REMAIN"
done
