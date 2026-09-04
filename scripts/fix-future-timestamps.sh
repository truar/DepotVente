#!/usr/bin/env bash
#
# Pull future-dated `updated_at` values back to the present.
#
# `updated_at` is the sync cursor: /sync/delta returns every row where
# `updated_at >= since`. A row dated in the future satisfies that filter
# forever, so every client re-downloads it on every poll and delta sync
# degenerates into a full sync that never converges.
#
# The importer no longer writes source timestamps into updated_at, so this is
# only needed for data imported before that fix.
#
#   ./scripts/fix-future-timestamps.sh          # report only
#   ./scripts/fix-future-timestamps.sh --yes    # apply
#
set -euo pipefail
cd "$(dirname "$0")/.."

TABLES='deposits articles contacts sales refunds predeposits "predepositArticles" "cashRegisterControls"'

psql_() { docker exec cmr_postgres psql -U cmr_user -d cmr_db "$@"; }

echo "Rows dated in the future (server time: $(psql_ -tAc 'select now()::timestamp(0)' | tr -d '\r'))"
TOTAL=0
for t in $TABLES; do
  n="$(psql_ -tAc "select count(*) from $t where updated_at > now()" 2>/dev/null | tr -d ' \r')"
  [ -z "$n" ] && continue
  printf '  %-24s %s\n' "$(echo "$t" | tr -d '"')" "$n"
  TOTAL=$((TOTAL + n))
done
echo "  total: $TOTAL"

[ "$TOTAL" -eq 0 ] && { echo "Nothing to fix."; exit 0; }

if [ "${1:-}" != "--yes" ]; then
  echo
  echo "Nothing changed. Re-run with --yes to pull these back to now()."
  echo "Take a backup first: ./scripts/stop-server.sh takes one, or run pg_dump."
  exit 0
fi

echo
for t in $TABLES; do
  psql_ -v ON_ERROR_STOP=1 -tAc \
    "update $t set updated_at = now() - interval '1 hour' where updated_at > now()" \
    2>/dev/null | sed "s/^/  $(echo "$t" | tr -d '"'): /"
done
echo "Done. Verify with: ./scripts/fix-future-timestamps.sh"
