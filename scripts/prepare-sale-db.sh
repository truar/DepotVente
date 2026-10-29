#!/usr/bin/env bash
#
# Import the pros and the predeposits of a sale, as often as needed:
#
#   ./scripts/prepare-sale-db.sh --new depotvente_postgres_2026   # once, the first time
#   ./scripts/prepare-sale-db.sh                                  # then, after each new answer
#
# --new NAME builds the base from nothing: switches Postgres to that Docker
# volume (PG_VOLUME in the root .env; the volume must not exist yet, and the
# previous base stays in its own volume, untouched), then creates the tables
# and the volunteer accounts (migrate + seed).
#
# Every run, with or without --new:
# 1. Downloads the predeposit Google Sheet (PREDEPOSIT_SHEET_ID in the root
#    .env, kept out of git: the Sheet holds the sellers' details).
# 2. Simulates the pro import (tmp/pro/articles-pro.csv) and the predeposit
#    import, then asks before writing anything.
# Both imports skip what an earlier run already wrote (same pro fiche number,
# same seller phone) and only add the new fiches, so rerunning is safe.
#
# After --new each PC asks to rebuild its local base (new dataset epoch); the
# later runs reach the PCs on their next poll.
#
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

NEW=no
VOLUME=""
if [ "${1:-}" = "--new" ]; then
  NEW=yes
  VOLUME="${2:-}"
  [ -n "$VOLUME" ] || { bad "Name the volume of the new base: --new depotvente_postgres_2026"; exit 1; }
elif [ -n "${1:-}" ]; then
  bad "Unknown argument: $1"
  info "First time: ./scripts/prepare-sale-db.sh --new depotvente_postgres_2026"
  info "Then:       ./scripts/prepare-sale-db.sh"
  exit 1
fi
PROS_CSV="$PWD/tmp/pro/articles-pro.csv"
IMPORT_DIR="$PWD/apps/backend/src/scripts/import"
SHEET_ID="$(sed -nE 's/^PREDEPOSIT_SHEET_ID=(.*)$/\1/p' .env 2>/dev/null || true)"
[ -n "$SHEET_ID" ] || { bad "PREDEPOSIT_SHEET_ID is missing from the root .env"; exit 1; }
[ -f "$PROS_CSV" ] || { bad "Pro file not found: $PROS_CSV"; exit 1; }

say "Checking Docker"
require_docker || exit 1

if [ "$NEW" = yes ]; then
  if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
    bad "Volume $VOLUME already exists: this base was already created."
    info "To add the new answers to it, run the script without --new."
    exit 1
  fi
  say "Switching Postgres to the new volume $VOLUME"
  if grep -q '^PG_VOLUME=' .env; then
    sed -i '' "s/^PG_VOLUME=.*/PG_VOLUME=$VOLUME/" .env
  else
    echo "PG_VOLUME=$VOLUME" >> .env
  fi
  docker compose up -d --force-recreate --no-build --wait postgres backend >/dev/null 2>&1 || {
    bad "Postgres or the backend did not start. See: docker compose logs postgres backend"
    exit 1
  }
else
  VOLUME="$(sed -nE 's/^PG_VOLUME=(.*)$/\1/p' .env)"
  if [ -z "$VOLUME" ]; then
    bad "No PG_VOLUME in the root .env: the server would run on the default (old) base."
    info "First time: ./scripts/prepare-sale-db.sh --new depotvente_postgres_2026"
    exit 1
  fi
  [ "$(container_health cmr_postgres)" = healthy ] || {
    bad "Postgres is not running. Start the server first: ./scripts/start-server.sh"
    exit 1
  }
fi
mounted="$(docker inspect cmr_postgres --format '{{range .Mounts}}{{.Name}} {{end}}')"
case " $mounted " in
  *" $VOLUME "*) ok "Postgres runs on $VOLUME" ;;
  *) bad "Postgres mounts '$mounted', not $VOLUME (from .env)"
     info "Restart it on the right base: docker compose up -d --force-recreate --no-build postgres backend"
     exit 1 ;;
esac

DATABASE_URL="$(sed -E 's/^DATABASE_URL="(.*)"$/\1/' packages/database/.env)"
export DATABASE_URL
if [ "$NEW" = yes ]; then
  say "Creating the tables and accounts"
  pnpm --filter database db:migrate >/dev/null
  pnpm --filter database db:seed >/dev/null
  ok "Migrated and seeded"
fi

say "Downloading the predeposit Sheet"
SHEET_CSV="$PWD/tmp/predepot/reponses-$(date +%Y%m%d-%H%M).csv"
mkdir -p "$(dirname "$SHEET_CSV")"
curl -fsSL -o "$SHEET_CSV" "https://docs.google.com/spreadsheets/d/$SHEET_ID/export?format=csv"
echo "$SHEET_CSV" > tmp/predepot/.last
ok "$SHEET_CSV"

pros()        { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-pros.ts" "$PROS_CSV" "$@"; }
predeposits() { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-predeposits-form.ts" "$SHEET_CSV" "$@"; }

say "Simulating the pro import"
pros
say "Simulating the predeposit import"
predeposits

printf '\n'
read -r -p "${BLD}Import the pros and the predeposits into $VOLUME? (o/N) ${RST}" answer
case "$answer" in
  o|O|oui|y|yes) ;;
  *) warn "Nothing imported. Rerun the script without --new when ready."; exit 0 ;;
esac

say "Importing"
pros --apply
predeposits --apply

say "Done"
if [ "$NEW" = yes ]; then
  ok "Base $VOLUME is ready; each PC will ask to rebuild its local base."
else
  ok "New fiches added to $VOLUME; the PCs get them on their next poll."
fi
info "Journal of what had no mapping: ${SHEET_CSV%.csv}-journal.csv"
