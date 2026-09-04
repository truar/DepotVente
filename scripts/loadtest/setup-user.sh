#!/usr/bin/env bash
#
# Create (or reset) the throwaway account the load test signs in with.
#
#   ./scripts/loadtest/setup-user.sh
#
set -euo pipefail
cd "$(dirname "$0")/../.."

EMAIL="loadtest@local"
PASSWORD="loadtest"

HASH="$(docker exec cmr_backend node -e "
  const bcrypt = require('bcrypt');
  bcrypt.hash('$PASSWORD', 10).then(h => process.stdout.write(h));
" 2>/dev/null)"

[ -n "$HASH" ] || { echo "Could not hash the password - is cmr_backend running?"; exit 1; }

# users.email carries no unique constraint, so upsert is not available -
# delete any previous throwaway account, then insert a fresh one.
docker exec cmr_postgres psql -U cmr_user -d cmr_db -v ON_ERROR_STOP=1 -c "
  delete from users where email = '$EMAIL';
  insert into users (id, email, password, role, created_at, updated_at)
  values (gen_random_uuid(), '$EMAIL', '$HASH', 'ADMIN', now(), now());
" >/dev/null

echo "Load-test account ready:"
echo "  export LOADTEST_EMAIL='$EMAIL'"
echo "  export LOADTEST_PASSWORD='$PASSWORD'"
echo
echo "Remove it after the tests with:"
echo "  docker exec cmr_postgres psql -U cmr_user -d cmr_db -c \"delete from users where email='$EMAIL'\""
