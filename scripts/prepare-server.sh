#!/usr/bin/env bash
#
# Day-of server preparation.
#
# The venue router is NOT the router this was developed on, so the Mac gets a
# different IP on site. This script re-issues the TLS certificate for whatever
# address it actually has, and prints the hosts line to put on the 9 client PCs.
#
# The mkcert ROOT CA is unchanged by this, so client PCs that already trust the
# CA need no action - only the hosts file entry.
#
#   ./scripts/prepare-server.sh
#   ./scripts/prepare-server.sh --add 192.168.2.8   # cover a network you are
#                                                   # not on yet
#   ./scripts/prepare-server.sh --force             # re-issue even if covered
#
# One certificate covers every address it has ever been prepared for, so moving
# between the home network (192.168.1.x) and the venue router (192.168.2.x)
# needs no re-issue and no new trust on the client PCs. The addresses are
# remembered in certs/known-addresses.
#
set -euo pipefail

cd "$(dirname "$0")/.."

HOSTNAME_LAN="bourseauski.local"
CERT_DIR="certs"
ADDR_FILE="$CERT_DIR/known-addresses"
FORCE=no
EXTRA_ADDRS=""

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad() { printf '  \033[31m✗\033[0m %s\n' "$*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --add)
      case "${2:-}" in
        [0-9]*.[0-9]*.[0-9]*.[0-9]*) EXTRA_ADDRS="$EXTRA_ADDRS ${2}"; shift 2 ;;
        *) bad "--add needs an IP address, e.g. --add 192.168.2.8"; exit 1 ;;
      esac ;;
    --force) FORCE=yes; shift ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^#//;s/^ //'; exit 0 ;;
    *) bad "Unknown option: $1"; exit 1 ;;
  esac
done

# --- 1. tooling -------------------------------------------------------------
say "Checking tooling"
command -v mkcert >/dev/null || { bad "mkcert not installed (brew install mkcert)"; exit 1; }
ok "mkcert $(mkcert -version 2>/dev/null || echo present)"

CAROOT="$(mkcert -CAROOT)"
[ -f "$CAROOT/rootCA.pem" ] || { bad "root CA missing at $CAROOT - client PCs could not trust a new cert"; exit 1; }
ok "root CA present: $CAROOT/rootCA.pem"

# --- 2. find this machine's address on the venue network --------------------
say "Detecting LAN address"
IP=""
IFACE=""
for iface in en0 en1 en2 en3; do
  IP="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
  [ -n "$IP" ] && { IFACE="$iface"; ok "$iface -> $IP"; break; }
done
[ -n "$IP" ] || { bad "no LAN address found - is the Mac on the venue network?"; exit 1; }

MDNS="$(scutil --get LocalHostName 2>/dev/null || true).local"
[ "$MDNS" = ".local" ] && MDNS=""
[ -n "$MDNS" ] && ok "mDNS name: $MDNS"

# Read the router from the interface that actually supplied the address; on
# Wi-Fi that is often not en0.
ROUTER="$(ipconfig getoption "$IFACE" router 2>/dev/null || true)"
[ -n "$ROUTER" ] && ok "router: $ROUTER  (set a DHCP reservation for $IP here)"

# --- 3. work out every address the certificate should cover -----------------
say "Addresses to cover"
mkdir -p "$CERT_DIR"
touch "$ADDR_FILE"

# Remember this address and anything passed with --add, so the certificate
# accumulates every network the server has been prepared for instead of trading
# one for the other. Moving between the home network and the venue router then
# needs no re-issue at all - and no new trust on the 9 client PCs.
for a in $IP $EXTRA_ADDRS; do
  grep -qxF "$a" "$ADDR_FILE" 2>/dev/null || echo "$a" >> "$ADDR_FILE"
done

ADDRS="$(grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' "$ADDR_FILE" | sort -u | tr '\n' ' ')"
for a in $ADDRS; do
  [ "$a" = "$IP" ] && ok "$a  (this network, now)" || ok "$a"
done

# --- 4. re-issue the certificate only if it does not already cover them ------
# The names the certificate must carry. Order does not matter to mkcert.
SAN_LIST="$HOSTNAME_LAN localhost 127.0.0.1 $ADDRS${MDNS:+ $MDNS}"

covers_everything() {
  local text san
  [ -f "$CERT_DIR/cert.pem" ] || return 1
  openssl x509 -in "$CERT_DIR/cert.pem" -checkend 86400 >/dev/null 2>&1 || return 1
  text="$(openssl x509 -in "$CERT_DIR/cert.pem" -noout -text 2>/dev/null)" || return 1
  for san in $SAN_LIST; do
    case "$san" in
      # An IP SAN prints as "IP Address:1.2.3.4"; require the entry to end there
      # so 192.168.2.8 is not considered covered by 192.168.2.80.
      [0-9]*.[0-9]*.[0-9]*.[0-9]*) echo "$text" | grep -qE "IP Address:${san//./\\.}(,|$)" || return 1 ;;
      *) echo "$text" | grep -qE "DNS:${san//./\\.}(,|$)" || return 1 ;;
    esac
  done
  return 0
}

if [ "$FORCE" = no ] && covers_everything; then
  ISSUE=no
else
  ISSUE=yes
fi

say "Certificate"
if [ "$ISSUE" = no ]; then
  ok "the existing certificate already covers every address - not re-issuing"
  ok "covers: $(echo $SAN_LIST | tr ' ' ',' | sed 's/,/, /g')"
  openssl x509 -in "$CERT_DIR/cert.pem" -noout -enddate | sed 's/^/  /'
else

  # Keep the working cert. mkcert writes in place, so a half-failed run would
  # otherwise leave no certificate at all - on site, with clients waiting.
  BACKUP=""
  if [ -f "$CERT_DIR/cert.pem" ]; then
    BACKUP="$CERT_DIR/previous-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP"
    cp "$CERT_DIR/cert.pem" "$CERT_DIR/cert-key.pem" "$BACKUP/" 2>/dev/null || true
    ok "previous certificate saved to $BACKUP/"
    # keep the three most recent, discard older ones
    ls -dt "$CERT_DIR"/previous-* 2>/dev/null | tail -n +4 | while read -r old_dir; do
      rm -rf "$old_dir"
    done
  fi

  restore_on_failure() {
    [ -n "$BACKUP" ] || return 0
    bad "issuing failed - restoring the previous certificate"
    cp "$BACKUP/cert.pem" "$BACKUP/cert-key.pem" "$CERT_DIR/" 2>/dev/null || true
    docker compose restart caddy >/dev/null 2>&1 || true
  }

  # shellcheck disable=SC2086
  if ! mkcert -cert-file "$CERT_DIR/cert.pem" -key-file "$CERT_DIR/cert-key.pem" \
       $SAN_LIST >/dev/null 2>&1; then
    restore_on_failure
    exit 1
  fi

  # A truncated or unreadable cert is as bad as a missing one.
  if ! openssl x509 -in "$CERT_DIR/cert.pem" -noout >/dev/null 2>&1; then
    restore_on_failure
    exit 1
  fi

  ok "certs/cert.pem covers: $(echo $SAN_LIST | tr ' ' ',' | sed 's/,/, /g')"
  openssl x509 -in "$CERT_DIR/cert.pem" -noout -enddate | sed 's/^/  /'
fi

# --- 5. restart Caddy so it picks the new cert up ---------------------------
# NOTE: a hard restart is required. Caddy loads `load_files` certificates into
# memory at config-load time. Writing new files to certs/ does nothing, and
# neither does `docker compose up -d caddy` (no-op when the service definition
# is unchanged) nor `caddy reload` (skips reloading when the adapted config is
# byte-identical, which it is here). Both silently keep serving the old cert.
wire_fp() {
  echo | openssl s_client -connect "localhost:443" 2>/dev/null \
    | openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2
}
DISK_FP="$(openssl x509 -in "$CERT_DIR/cert.pem" -noout -fingerprint -sha256 | cut -d= -f2)"

say "Restarting Caddy"
if [ "$ISSUE" = no ] && [ "$(wire_fp)" = "$DISK_FP" ]; then
  # Nothing was re-issued and Caddy is already serving this exact certificate.
  # Restarting would drop every client's connection for a few seconds to
  # achieve nothing - and on the day that is a risk taken for no reason.
  ok "already serving this certificate - no restart needed"
else
  docker compose restart caddy >/dev/null 2>&1
  for _ in $(seq 1 20); do
    curl -sk --max-time 2 "https://localhost/api/health" >/dev/null 2>&1 && break
    sleep 1
  done
  ok "caddy restarted"
fi

# --- 6. verify the way a client sees it -------------------------------------
say "Verifying"

# The cert Caddy actually serves must be the one we just wrote. If these differ,
# Caddy is serving a cached certificate that does not cover $IP, and every
# client would fail TLS on the day.
WIRE_FP="$(wire_fp)"
if [ -n "$WIRE_FP" ] && [ "$DISK_FP" = "$WIRE_FP" ]; then
  ok "Caddy is serving the certificate just issued"
else
  bad "Caddy is serving a STALE certificate - clients will fail TLS"
  echo "     on disk: ${DISK_FP:-none}"
  echo "     served : ${WIRE_FP:-none}"
  echo "     fix    : docker compose restart caddy"
  exit 1
fi

if curl -s --cacert "$CAROOT/rootCA.pem" --max-time 5 \
     --resolve "$HOSTNAME_LAN:443:$IP" \
     "https://$HOSTNAME_LAN/api/health" >/dev/null 2>&1; then
  ok "https://$HOSTNAME_LAN verifies against the root CA"
else
  bad "TLS check failed - the stack may still be starting, retry in a few seconds"
  exit 1
fi

curl -sk -o /dev/null -w "  frontend -> HTTP %{http_code}\n" --max-time 5 "https://$IP/" || true

# --- 7. what to do on the 9 client PCs --------------------------------------
say "On each of the 9 client PCs"
cat <<TXT

  a) Install the root CA (once per PC, already done if you emailed it):
       Windows : double-click rootCA.crt -> Local Machine
                 -> Trusted Root Certification Authorities
       macOS   : Keychain Access -> System -> Always Trust
       Firefox : Settings -> Certificates -> Authorities -> Import

  b) Add this line to the hosts file:

       $IP  $HOSTNAME_LAN

       Windows : C:\\Windows\\System32\\drivers\\etc\\hosts   (edit as Administrator)
       macOS   : sudo nano /etc/hosts

  c) Open:  https://$HOSTNAME_LAN

TXT

say "Reminder"
echo "  The IP above comes from DHCP. Set a reservation for it on the router"
echo "  (${ROUTER:-the venue router}) or every hosts entry goes stale when the lease rotates."
echo
