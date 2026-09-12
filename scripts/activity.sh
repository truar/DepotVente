#!/usr/bin/env bash
#
# What the day has produced, read from the server database.
#
#   ./scripts/activity.sh                 # the figures of the day
#   ./scripts/activity.sh --depot         # + what each register took in
#   ./scripts/activity.sh --ventes        # + what each register rang up
#   ./scripts/activity.sh --pro           # + the professionals' reception
#   ./scripts/activity.sh --tout          # all three tables
#   ./scripts/activity.sh --watch [s]     # re-run continuously
#
# Health is status.sh's job (services, certificate, backups) and the client
# PCs are traces.mjs's (`pnpm traces postes`). This is the count of the sale
# itself: what was deposited, what the professionals still owe us, what is on
# the shelves, what has been sold, and what each cash register took.
#
# The per-register tables sit behind flags so the default output stays short
# enough to leave in a watch pane; --tout is the full picture.
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

SHOW_DEPOT=no
SHOW_VENTES=no
SHOW_PRO=no
WATCH=no
INTERVAL=15
PASSTHRU=()

usage() { sed -n '2,20p' "$0" | sed 's/^#//;s/^ //'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --depot)  SHOW_DEPOT=yes;  PASSTHRU+=("$1"); shift ;;
    --ventes) SHOW_VENTES=yes; PASSTHRU+=("$1"); shift ;;
    --pro)    SHOW_PRO=yes;    PASSTHRU+=("$1"); shift ;;
    --tout)   SHOW_DEPOT=yes; SHOW_VENTES=yes; SHOW_PRO=yes; PASSTHRU+=("$1"); shift ;;
    --watch)
      WATCH=yes
      case "${2:-}" in
        ''|-*) ;;
        *) INTERVAL="$2"
           case "$INTERVAL" in ''|*[!0-9]*) bad "--watch attend un nombre de secondes"; exit 1 ;; esac
           [ "$INTERVAL" -lt 1 ] && { bad "--watch doit valoir au moins 1 seconde"; exit 1; }
           shift ;;
      esac
      shift ;;
    -h|--help) usage 0 ;;
    *) bad "Option inconnue : $1"; usage 1 ;;
  esac
done

# --watch [seconds]: re-run continuously. macOS has no `watch` command, so the
# script loops over itself rather than depending on one. The flags are handed
# back to each run, otherwise the loop would drop the requested tables.
if [ "$WATCH" = yes ]; then
  while true; do
    clear
    "$0" ${PASSTHRU[@]+"${PASSTHRU[@]}"} || true
    printf '  %s — rafraîchi toutes les %ss, Ctrl-C pour arrêter\n\n' "$(date +%H:%M:%S)" "$INTERVAL"
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
    warn "Requête en échec :"
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
  # LC_ALL=C is required: under a French locale awk's %.2f returns
  # "188040,66", the split on "." finds nothing, and the grouping loop chops
  # the cents separator off as a thousands group - printing "188 040 ,66, €".
  # The euro sign goes out as raw octal bytes, so the C locale does not hurt.
  LC_ALL=C awk -v n="${1:-0}" 'BEGIN {
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

printf '\n%s=== La journée jusqu'"'"'ici ===%s\n' "$BLD" "$RST"

if [ "$(container_health "$DB_CONTAINER")" != healthy ]; then
  bad "La base de données n'est pas saine — aucun chiffre à afficher"
  info "Lancez ./scripts/status.sh pour en connaître la raison"
  printf '\n'
  exit 1
fi

# Every count below ignores what was deleted: a deleted article never existed
# as far as the day is concerned, and a deleted sale was rung up by mistake.
# The prefix is carried by each predicate, not just the first: "a.$LIVE" would
# qualify `deleted_at` and leave `status` bare, which only worked because
# `articles` is the schema's one table with a column of that name.
live_articles() { local a="${1:+$1.}"; printf "%sdeleted_at is null and %sstatus <> 'DELETED'" "$a" "$a"; }
LIVE_ARTICLES="$(live_articles)"

say "Dépôts"
if ! read -r FICHES PARTICULIERS PROS < <(q "
  select count(*), count(*) filter (where type='PARTICULIER'),
         count(*) filter (where type='PRO')
  from deposits where deleted_at is null"); then
  bad "Lecture de la base impossible"
  exit 1
fi
read -r ARTICLES ARTICLES_VALUE < <(q "
  select count(*), coalesce(sum(price),0) from articles where $LIVE_ARTICLES")
ok "$FICHES fiches — $PARTICULIERS particulier(s), $PROS professionnel(s)"
ok "$ARTICLES articles déposés, pour $(eur "$ARTICLES_VALUE")"

say "En rayon"
read -r FOR_SALE PENDING SOLD SOLD_VALUE RETURNED < <(q "
  select count(*) filter (where status='RECEPTION_OK' and sale_id is null),
         count(*) filter (where status='RECEPTION_PENDING'),
         count(*) filter (where status='SOLD'),
         coalesce(sum(price) filter (where status='SOLD'),0),
         count(*) filter (where status='RETURNED')
  from articles where $LIVE_ARTICLES")
ok "$FOR_SALE en vente, $PENDING à réceptionner"
ok "$SOLD vendus, pour $(eur "$SOLD_VALUE")"
[ "${RETURNED:-0}" -gt 0 ] && info "$RETURNED rendus à leur vendeur"

say "Ventes"
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
ok "$SALES vente(s) — $(eur "$TAKEN") encaissés, $REFUNDS remboursement(s) pour $(eur "$REFUNDED")"
info "espèces $(eur "$CASH")  CB $(eur "$CARD")  chèques $(eur "$CHECK")  différé $(eur "$DEFERRED")"

if [ "$SHOW_PRO" = yes ]; then
  say "Réception des professionnels"
  read -r PRO_PENDING PRO_RECEIVED PRO_TOTAL < <(q "
    select count(*) filter (where a.status='RECEPTION_PENDING'),
           count(*) filter (where a.status<>'RECEPTION_PENDING'),
           count(*)
    from articles a join deposits d on d.id = a.deposit_id
    where $(live_articles a) and d.deleted_at is null and d.type='PRO'")
  if [ "${PRO_TOTAL:-0}" -eq 0 ]; then
    warn "Aucun article professionnel en base"
  else
    ok "$PRO_RECEIVED réceptionnés, $PRO_PENDING à réceptionner (sur $PRO_TOTAL)"
    qtable "
      select case when grouping(d.depot_index) = 1 then 'TOTAL'
                  else d.depot_index::text end as \"Fiche\",
             case when grouping(d.depot_index) = 1 then ''
                  else upper(c.last_name) end as \"Professionnel\",
             count(a.id) filter (where a.status<>'RECEPTION_PENDING') as \"Réceptionnés\",
             count(a.id) filter (where a.status='RECEPTION_PENDING') as \"À réceptionner\",
             count(a.id) as \"Total\"
      from deposits d
      join contacts c on c.id = d.seller_id
      left join articles a on a.deposit_id = d.id and $(live_articles a)
      where d.type='PRO' and d.deleted_at is null
      group by rollup((d.depot_index, upper(c.last_name)))
      order by grouping(d.depot_index), min(d.depot_index)"
  fi
fi

if [ "$SHOW_DEPOT" = yes ]; then
  say "Dépôts par caisse"
  # The TOTAL line comes from group by rollup(), in the same query: a total
  # added up in the shell could disagree with the rows above it after a filter
  # changes, and a supervision table whose total does not match its own rows is
  # worse than no total at all.
  #
  # The article counts come from a CTE rather than a join in the outer query:
  # joining articles first would make count(*) count article rows, so every
  # fiche would be counted once per article it holds.
  #
  # "Aujourd'hui" is the activity column. min/max(created_at) would have been
  # the obvious choice but is unusable here: the import carries the source
  # timestamps, so 210 of the 219 fiches are dated October and November 2025
  # and the window would read as nonsense.
  qtable "
    with art as (
      select deposit_id, count(*) n, coalesce(sum(price),0) v
      from articles where $LIVE_ARTICLES group by 1
    )
    select case when grouping(d.deposit_workstation_id) = 1 then 'TOTAL'
                else d.deposit_workstation_id::text end as \"Caisse\",
           count(*) as \"Fiches\",
           count(*) filter (where d.type='PARTICULIER') as \"Particuliers\",
           count(*) filter (where d.type='PRO') as \"Pros\",
           count(*) filter (where d.created_at::date = current_date) as \"Aujourd'hui\",
           coalesce(sum(art.n),0) as \"Articles\",
           $(eur_sql 'sum(art.v)') as \"Valeur\"
    from deposits d
    left join art on art.deposit_id = d.id
    where d.deleted_at is null
    group by rollup(d.deposit_workstation_id)
    order by grouping(d.deposit_workstation_id), min(d.deposit_workstation_id)"
fi

if [ "$SHOW_VENTES" = yes ]; then
  say "Ventes par caisse"
  # A refund belongs to the register that handed the money over, which is not
  # always the one that rang the sale up - hence the full join.
  if [ "${SALES:-0}" -eq 0 ] && [ "${REFUNDS:-0}" -eq 0 ]; then
    warn "Aucune vente ni remboursement pour l'instant"
  else
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
      ), m as (
        select coalesce(v.c, r.c) c,
               coalesce(v.n, 0) n, coalesce(v.esp, 0) esp, coalesce(v.cb, 0) cb,
               coalesce(v.chq, 0) chq, coalesce(v.dif, 0) dif,
               coalesce(r.n, 0) rn, coalesce(r.tot, 0) rtot
        from v full outer join r on r.c = v.c
      )
      select case when grouping(c) = 1 then 'TOTAL' else c::text end as \"Caisse\",
             sum(n) as \"Ventes\",
             $(eur_sql 'sum(esp)') as \"Espèces\",
             $(eur_sql 'sum(cb)') as \"CB\",
             $(eur_sql 'sum(chq)') as \"Chèques\",
             $(eur_sql 'sum(dif)') as \"Différé\",
             sum(rn) as \"Remb.\",
             $(eur_sql 'sum(rtot)') as \"Remboursé\"
      from m
      group by rollup(c)
      order by grouping(c), min(c)"
  fi
fi

printf '\n'
