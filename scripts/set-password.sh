#!/usr/bin/env bash
#
# Change the password of an account, on the running server:
#
#   ./scripts/set-password.sh                    # admin@cmr.com
#   ./scripts/set-password.sh benevole@cmr.com   # any other account
#
# Asks for the new password twice, without showing it, hashes it with bcrypt
# inside the backend container (the same library the login checks it with),
# and writes it to that account in Postgres. Nothing changes if the two entries
# differ, if they are empty, or if the account does not exist.
#
# Safe during the sale. The login is checked by the server (/api/signin) and
# the accounts are not synced to the PCs, so there is nothing to propagate.
# Nobody is logged out either: a PC already logged in keeps its session, and
# the new password only applies to the next login.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

BACKEND_CONTAINER=cmr_backend
DB_CONTAINER=cmr_postgres
DB_USER=cmr_user
DB_NAME=cmr_db
EMAIL="${1:-admin@cmr.com}"

for c in "$BACKEND_CONTAINER" "$DB_CONTAINER"; do
  case "$(container_health "$c")" in
    healthy|running) ;;
    *) bad "$c is not running. Start the server first: ./scripts/start-server.sh"; exit 1 ;;
  esac
done

# psql's :'var' quotes the value, so the email and the hash (full of $) go in
# as plain strings. It only works on a script read from stdin, not with -c.
psql_in() {
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -qAtX -v ON_ERROR_STOP=1 "$@"
}

found="$(printf "select count(*) from users where email = :'email' and deleted_at is null;\n" |
  psql_in -v email="$EMAIL")"
if [ "$found" != 1 ]; then
  bad "No single account $EMAIL in the base ($found found)."
  info "The accounts:"
  printf "select email || '  (' || role || ')' from users where deleted_at is null order by email;\n" |
    psql_in | sed 's/^/      /'
  exit 1
fi

say "New password for $EMAIL"
read -rsp "  Password: " first; echo
read -rsp "  Again:    " second; echo
if [ -z "$first" ]; then
  bad "Empty password: nothing changed."
  exit 1
fi
if [ "$first" != "$second" ]; then
  bad "The two entries differ: nothing changed."
  exit 1
fi

hash="$(docker exec -e PW="$first" -w /app/apps/backend "$BACKEND_CONTAINER" \
  node -e 'console.log(require("bcrypt").hashSync(process.env.PW, 10))')"
unset first second
case "$hash" in
  '$2'*) ;;
  *) bad "The backend did not return a bcrypt hash: nothing changed."; exit 1 ;;
esac

updated="$(printf "update users set password = :'hash', updated_at = now()
  where email = :'email' and deleted_at is null returning email;\n" |
  psql_in -v hash="$hash" -v email="$EMAIL" | grep -c . || true)"
if [ "$updated" = 1 ]; then
  ok "Password of $EMAIL changed. It applies to the next login."
else
  bad "$updated account(s) updated instead of 1."
  exit 1
fi
