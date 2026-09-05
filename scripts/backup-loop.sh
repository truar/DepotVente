#!/usr/bin/env bash
#
# Continuous database backup for the day of the sale.
#
#   ./scripts/backup-loop.sh                          # dump every 60s into backups/
#   ./scripts/backup-loop.sh --interval 30
#   ./scripts/backup-loop.sh --claim-usb /Volumes/CLE # once per key: mark it, then exit
#   ./scripts/backup-loop.sh --mirror /Volumes/CLE    # force a path instead of finding it
#   ./scripts/backup-loop.sh --no-usb                 # local dumps only
#   ./scripts/backup-loop.sh --once                   # single dump, then exit
#
# Leave it running in its own terminal window for the whole sale. Ctrl-C stops
# it. It is safe to start and stop at any time, and it survives the database
# container restarting under it.
#
# A claimed USB key is found automatically wherever it mounts and whatever it is
# called. It can be pulled out and plugged back in at any time: the dumps keep
# going to backups/ regardless, and mirroring picks up again by itself. Dumps
# made while it was out are not copied over afterwards - the key is a spare copy
# of recent state, not a second archive.
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
MIRROR=""                    # explicit path, overrides marker discovery
CLAIM=""
NO_USB=no
# Seconds before a stuck USB write is given up on. Generous on purpose: the
# first copy to a key that has been sitting idle was measured at 13.8s on real
# hardware (a wake-up cost - the next four copies of the same file took ~250ms).
# A tight timeout kills copies that were about to succeed. Nothing waits on this
# anyway, so the only job of the limit is to stop a copy to a pulled-out key
# from lingering for ever.
MIRROR_TIMEOUT=60
ONCE=no
LOCK_WAIT=10s                # fail the cycle rather than queue behind a lock
MIN_FREE_MB=500

usage() {
  sed -n '2,20p' "$0" | sed 's/^#//;s/^ //'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --interval) INTERVAL="${2:?--interval needs a number of seconds}"; shift 2 ;;
    --keep-minutes) KEEP_MINUTES="${2:?--keep-minutes needs a number}"; shift 2 ;;
    --mirror) MIRROR="${2:?--mirror needs a directory}"; shift 2 ;;
    --claim-usb) CLAIM="${2:?--claim-usb needs the path of a mounted volume}"; shift 2 ;;
    --no-usb) NO_USB=yes; shift ;;
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
MIRROR_STATE=absent; MIRROR_WHY=none
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

  return 0
}

# --- USB mirror -------------------------------------------------------------
#
# The local dump is the backup; the key is a second copy in case the Mac itself
# is the thing that dies. So the key must never be able to slow the loop down or
# fail a cycle: a spun-down or half-yanked USB stick can block a write in the
# kernel for a long time, and this loop is the one thing that has to keep going.
#
# Every failure here is therefore a warning, never a failed cycle, and the copy
# runs detached from the loop.

# Copy one dump to the key. Runs in the background - never call it without '&'.
mirror_one() {
  local src="$1" dest="$2" base tmp cp_pid waited=0
  base="$(basename "$src")"
  # Unique temp name: if a slow key leaves two copies overlapping, they cannot
  # collide. Both land on the same final name with the same bytes.
  tmp="$dest/.${base}.$$.part"

  cp "$src" "$tmp" 2>/dev/null &
  cp_pid=$!

  # No `timeout` on macOS, so watchdog it by hand. Without this, pulling the key
  # mid-write leaves a cp blocked in uninterruptible I/O forever.
  while kill -0 "$cp_pid" 2>/dev/null; do
    if [ "$waited" -ge "$MIRROR_TIMEOUT" ]; then
      # disown first: without it the shell announces the kill on the terminal
      # as "line N: 14361 Killed: 9  cp ...", which looks like a crash in the
      # middle of an otherwise calm backup window.
      disown "$cp_pid" 2>/dev/null || true
      # TERM before KILL - a cp that can still respond gets to tidy up. A cp
      # wedged in uninterruptible I/O on a pulled key ignores both, but it is
      # detached, so it harms nothing while the kernel gives up on the device.
      kill -TERM "$cp_pid" 2>/dev/null
      sleep 2
      kill -KILL "$cp_pid" 2>/dev/null
      rm -f "$tmp" 2>/dev/null
      warn "$(now_hms)  gave up copying $base to the USB key after ${MIRROR_TIMEOUT}s"
      info "The dump is safe in $BACKUP_DIR. Check the key is still plugged in."
      return 1
    fi
    sleep 1; waited=$(( waited + 1 ))
  done
  wait "$cp_pid" 2>/dev/null || { rm -f "$tmp" 2>/dev/null; return 1; }

  # Same .part-then-rename as the local dump: a half-copied file on the key must
  # never look like a usable backup to restore-backup.sh.
  mv "$tmp" "$dest/$base" 2>/dev/null || { rm -f "$tmp" 2>/dev/null; return 1; }
}

# Say where the dump ended up. Only for --once, which waits for the copy: the
# loop cannot report this, because it deliberately never waits.
mirror_report() {
  local vol dest
  [ "$NO_USB" = yes ] && return
  [ -z "$LAST_FILE" ] && return
  vol="$(find_backup_volume 2>/dev/null || true)"
  dest="$vol/$BACKUP_DUMP_DIR"
  [ -n "$MIRROR" ] && { vol="$MIRROR"; dest="$MIRROR"; }
  if [ -z "$vol" ]; then
    warn "Not copied to a USB key - none connected"
    return
  fi
  if [ -f "$dest/$(basename "$LAST_FILE")" ]; then
    ok "Copied to $dest/"
  else
    bad "Could not copy it to the USB key at $vol"
    info "The dump is safe in $BACKUP_DIR - only the second copy failed."
  fi
}

# Clear part-files left by a copy that was interrupted by the key being pulled.
# Their own cleanup cannot run in that case - the volume is gone by then - so
# they are swept the next time the key is usable. They are hidden and can never
# be mistaken for a backup, but without this they pile up across a sale.
sweep_parts() {
  rm -f "$1"/.*.part 2>/dev/null || true
}

# Resolve the key and mirror the newest dump, announcing only the transitions.
# Deliberately no catch-up: dumps written while the key was out stay behind on
# the Mac. What matters is that the key carries a recent dump, and it gets one
# the moment it is plugged back in.
mirror_cycle() {
  local dest vol
  vol="$(find_backup_volume 2>/dev/null || true)"
  # Discovery writes into the dumps folder on the key; --mirror means "this
  # exact directory" and is left alone.
  [ -n "$vol" ] && dest="$vol/$BACKUP_DUMP_DIR" || dest=""
  [ -n "$MIRROR" ] && dest="$MIRROR"
  if [ -n "$dest" ]; then
    mkdir -p "$dest" 2>/dev/null
    # Found the key but cannot write to it: a full key, a read-only mount, or
    # something occupying the folder name. Say so instead of reporting it gone -
    # "gone" sends someone hunting for a physical problem that is not there.
    if [ ! -d "$dest" ] || [ ! -w "$dest" ]; then
      if [ "$MIRROR_WHY" != blocked ]; then
        warn "$(now_hms)  found the USB key but cannot write to $dest"
        info "Is it full, read-only, or is something else using that name?"
        info "Dumps continue in $BACKUP_DIR."
        MIRROR_WHY=blocked
      fi
      MIRROR_STATE=absent
      return
    fi
  fi

  if [ -z "$dest" ]; then
    if [ "$MIRROR_STATE" = present ]; then
      warn "$(now_hms)  the USB key is gone - dumps continue in $BACKUP_DIR"
      info "Plug it back in and mirroring resumes on its own."
      MIRROR_STATE=absent
    fi
    MIRROR_WHY=none
    return
  fi
  MIRROR_WHY=ok

  if [ "$MIRROR_STATE" = absent ]; then
    # Name the key, not the folder inside it: this is read by someone checking
    # the right stick is being written to.
    ok "$(now_hms)  USB key found at ${vol:-$dest} - mirroring resumed"
    MIRROR_STATE=present
    sweep_parts "$dest"
    # Copy the current dump right away rather than waiting for the data to
    # change: after a replug the key would otherwise stay stale for as long as
    # the database happens to be quiet.
    [ -n "$LAST_FILE" ] && [ -f "$LAST_FILE" ] && { mirror_one "$LAST_FILE" "$dest" & }
    return
  fi

  [ -n "$LAST_FILE" ] && [ -f "$LAST_FILE" ] && { mirror_one "$LAST_FILE" "$dest" & }
}

# Write the marker that makes a volume findable, whatever it is later called.
claim_usb() {
  local vol="$1"
  [ -d "$vol" ] || { bad "$vol is not a directory - is the key plugged in?"; exit 1; }
  [ -w "$vol" ] || { bad "$vol is not writable."; exit 1; }
  if on_boot_volume "$vol"; then
    bad "$vol is on the Mac's own disk, not removable media."
    info "A copy there is lost with the Mac. Pass the path under /Volumes/."
    exit 1
  fi
  mkdir -p "$vol/$BACKUP_DUMP_DIR" || exit 1
  cat > "$vol/$BACKUP_MARKER" <<EOF
Cle de sauvegarde DepotVente (bourse au ski).

NE PAS SUPPRIMER CE FICHIER. C'est lui qui identifie la cle : le serveur la
reconnait grace a lui, meme si elle est renommee ou branchee sur un autre port.
Sans ce fichier, plus aucune sauvegarde n'est copiee sur cette cle.

Les sauvegardes sont dans le dossier "lists" a cote.

marquee_le=$(date '+%Y-%m-%d %H:%M:%S')
marquee_par=$(hostname)
identifiant=$(uuidgen 2>/dev/null || date +%s)
EOF
  ok "Claimed $vol as the backup key"
  info "Wrote $BACKUP_KEY_DIR/marker; dumps will go in $BACKUP_DUMP_DIR/"
  info "Backups will now find it automatically, however it is named."
  info "Spotlight indexes removable media by default and only slows the writes"
  info "down; turn it off for this key with:  sudo mdutil -i off '$vol'"
  exit 0
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
  if [ "$NO_USB" = no ]; then
    if [ "$MIRROR_STATE" = present ]; then
      printf '  USB key was connected at the end\n'
    else
      printf '  %sNo USB key connected at the end - backups/ is the only copy%s\n' "$YEL" "$RST"
    fi
  fi
  [ "$FAILURES" -gt 0 ] && printf '  %s%d cycle(s) failed - check above%s\n' "$YEL" "$FAILURES" "$RST"
  echo
  exit 0
}
trap summary INT TERM

# --- startup ----------------------------------------------------------------

# Claiming only writes a file on the key - no database and no Docker needed, so
# it happens before every other check.
[ -n "$CLAIM" ] && claim_usb "$CLAIM"

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

# A missing key is never fatal. Refusing to start because nobody plugged the
# stick in would leave the sale with no backup at all, which is far worse than
# having no second copy.
if [ "$NO_USB" = yes ]; then
  MIRROR=""
elif [ -n "$MIRROR" ]; then
  if [ -d "$MIRROR" ] && [ -w "$MIRROR" ]; then
    ok "Mirroring each dump to $MIRROR"
    MIRROR_STATE=present
  else
    warn "$MIRROR is not writable yet - dumps go to $BACKUP_DIR until it is"
  fi
else
  USB="$(find_backup_volume 2>/dev/null || true)"
  if [ -n "$USB" ]; then
    ok "Mirroring each dump to the USB key at $USB"
    MIRROR_STATE=present
    # Also sweep here: a run that ended with the key pulled leaves part-files
    # behind, and the transition below only fires on a replug.
    sweep_parts "$USB/$BACKUP_DUMP_DIR"
  else
    info "No backup USB key found - dumps go to $BACKUP_DIR only."
    info "Plug one in at any time and it starts mirroring by itself."
    info "First time with a new key:  $0 --claim-usb /Volumes/<name>"
  fi
fi

if [ "$ONCE" = yes ]; then
  dump_once; rc=$?
  case $rc in
    0) ok "Wrote $LAST_FILE ($(human "$LAST_BYTES"))" ;;
    2) ok "Database unchanged since $LAST_FILE" ;;
    *) exit 1 ;;
  esac
  # Wait for it here, unlike the loop: a one-shot run has nothing else to get on
  # with, and the operator wants to know the key really has the file.
  [ "$NO_USB" = yes ] || { mirror_cycle; wait; mirror_report; }
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
         # The USB note reflects the key's state as of this cycle, not a
         # finished copy - the copy is dispatched just below and deliberately
         # never waited on. It answers "is the key still being written to?",
         # which is the question someone glancing at this window has.
         USB_NOTE=""
         [ "$NO_USB" = no ] && [ "$MIRROR_STATE" = present ] && USB_NOTE="  + USB key"
         printf '  %s✓%s %s  %-8s  %s%s\n' "$GRN" "$RST" "$(now_hms)" \
           "$(human "$LAST_BYTES")" "$(basename "$LAST_FILE")" "$USB_NOTE" ;;
      2) SKIPPED=$(( SKIPPED + 1 ))
         printf '  %s·%s %s  unchanged\n' "$YEL" "$RST" "$(now_hms)" ;;
      *) FAILURES=$(( FAILURES + 1 ))
         # A container restarting under us is the likely cause and it fixes
         # itself; say so rather than leaving a bare error on screen.
         [ "$(container_health "$DB_CONTAINER")" != healthy ] && \
           info "$DB_CONTAINER is $(container_health "$DB_CONTAINER") - retrying next cycle" ;;
    esac
    # Every cycle, not just the ones that produced a new dump: this is also how
    # the key is noticed coming back while the database happens to be quiet.
    [ "$NO_USB" = yes ] || mirror_cycle
    prune
  fi

  # Sleep the remainder so cycles stay on the interval instead of drifting by
  # however long the dump took.
  ELAPSED=$(( $(date +%s) - CYCLE_START ))
  REMAIN=$(( INTERVAL - ELAPSED ))
  [ "$REMAIN" -lt 1 ] && REMAIN=1
  sleep "$REMAIN"
done
