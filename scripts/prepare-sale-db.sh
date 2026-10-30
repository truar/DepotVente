#!/usr/bin/env bash
#
# Import the pros and the predeposits of a sale, as often as needed:
#
#   ./scripts/prepare-sale-db.sh --new depotvente_postgres_2026   # once, the first time
#   ./scripts/prepare-sale-db.sh                                  # then, after each change
#
# --new NAME builds the base from nothing: switches Postgres to that Docker
# volume (PG_VOLUME in the root .env; the volume must not exist yet, and the
# previous base stays in its own volume, untouched), then creates the tables
# and the volunteer accounts (migrate + seed).
#
# Every run, with or without --new, first says which base it is on and what
# that base already holds. It then takes the pros (tmp/pro/articles-pro.csv)
# and the predeposits (the two CSVs in tmp/predepot/final: predeposants.csv
# and articles.csv) one after the other: simulates the import, then asks
# before writing it. A part whose files are not there yet is skipped, and said
# so: the pros can go in first and the predeposits later. Both imports skip
# what an earlier run already wrote (same pro fiche number, same predeposit
# fiche number) and only add the new fiches, so rerunning is safe.
#
# The two predeposit CSVs are written once from the closed Google Form, then
# reviewed and edited by hand (kept out of git: sellers' details):
#   pnpm --silent --filter backend exec tsx src/scripts/import/import-predeposits-form.ts \
#     ../../tmp/predepot/<export>.csv --corrections=../../tmp/predepot/descriptifs-doc.md \
#     --export=../../tmp/predepot/final
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
PREDEPOSIT_DIR="$PWD/tmp/predepot/final"
HAVE_PROS=no
[ -f "$PROS_CSV" ] && HAVE_PROS=yes
HAVE_PREDEPOSITS=no
if [ -f "$PREDEPOSIT_DIR/predeposants.csv" ] && [ -f "$PREDEPOSIT_DIR/articles.csv" ]; then
  HAVE_PREDEPOSITS=yes
elif [ -f "$PREDEPOSIT_DIR/predeposants.csv" ] || [ -f "$PREDEPOSIT_DIR/articles.csv" ]; then
  bad "Only one of the two predeposit files is in $PREDEPOSIT_DIR"
  info "Put both predeposants.csv and articles.csv there, then run the script again."
  exit 1
fi

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

# What the base holds, counted in Postgres itself: the deleted fiches and
# articles are left out, as on the PCs.
contents() {
  docker exec cmr_postgres psql -U cmr_user -d cmr_db -AtF ' ' -c "
    select
      (select count(*) from deposits where type = 'PRO' and deleted_at is null),
      (select count(*) from articles a join deposits d on d.id = a.deposit_id
        where d.type = 'PRO' and d.deleted_at is null and a.deleted_at is null),
      (select count(*) from predeposits where deleted_at is null),
      (select count(*) from \"predepositArticles\" a join predeposits p on p.id = a.predeposit_id
        where p.deleted_at is null and a.deleted_at is null)" |
    { read -r pro_fiches pro_articles pre_fiches pre_articles
      info "Pros:        $pro_fiches fiche(s), $pro_articles article(s)"
      info "Predeposits: $pre_fiches fiche(s), $pre_articles article(s)"; }
}

say "Base $VOLUME holds"
contents

pros()        { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-pros.ts" "$PROS_CSV" "$@"; }
predeposits() { pnpm --silent --filter backend exec tsx "$IMPORT_DIR/import-predeposits-csv.ts" "$PREDEPOSIT_DIR" "$@"; }

# Simulates one import, then asks before writing it.
#   import_part <label> <function> <have: yes|no> <files>
import_part() {
  local label="$1" run="$2" have="$3" files="$4" answer
  say "The $label"
  if [ "$have" != yes ]; then
    warn "No $files: the $label are not imported this time."
    return 0
  fi
  "$run"
  printf '\n'
  read -r -p "${BLD}Import the $label into $VOLUME? (o/N) ${RST}" answer
  case "$answer" in
    o|O|oui|y|yes) "$run" --apply ;;
    *) warn "The $label are not imported." ;;
  esac
}

import_part pros pros "$HAVE_PROS" "tmp/pro/articles-pro.csv"
import_part predeposits predeposits "$HAVE_PREDEPOSITS" "tmp/predepot/final/predeposants.csv and articles.csv"

say "Base $VOLUME now holds"
contents
if [ "$NEW" = yes ]; then
  ok "Each PC will ask to rebuild its local base (new base)."
else
  ok "The PCs get the new fiches on their next poll."
fi
info "To add what is missing later: ./scripts/prepare-sale-db.sh (without --new)."
