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
#
set -euo pipefail

cd "$(dirname "$0")/.."

HOSTNAME_LAN="bourseauski.local"
CERT_DIR="certs"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad() { printf '  \033[31m✗\033[0m %s\n' "$*"; }

# --- 1. tooling -------------------------------------------------------------
say "1. Checking tooling"
command -v mkcert >/dev/null || { bad "mkcert not installed (brew install mkcert)"; exit 1; }
ok "mkcert $(mkcert -version 2>/dev/null || echo present)"

CAROOT="$(mkcert -CAROOT)"
[ -f "$CAROOT/rootCA.pem" ] || { bad "root CA missing at $CAROOT - client PCs could not trust a new cert"; exit 1; }
ok "root CA present: $CAROOT/rootCA.pem"

# --- 2. find this machine's address on the venue network --------------------
say "2. Detecting LAN address"
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

# --- 3. re-issue the certificate for that address ---------------------------
say "3. Issuing certificate"
mkdir -p "$CERT_DIR"

# Keep the working cert. mkcert writes in place, so a half-failed run would
# otherwise leave no certificate at all - on site, with clients waiting.
BACKUP=""
if [ -f "$CERT_DIR/cert.pem" ]; then
  BACKUP="$CERT_DIR/previous-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP"
  cp "$CERT_DIR/cert.pem" "$CERT_DIR/cert-key.pem" "$BACKUP/" 2>/dev/null || true
  ok "previous certificate saved to $BACKUP/"
fi

restore_on_failure() {
  [ -n "$BACKUP" ] || return 0
  bad "issuing failed - restoring the previous certificate"
  cp "$BACKUP/cert.pem" "$BACKUP/cert-key.pem" "$CERT_DIR/" 2>/dev/null || true
  docker compose restart caddy >/dev/null 2>&1 || true
}

# shellcheck disable=SC2086
if ! mkcert -cert-file "$CERT_DIR/cert.pem" -key-file "$CERT_DIR/cert-key.pem" \
     "$HOSTNAME_LAN" localhost 127.0.0.1 "$IP" ${MDNS:+"$MDNS"} >/dev/null 2>&1; then
  restore_on_failure
  exit 1
fi

# A truncated or unreadable cert is as bad as a missing one.
if ! openssl x509 -in "$CERT_DIR/cert.pem" -noout >/dev/null 2>&1; then
  restore_on_failure
  exit 1
fi

ok "certs/cert.pem covers: $HOSTNAME_LAN, localhost, 127.0.0.1, $IP${MDNS:+, $MDNS}"
openssl x509 -in "$CERT_DIR/cert.pem" -noout -enddate | sed 's/^/  /'

# --- 4. restart Caddy so it picks the new cert up ---------------------------
# NOTE: a hard restart is required. Caddy loads `load_files` certificates into
# memory at config-load time. Writing new files to certs/ does nothing, and
# neither does `docker compose up -d caddy` (no-op when the service definition
# is unchanged) nor `caddy reload` (skips reloading when the adapted config is
# byte-identical, which it is here). Both silently keep serving the old cert.
say "4. Restarting Caddy"
docker compose restart caddy >/dev/null 2>&1
for _ in $(seq 1 20); do
  curl -sk --max-time 2 "https://localhost/api/health" >/dev/null 2>&1 && break
  sleep 1
done
ok "caddy restarted"

# --- 5. verify the way a client sees it -------------------------------------
say "5. Verifying"

# The cert Caddy actually serves must be the one we just wrote. If these differ,
# Caddy is serving a cached certificate that does not cover $IP, and every
# client would fail TLS on the day.
DISK_FP="$(openssl x509 -in "$CERT_DIR/cert.pem" -noout -fingerprint -sha256 | cut -d= -f2)"
WIRE_FP="$(echo | openssl s_client -connect "localhost:443" 2>/dev/null \
           | openssl x509 -noout -fingerprint -sha256 | cut -d= -f2)"
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

# --- 6. what to do on the 9 client PCs --------------------------------------
say "6. On each of the 9 client PCs"
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
