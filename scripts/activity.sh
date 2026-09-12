#!/usr/bin/env bash
#
# What the day has produced, read from the server database.
#
#   ./scripts/activity.sh
#   ./scripts/activity.sh --watch [seconds]
#
# Health is status.sh's job (services, certificate, backups) and the client
# PCs are traces.mjs's (`pnpm traces postes`). This is the count of the sale
# itself: what was deposited, what the professionals still owe us, what is on
# the shelves, what has been sold, and what each cash register took.
#
# Read-only: every query is a SELECT. Safe to run, and to leave running with
# --watch, at any moment of the day.
set -uo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
. "$(dirname "$0")/_lib.sh"

DB_CONTAINER=cmr_postgres
DB_USER=cmr_user
DB_NAME=cmr_db

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

# One row, tab-separated, for `read -r`.
q() {
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAF $'\t' -c "$1" 2>/dev/null
}
# A table, as psql prints it, indented under its heading. A failing query is
# shown rather than swallowed: a silent empty section reads as "nothing
# happened", which is the one thing a supervision tool must never fake.
qtable() {
  local out
  # lc_numeric pinned to C so `eur_sql` below always has "," for thousands and
  # "." for decimals to translate, whatever locale the server was built with.
  if ! out="$(docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -c "set lc_numeric = 'C'; $1" 2>&1)"; then
    warn "Query failed:"
  fi
  printf '%s\n' "$out" | sed '/^$/d; s/^/  /; s/^  SET$//; /^$/d'
}
# Amounts as the volunteers read them: 186 720,98 €. Grouped by hand rather
# than through a locale: a shell builtin's printf does not group under
# LC_NUMERIC on macOS, and the figures here run into six digits.
# The same figure, written by psql inside a table: 12 345,67. The mask has no
# FM, so to_char pads it to a fixed width and a column of amounts reads as one
# - and unlike lpad(), a wider figure is never truncated (that would silently
# drop the cents, then the euros); beyond 999 999,99 it prints as # instead,
# which is a hundred times the takings of a till.
eur_sql() {
  printf "translate(to_char(coalesce(%s,0), '999G990D00'), ',.', ' ,')" "$1"
}
eur() {
  awk -v n="${1:-0}" 'BEGIN {
    sign = (n < 0) ? "-" : ""; if (n < 0) n = -n
    split(sprintf("%.2f", n), part, ".")
    whole = part[1]; grouped = ""
    while (length(whole) > 3) {
      grouped = " " substr(whole, length(whole) - 2) grouped
      whole = substr(whole, 1, length(whole) - 3)
    }
    printf "%s%s%s,%s \342\202\254", sign, whole, grouped, part[2]
  }'
}

printf '\n%s=== The day so far ===%s\n' "$BLD" "$RST"

if [ "$(container_health "$DB_CONTAINER")" != healthy ]; then
  bad "The database is not healthy - no figures to show"
  info "Run ./scripts/status.sh to see why"
  printf '\n'
  exit 1
fi

# Every count below ignores what was deleted: a deleted article never existed
# as far as the day is concerned, and a deleted sale was rung up by mistake.
LIVE_ARTICLES="deleted_at is null and status <> 'DELETED'"

say "Deposits"
if ! read -r FICHES PARTICULIERS PROS < <(q "
  select count(*), count(*) filter (where type='PARTICULIER'),
         count(*) filter (where type='PRO')
  from deposits where deleted_at is null"); then
  bad "Could not read the database"
  exit 1
fi
read -r ARTICLES ARTICLES_VALUE < <(q "
  select count(*), coalesce(sum(price),0) from articles where $LIVE_ARTICLES")
ok "$FICHES fiches — $PARTICULIERS particulier(s), $PROS professionnel(s)"
ok "$ARTICLES articles deposited, worth $(eur "$ARTICLES_VALUE")"

say "Professionals' reception"
read -r PRO_PENDING PRO_RECEIVED PRO_TOTAL < <(q "
  select count(*) filter (where a.status='RECEPTION_PENDING'),
         count(*) filter (where a.status<>'RECEPTION_PENDING'),
         count(*)
  from articles a join deposits d on d.id = a.deposit_id
  where a.$LIVE_ARTICLES and d.deleted_at is null and d.type='PRO'")
if [ "${PRO_TOTAL:-0}" -eq 0 ]; then
  warn "No professional article in the base"
else
  ok "$PRO_RECEIVED received, $PRO_PENDING still to check in (of $PRO_TOTAL)"
  qtable "
    select d.depot_index as \"Fiche\",
           upper(c.last_name) as \"Professionnel\",
           count(a.id) filter (where a.status<>'RECEPTION_PENDING') as \"Réceptionnés\",
           count(a.id) filter (where a.status='RECEPTION_PENDING') as \"À réceptionner\",
           count(a.id) as \"Total\"
    from deposits d
    join contacts c on c.id = d.seller_id
    left join articles a on a.deposit_id = d.id and a.$LIVE_ARTICLES
    where d.type='PRO' and d.deleted_at is null
    group by 1, 2 order by 1"
fi

say "On the shelves"
read -r FOR_SALE PENDING SOLD SOLD_VALUE RETURNED < <(q "
  select count(*) filter (where status='RECEPTION_OK' and sale_id is null),
         count(*) filter (where status='RECEPTION_PENDING'),
         count(*) filter (where status='SOLD'),
         coalesce(sum(price) filter (where status='SOLD'),0),
         count(*) filter (where status='RETURNED')
  from articles where $LIVE_ARTICLES")
ok "$FOR_SALE for sale, $PENDING not received yet"
ok "$SOLD sold, worth $(eur "$SOLD_VALUE")"
[ "${RETURNED:-0}" -gt 0 ] && info "$RETURNED handed back to their seller"

say "Sales"
read -r SALES CASH CARD CHECK DEFERRED < <(q "
  select count(*), coalesce(sum(cash_amount),0), coalesce(sum(card_amount),0),
         coalesce(sum(check_amount),0), coalesce(sum(deferred_amount),0)
  from sales where deleted_at is null")
read -r REFUNDS REFUNDED < <(q "
  select count(*), coalesce(sum(cash_amount + card_amount),0)
  from refunds where deleted_at is null")
TAKEN=$(q "
  select coalesce(sum(cash_amount + card_amount + check_amount + deferred_amount),0)
  from sales where deleted_at is null")
ok "$SALES sale(s) — $(eur "$TAKEN") rung up, $REFUNDS refund(s) for $(eur "$REFUNDED")"
info "espèces $(eur "$CASH")  CB $(eur "$CARD")  chèques $(eur "$CHECK")  différé $(eur "$DEFERRED")"
if [ "${SALES:-0}" -gt 0 ] || [ "${REFUNDS:-0}" -gt 0 ]; then
  # A refund belongs to the register that handed the money over, which is not
  # always the one that rang the sale up - hence the full join.
  qtable "
    with v as (
      select increment_start c, count(*) n,
             coalesce(sum(cash_amount),0) esp, coalesce(sum(card_amount),0) cb,
             coalesce(sum(check_amount),0) chq, coalesce(sum(deferred_amount),0) dif
      from sales where deleted_at is null group by 1
    ), r as (
      select increment_start c, count(*) n,
             coalesce(sum(cash_amount + card_amount),0) tot
      from refunds where deleted_at is null group by 1
    )
    select coalesce(v.c, r.c) as \"Caisse\",
           coalesce(v.n, 0) as \"Ventes\",
           $(eur_sql v.esp) as \"Espèces\",
           $(eur_sql v.cb) as \"CB\",
           $(eur_sql v.chq) as \"Chèques\",
           $(eur_sql v.dif) as \"Différé\",
           coalesce(r.n, 0) as \"Remb.\",
           $(eur_sql r.tot) as \"Remboursé\"
    from v full outer join r on r.c = v.c
    order by 1"
fi

printf '\n'
