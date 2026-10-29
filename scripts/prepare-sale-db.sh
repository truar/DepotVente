#!/usr/bin/env bash
#
# Build the database of a sale, from nothing, in one command:
#
#   ./scripts/prepare-sale-db.sh depotvente_postgres_2026
#
# 1. Switches Postgres to that Docker volume (PG_VOLUME in the root .env). The
#    volume must not exist yet: the script refuses to import twice into the
#    same base. The previous base stays in its own volume, untouched.
# 2. Creates the tables and the volunteer accounts (migrate + seed).
# 3. Downloads the predeposit Google Sheet (PREDEPOSIT_SHEET_ID in the root
#    .env, kept out of git: the Sheet holds the sellers' details).
# 4. Simulates the pro import (tmp/pro/articles-pro.csv) and the predeposit
#    import, then asks before writing anything.
#
# Afterwards each PC asks to rebuild its local base (new dataset epoch).
#
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

VOLUME="${1:-}"
PROS_CSV="$PWD/tmp/pro/articles-pro.csv"
IMPORT_DIR="$PWD/apps/backend/src/scripts/import"

if [ -z "$VOLUME" ]; then
  bad "Name the volume of the new base, e.g. ./scripts/prepare-sale-db.sh depotvente_postgres_2026"
  exit 1
fi
SHEET_ID="$(sed -nE 's/^PREDEPOSIT_SHEET_ID=(.*)$/\1/p' .env 2>/dev/null || true)"
[ -n "$SHEET_ID" ] || { bad "PREDEPOSIT_SHEET_ID is missing from the root .env"; exit 1; }
[ -f "$PROS_CSV" ] || { bad "Pro file not found: $PROS_CSV"; exit 1; }

printf '\n%s=== New sale base in volume %s ===%s\n' "$BLD" "$VOLUME" "$RST"

say "1. Checking Docker"
require_docker || exit 1
if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  bad "Volume $VOLUME already exists: this base was already prepared."
  info "To start over, pick another name, or delete it first: docker volume rm $VOLUME"
  exit 1
fi

say "2. Switching Postgres to $VOLUME"
if grep -q '^PG_VOLUME=' .env; then
  sed -i '' "s/^PG_VOLUME=.*/PG_VOLUME=$VOLUME/" .env
else
  echo "PG_VOLUME=$VOLUME" >> .env
fi
docker compose up -d --force-recreate --no-build --wait postgres backend >/dev/null 2>&1 || {
  bad "Postgres or the backend did not start. See: docker compose logs postgres backend"
  exit 1
}
mounted="$(docker inspect cmr_postgres --format '{{range .Mounts}}{{.Name}} {{end}}')"
case " $mounted " in
  *" $VOLUME "*) ok "Postgres runs on $VOLUME" ;;
  *) bad "Postgres mounts '$mounted', not $VOLUME"; exit 1 ;;
esac

say "3. Creating the tables and accounts"
DATABASE_URL="$(sed -E 's/^DATABASE_URL="(.*)"$/\1/' packages/database/.env)"
export DATABASE_URL
pnpm --filter database db:migrate >/dev/null
pnpm --filter database db:seed >/dev/null
ok "Migrated and seeded"

say "4. Downloading the predeposit Sheet"
SHEET_CSV="$PWD/tmp/predepot/reponses-$(date +%Y%m%d-%H%M).csv"
mkdir -p "$(dirname "$SHEET_CSV")"
curl -fsSL -o "$SHEET_CSV" "https://docs.google.com/spreadsheets/d/$SHEET_ID/export?format=csv"
echo "$SHEET_CSV" > tmp/predepot/.last
ok "$SHEET_CSV"

pros()        { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-pros.ts" "$PROS_CSV" "$@"; }
predeposits() { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-predeposits-form.ts" "$SHEET_CSV" "$@"; }

say "5. Simulating the pro import"
pros
say "6. Simulating the predeposit import"
predeposits

printf '\n'
read -r -p "${BLD}Import the pros and the predeposits into $VOLUME? (o/N) ${RST}" answer
case "$answer" in
  o|O|oui|y|yes) ;;
  *) warn "Nothing imported. The base is empty but ready: run the script with another name, or import by hand."; exit 0 ;;
esac

say "7. Importing"
pros --apply
predeposits --apply

say "Done"
ok "Base $VOLUME is ready; each PC will ask to rebuild its local base."
info "Journal of what had no mapping: ${SHEET_CSV%.csv}-journal.csv"
