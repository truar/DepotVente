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

# --watch [seconds]: re-run continuously. macOS has no `watch` command, so the
# script loops over itself rather than depending on one.
if [ "${1:-}" = "--watch" ]; then
  INTERVAL="${2:-15}"
  while true; do
    clear
    "$0" || true
    printf '  %s - refreshing every %ss - Ctrl-C to stop\n\n' "$(date +%H:%M:%S)" "$INTERVAL"
    sleep "$INTERVAL"
  done
fi

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
    # The entry must end at the address, or 192.168.2.8 would look covered by
    # a certificate that only carries 192.168.2.80.
    if openssl x509 -in certs/cert.pem -noout -text 2>/dev/null | grep -qE "IP Address:${IP//./\\.}(,|$)"; then
      ok "Covers this Mac's current address ($IP)"
    else
      problem "This Mac's address is now $IP, which the certificate does not cover"
      info "The address changed. Fix: ./scripts/prepare-server.sh"
      info "(one certificate can carry several networks - it keeps the old ones)"
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
    info "The figures of the day: ./scripts/activity.sh"
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
LAST="$(ls -t backups/*.sql backups/*.sql.gz 2>/dev/null | head -1 || true)"
if [ -n "$LAST" ]; then
  AGE=$(( ( $(date +%s) - $(stat -f %m "$LAST") ) / 60 ))
  # With ./scripts/backup-loop.sh running this is never more than a minute or
  # two, so an old timestamp means the loop has died rather than "nobody has
  # got round to it yet".
  if [ "$AGE" -lt 5 ]; then
    ok "Last backup $AGE minute(s) ago ($(basename "$LAST"))"
  elif [ "$AGE" -lt 60 ]; then
    warn "Last backup was $AGE minutes ago - is ./scripts/backup-loop.sh still running?"
  else
    problem "Last backup was $AGE minutes ago"
    info "Start the continuous backup:  ./scripts/backup-loop.sh"
  fi
else
  problem "No backup taken yet"
  info "Start the continuous backup:  ./scripts/backup-loop.sh"
fi

# The USB key is the copy that survives the Mac itself dying, so a key that fell
# out an hour ago is worth saying out loud - the local backups above look
# perfectly healthy either way.
USB="$(find_backup_volume 2>/dev/null || true)"
if [ -z "$USB" ]; then
  warn "No backup USB key connected - backups/ on this Mac is the only copy"
  info "Plug it in and mirroring resumes on its own, or claim a new key with:"
  info "./scripts/backup-loop.sh --claim-usb /Volumes/<name>"
else
  USB_LAST="$(ls -t "$USB/$BACKUP_DUMP_DIR"/auto-cmr_db-*.sql.gz 2>/dev/null | head -1 || true)"
  if [ -z "$USB_LAST" ]; then
    warn "USB key at $USB holds no backup yet"
  else
    USB_AGE=$(( ( $(date +%s) - $(stat -f %m "$USB_LAST") ) / 60 ))
    if [ "$USB_AGE" -lt 5 ]; then
      ok "USB key up to date ($USB_AGE minute(s) ago, $USB)"
    else
      warn "USB key last updated $USB_AGE minutes ago - was it unplugged?"
    fi
  fi
fi

if [ "$PROBLEMS" -eq 0 ]; then
  printf '\n%s=== Everything is working ===%s\n\n' "$GRN" "$RST"
else
  printf '\n%s=== %s problem(s) found - see the ✗ lines above ===%s\n\n' "$RED" "$PROBLEMS" "$RST"
  exit 1
fi
