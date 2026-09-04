#!/usr/bin/env bash
#
# Sample the container side during a load or soak run.
#
#   ./scripts/loadtest/monitor.sh results/soak [interval_seconds]
#
# run.mjs already samples /api/health (heap, event-loop lag). This adds what is
# only visible from outside the process: container CPU and memory, database
# connections, dead tuples, socket count and host swap.
#
set -uo pipefail
cd "$(dirname "$0")/../.."

OUT="${1:-results}"
INTERVAL="${2:-30}"
mkdir -p "$OUT"
CSV="$OUT/monitor-$(date +%Y%m%d%H%M%S).csv"

echo "t_s,pg_cpu,pg_mem_mb,be_cpu,be_mem_mb,caddy_mem_mb,db_conns,dead_articles,be_sockets,host_swap_mb" > "$CSV"
echo "Sampling every ${INTERVAL}s -> $CSV"
echo "Ctrl-C to stop."

# A container that restarts mid-run invalidates any memory trend.
before="$(docker inspect cmr_backend --format '{{.RestartCount}}' 2>/dev/null || echo 0)"

T0=$(date +%s)
trap 'echo; after="$(docker inspect cmr_backend --format "{{.RestartCount}}" 2>/dev/null || echo 0)"; \
      [ "$after" != "$before" ] && echo "WARNING: cmr_backend restarted during the run ($before -> $after)" \
                                || echo "cmr_backend did not restart (count $after)"; \
      echo "Saved $CSV"; exit 0' INT TERM

mb() { awk "BEGIN{printf \"%.1f\", $1}"; }

while true; do
  T=$(( $(date +%s) - T0 ))

  stats="$(docker stats --no-stream --format '{{.Name}} {{.CPUPerc}} {{.MemUsage}}' \
           cmr_postgres cmr_backend cmr_caddy 2>/dev/null)"
  parse() { echo "$stats" | awk -v n="$1" '$1==n{gsub("%","",$2); gsub("MiB","",$3); print $2" "$3}'; }
  read -r PG_CPU PG_MEM <<< "$(parse cmr_postgres)"
  read -r BE_CPU BE_MEM <<< "$(parse cmr_backend)"
  read -r _      CA_MEM <<< "$(parse cmr_caddy)"

  CONNS="$(docker exec cmr_postgres psql -U cmr_user -d cmr_db -tAc \
    "select count(*) from pg_stat_activity where datname='cmr_db'" 2>/dev/null | tr -d ' \r')"
  DEAD="$(docker exec cmr_postgres psql -U cmr_user -d cmr_db -tAc \
    "select coalesce(n_dead_tup,0) from pg_stat_user_tables where relname='articles'" 2>/dev/null | tr -d ' \r')"
  # Socket count: each poll opens a connection; a keep-alive leak shows here.
  SOCK="$(docker exec cmr_backend sh -c 'cat /proc/net/tcp /proc/net/tcp6 2>/dev/null | wc -l' 2>/dev/null | tr -d ' \r')"
  SWAP="$(sysctl -n vm.swapusage 2>/dev/null | sed 's/.*used = \([0-9.,]*\)M.*/\1/' | tr ',' '.')"

  echo "$T,${PG_CPU:-},${PG_MEM:-},${BE_CPU:-},${BE_MEM:-},${CA_MEM:-},${CONNS:-},${DEAD:-},${SOCK:-},${SWAP:-}" >> "$CSV"
  sleep "$INTERVAL"
done
