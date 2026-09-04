#!/usr/bin/env bash
#
# Is the server healthy right now? Safe to run at any time during the sale.
#
#   ./scripts/status.sh
#
set -uo pipefail          # deliberately not -e: we want every check to run
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

PROBLEMS=0
problem() { bad "$*"; PROBLEMS=$((PROBLEMS+1)); }

printf '\n%s=== Server status ===%s\n' "$BLD" "$RST"

say "Services"
if ! docker info >/dev/null 2>&1; then
  problem "Docker is not running - the server is DOWN"
  info "Start it with ./scripts/start-server.sh"
  printf '\n%s=== 1 problem ===%s\n\n' "$RED" "$RST"
  exit 1
fi
RUNNING=0
for c in $SERVICES; do
  h="$(container_health "$c")"
  [ "$h" != missing ] && RUNNING=$((RUNNING+1))
done

# If nothing is running the server is simply off. Reporting a cascade of
# failures here (stale certificate, unreachable database) reads as a disaster
# to someone who just has not started it yet.
if [ "$RUNNING" -eq 0 ]; then
  bad "The server is not running"
  info "Start it with:  ./scripts/start-server.sh"
  printf '\n%s=== The server is stopped ===%s\n\n' "$YEL" "$RST"
  exit 1
fi

for c in $SERVICES; do
  h="$(container_health "$c")"
  case "$h" in
    healthy) ok "$c" ;;
    starting|"health: starting") warn "$c is still starting" ;;
    missing) problem "$c is not running" ;;
    *) problem "$c is $h" ;;
  esac
done

# A container that keeps restarting looks fine in a snapshot.
for c in $SERVICES; do
  r="$(docker inspect "$c" --format '{{.RestartCount}}' 2>/dev/null || echo 0)"
  [ "${r:-0}" -gt 0 ] && warn "$c has restarted $r time(s) - it may be unstable"
done

say "Reachable"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://localhost/api/health 2>/dev/null)"
[ "$code" = 200 ] && ok "The app answers on https://localhost" \
                  || problem "The app did not answer (code ${code:-none})"

say "Certificate"
if [ -f certs/cert.pem ]; then
  END="$(openssl x509 -in certs/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)"
  if openssl x509 -in certs/cert.pem -checkend 0 >/dev/null 2>&1; then
    ok "Valid until $END"
  else
    problem "The certificate has EXPIRED - clients cannot connect"
    info "Fix: ./scripts/prepare-server.sh"
  fi

  # The most likely day-of failure: DHCP moved the Mac and the cert no longer
  # covers its address, so every client hosts entry points somewhere untrusted.
  IP="$(lan_ip || echo '')"
  if [ -n "$IP" ]; then
    if openssl x509 -in certs/cert.pem -noout -text 2>/dev/null | grep -q "IP Address:$IP"; then
      ok "Covers this Mac's current address ($IP)"
    else
      problem "This Mac's address is now $IP, which the certificate does not cover"
      info "The address changed. Fix: ./scripts/prepare-server.sh"
      info "then update the hosts file on the client PCs."
    fi
  fi

  DISK="$(openssl x509 -in certs/cert.pem -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2)"
  WIRE="$(echo | openssl s_client -connect localhost:443 2>/dev/null | openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2)"
  [ -n "$WIRE" ] && [ "$DISK" = "$WIRE" ] && ok "The server is serving the current certificate" \
    || { problem "The server is serving an OLD certificate"; info "Fix: docker compose restart caddy"; }
else
  problem "certs/cert.pem is missing - clients cannot connect"
  info "Fix: ./scripts/prepare-server.sh"
fi

say "Data"
if [ "$(container_health cmr_postgres)" = healthy ]; then
  read -r d a s < <(docker exec cmr_postgres psql -U cmr_user -d cmr_db -tAc \
    "select (select count(*) from deposits), (select count(*) from articles), (select count(*) from sales)" \
    2>/dev/null | tr '|' ' ')
  if [ -n "${d:-}" ]; then
    ok "$d deposits, $a articles, $s sales"
  else
    problem "Could not read the database"
  fi
  conns="$(docker exec cmr_postgres psql -U cmr_user -d cmr_db -tAc \
    "select count(*) from pg_stat_activity where datname='cmr_db'" 2>/dev/null | tr -d ' ')"
  if [ -n "$conns" ]; then
    # Prisma keeps its pool of 20 open and idle, so a count around 20 is normal
    # and not a sign of pressure. Exhaustion shows up as P2024 in the log, which
    # is checked below - this is only here to catch something far out of range.
    if [ "$conns" -lt 40 ]; then
      ok "$conns database connections (pool of 20 kept open - normal)"
    else
      problem "$conns database connections - far above the pool of 20"
    fi
  fi
else
  problem "The database is not healthy"
fi

say "Recent errors"
ERRS="$(docker logs --since 30m cmr_backend 2>&1 | grep -c 'P2024' || true)"
[ "${ERRS:-0}" -gt 0 ] && problem "$ERRS database timeouts in the last 30 minutes (server overloaded)" \
                       || ok "No database timeouts in the last 30 minutes"
FIVES="$(docker logs --since 30m cmr_backend 2>&1 | grep -c '"statusCode":5' || true)"
[ "${FIVES:-0}" -gt 0 ] && warn "$FIVES server errors in the last 30 minutes" \
                        || ok "No server errors in the last 30 minutes"

say "Resources"
docker stats --no-stream --format '{{.Name}}: {{.CPUPerc}} CPU, {{.MemUsage}}' $SERVICES 2>/dev/null | sed 's/^/  /'
SWAP="$(sysctl -n vm.swapusage 2>/dev/null | sed 's/.*used = \([0-9.,]*\)M.*/\1/')"
if [ -n "$SWAP" ]; then
  printf '  Mac swap in use: %sM\n' "$SWAP"
  case "$SWAP" in *[0-9]*) [ "${SWAP%%[.,]*}" -gt 3000 ] && warn "Swap is high - close other applications" ;; esac
fi

say "Backups"
LAST="$(ls -t backups/*.sql 2>/dev/null | head -1 || true)"
if [ -n "$LAST" ]; then
  AGE=$(( ( $(date +%s) - $(stat -f %m "$LAST") ) / 60 ))
  [ "$AGE" -lt 60 ] && ok "Last backup $AGE minutes ago ($(basename "$LAST"))" \
                    || warn "Last backup was $AGE minutes ago - take one soon"
else
  warn "No backup taken yet"
  info "docker exec cmr_postgres pg_dump -U cmr_user -d cmr_db > backups/cmr_db-\$(date +%H%M).sql"
fi

if [ "$PROBLEMS" -eq 0 ]; then
  printf '\n%s=== Everything is working ===%s\n\n' "$GRN" "$RST"
else
  printf '\n%s=== %s problem(s) found - see the ✗ lines above ===%s\n\n' "$RED" "$PROBLEMS" "$RST"
  exit 1
fi
