#!/usr/bin/env bash
#
# Remove the rows the load test created. Matches only the LT- code prefix, so
# imported and real data is never touched.
#
#   ./scripts/loadtest/cleanup.sh          # show what would be deleted
#   ./scripts/loadtest/cleanup.sh --yes    # actually delete
#
set -euo pipefail
cd "$(dirname "$0")/../.."

COUNT="$(docker exec cmr_postgres psql -U cmr_user -d cmr_db -tAc \
  "select count(*) from articles where code like 'LT-%'" 2>/dev/null | tr -d ' ')"

echo "Load-test articles found: ${COUNT:-unknown}"

if [ "${1:-}" != "--yes" ]; then
  echo "Nothing deleted. Re-run with --yes to remove them."
  exit 0
fi

docker exec cmr_postgres psql -U cmr_user -d cmr_db -v ON_ERROR_STOP=1 -c \
  "delete from articles where code like 'LT-%'" | sed 's/^/  /'
echo "Done."
