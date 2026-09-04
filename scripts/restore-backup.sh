#!/usr/bin/env bash
#
# Restore the database from a backup taken by scripts/backup-loop.sh.
#
#   ./scripts/restore-backup.sh                       # list what is available
#   ./scripts/restore-backup.sh --verify <file>       # load it into a scratch
#                                                     # database and count rows,
#                                                     # without touching the live one
#   ./scripts/restore-backup.sh --restore <file>      # replace the live database
#
# The dumps contain CREATE TABLE and COPY but no DROP, so a restore cannot
# simply be replayed on top of the existing database - the schema is dropped and
# recreated first. A safety dump of the current state is always taken before
# anything is replaced.
#
set -uo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

DB_CONTAINER=cmr_postgres
DB_USER=cmr_user
DB_NAME=cmr_db
BACKUP_DIR=backups
SCRATCH_DB=cmr_db_verify

psql_() { docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$@"; }
cat_dump() { case "$1" in *.gz) gzip -dc "$1" ;; *) cat "$1" ;; esac; }

list_backups() {
  say "Available backups"
  local found=no f
  for f in $(ls -t "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.sql.gz 2>/dev/null); do
    found=yes
    printf '  %-52s %8s  %s\n' "$(basename "$f")" \
      "$(du -h "$f" | cut -f1)" "$(date -r "$f" '+%Y-%m-%d %H:%M')"
  done
  [ "$found" = no ] && { bad "No backups found in $BACKUP_DIR/"; return 1; }
  echo
  echo "  Check one is usable, without touching the live database:"
  echo "      ./scripts/restore-backup.sh --verify $BACKUP_DIR/<file>"
  echo
  echo "  Replace the live database with one:"
  echo "      ./scripts/restore-backup.sh --restore $BACKUP_DIR/<file>"
  echo
}

# A truncated dump still looks like a plausible file. pg_dump writes this
# trailer only once it has finished, so it is the real completeness check.
check_complete() {
  if cat_dump "$1" | tail -20 | grep -q 'PostgreSQL database dump complete'; then
    ok "The dump is complete"
    return 0
  fi
  bad "This dump is truncated - it has no completion marker. Refusing to use it."
  return 1
}

counts_of() {   # $1 = database name
  psql_ -d "$1" -tAc "
    select 'deposits ' || count(*) from deposits
    union all select 'articles ' || count(*) from articles
    union all select 'contacts ' || count(*) from contacts
    union all select 'sales ' || count(*) from sales
    union all select 'refunds ' || count(*) from refunds
    union all select 'users ' || count(*) from users" 2>/dev/null
}

verify() {
  local file="$1"
  [ -f "$file" ] || { bad "No such file: $file"; exit 1; }
  say "Verifying $(basename "$file")"
  check_complete "$file" || exit 1

  psql_ -d postgres -qc "drop database if exists $SCRATCH_DB" >/dev/null 2>&1
  psql_ -d postgres -qc "create database $SCRATCH_DB" >/dev/null 2>&1 \
    || { bad "Could not create the scratch database"; exit 1; }

  if ! cat_dump "$file" | docker exec -i "$DB_CONTAINER" \
       psql -U "$DB_USER" -d "$SCRATCH_DB" -v ON_ERROR_STOP=1 >/dev/null 2>&1; then
    bad "The dump failed to load - this backup is NOT usable"
    psql_ -d postgres -qc "drop database if exists $SCRATCH_DB" >/dev/null 2>&1
    exit 1
  fi
  ok "It loads cleanly"

  say "What it contains"
  counts_of "$SCRATCH_DB" | sed 's/^/  /'
  say "What is live right now"
  counts_of "$DB_NAME" | sed 's/^/  /'

  psql_ -d postgres -qc "drop database if exists $SCRATCH_DB" >/dev/null 2>&1
  printf '\n%s=== This backup is usable ===%s\n' "$GRN" "$RST"
  echo "  Nothing was changed. The live database was not touched."
  echo
}

restore() {
  local file="$1"
  [ -f "$file" ] || { bad "No such file: $file"; exit 1; }

  say "Restoring $(basename "$file")"
  check_complete "$file" || exit 1

  warn "This REPLACES the live database with the contents of that file."
  echo
  echo "  Live now:"; counts_of "$DB_NAME" | sed 's/^/      /'
  echo
  echo "  Anything recorded after this backup was taken will be lost from the"
  echo "  server. The client PCs still hold it in their own storage, but they"
  echo "  do not re-send data they have already sent - so it will NOT come back"
  echo "  on its own. Do not clear or reload any client before you have checked"
  echo "  what is missing."
  echo
  printf '  Type RESTORE to continue: '
  read -r answer
  [ "$answer" = "RESTORE" ] || { echo "  Cancelled. Nothing changed."; exit 0; }

  # Always keep an escape route back to the state we are about to destroy.
  say "Safety copy of the current database"
  mkdir -p "$BACKUP_DIR"
  local safety="$BACKUP_DIR/before-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
  if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip -1 > "$safety" \
     && [ -s "$safety" ]; then
    ok "Saved $safety"
  else
    bad "Could not take a safety copy - refusing to go further"
    rm -f "$safety"; exit 1
  fi

  # The backend holds a pool of connections open; they would block the schema
  # drop and could write to a half-restored database.
  say "Stopping the backend"
  docker compose stop backend >/dev/null 2>&1
  ok "Backend stopped (clients keep working from their own storage)"

  psql_ -d postgres -qc \
    "select pg_terminate_backend(pid) from pg_stat_activity where datname='$DB_NAME' and pid <> pg_backend_pid()" \
    >/dev/null 2>&1

  say "Replacing the data"
  if ! psql_ -d "$DB_NAME" -v ON_ERROR_STOP=1 -qc \
       "drop schema public cascade; create schema public;" >/dev/null 2>&1; then
    bad "Could not clear the old schema"
    docker compose start backend >/dev/null 2>&1; exit 1
  fi

  if ! cat_dump "$file" | docker exec -i "$DB_CONTAINER" \
       psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 >/dev/null 2>&1; then
    bad "The restore FAILED partway through. The database is now incomplete."
    info "Put it back with:  ./scripts/restore-backup.sh --restore $safety"
    docker compose start backend >/dev/null 2>&1; exit 1
  fi
  ok "Data restored"

  say "Restarting the backend"
  docker compose start backend >/dev/null 2>&1
  for _ in $(seq 1 30); do
    [ "$(container_health cmr_backend)" = healthy ] && break
    sleep 2
  done
  ok "Backend is $(container_health cmr_backend)"

  say "Restored contents"
  counts_of "$DB_NAME" | sed 's/^/  /'
  printf '\n%s=== Restore complete ===%s\n' "$GRN" "$RST"
  echo "  Previous state saved at $safety"
  echo "  Check the tills: anything recorded after the backup is not here."
  echo
}

case "${1:-}" in
  --verify)  [ -n "${2:-}" ] || { bad "Which file? Run with no arguments to list them."; exit 1; }; verify "$2" ;;
  --restore) [ -n "${2:-}" ] || { bad "Which file? Run with no arguments to list them."; exit 1; }; restore "$2" ;;
  "")        list_backups ;;
  *)         bad "Unknown option: $1"; echo; list_backups; exit 1 ;;
esac
