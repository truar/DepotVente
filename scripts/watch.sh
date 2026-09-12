#!/usr/bin/env bash
#
# Rejouer une commande de supervision en boucle, pour la laisser dans un volet.
#
#   ./scripts/watch.sh ./scripts/status.sh
#   ./scripts/watch.sh -n 10 pnpm traces postes
#   ./scripts/watch.sh -n 5 docker compose ps
#
# macOS ne fournit pas `watch`, et les commandes de supervision du projet sont
# ponctuelles : status.sh, `traces postes`, `errors` et `stats` rendent un
# instantané puis s'arrêtent. Celles qui suivent déjà en continu
# (`traces tail`, backup-loop.sh, `docker stats`) n'ont pas besoin de ceci.
#
# Deux différences avec `watch` qui comptent dans un volet étroit :
#  - la commande est exécutée AVANT d'effacer l'écran, donc pas de clignotement
#    ni d'écran vide pendant les 6 s que prend status.sh ;
#  - la sortie est tronquée à la hauteur du volet, pour que l'affichage reste
#    stable au lieu de défiler.
#
set -uo pipefail          # pas -e : une commande qui échoue ne doit pas
                          # arrêter la surveillance, c'est tout l'intérêt
cd "$(dirname "$0")/.."

INTERVAL=15
RST=$'\033[0m'; BLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; YEL=$'\033[33m'

usage() { sed -n '2,20p' "$0" | sed 's/^#//;s/^ //'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    -n|--interval)
      INTERVAL="${2:?-n attend un nombre de secondes}"
      case "$INTERVAL" in ''|*[!0-9]*) echo "-n attend un entier de secondes" >&2; exit 1 ;; esac
      [ "$INTERVAL" -lt 1 ] && { echo "-n doit valoir au moins 1" >&2; exit 1; }
      shift 2 ;;
    -h|--help) usage 0 ;;
    --) shift; break ;;
    *) break ;;
  esac
done

[ $# -gt 0 ] || usage 1
CMD=("$@")

# Hauteur du volet, relue à chaque tour : tmux peut le redimensionner.
pane_lines() { tput lines 2>/dev/null || echo 24; }

trap 'printf "\n%sSurveillance arrêtée.%s\n" "$DIM" "$RST"; exit 0' INT TERM

RUNS=0
while true; do
  START=$(date +%s)
  OUT="$("${CMD[@]}" 2>&1)"
  CODE=$?
  ELAPSED=$(( $(date +%s) - START ))
  RUNS=$(( RUNS + 1 ))

  # Deux lignes réservées à l'en-tête, une au pied.
  BODY=$(( $(pane_lines) - 3 ))
  [ "$BODY" -lt 5 ] && BODY=5

  printf '\033[H\033[2J'          # curseur en haut + effacement, scrollback gardé
  printf '%s%s%s  %s%s toutes les %ss%s\n' \
    "$BLD" "${CMD[*]}" "$RST" "$DIM" "$(date '+%H:%M:%S')" "$INTERVAL" "$RST"
  # Le saut de ligne est indispensable : sans lui le pied de page se collerait
  # à la dernière ligne de sortie de la commande.
  printf '%s\n' "$OUT" | head -n "$BODY"

  LINES=$(printf '%s\n' "$OUT" | wc -l | tr -d ' ')
  TRUNC=$(( LINES - BODY ))
  [ "$TRUNC" -gt 0 ] && printf '%s… %s lignes de plus (volet trop court)%s\n' "$DIM" "$TRUNC" "$RST"

  [ "$CODE" -ne 0 ] && printf '%scode de sortie %s%s ' "$YEL" "$CODE" "$RST"
  printf '%s%ss · tour %s · Ctrl-C pour arrêter%s\n' "$DIM" "$ELAPSED" "$RUNS" "$RST"

  # Une commande plus lente que l'intervalle tourne en permanence : le dire,
  # sinon quatre volets comme celui-ci occupent un cœur pour rien.
  if [ "$ELAPSED" -ge "$INTERVAL" ]; then
    printf '%s! la commande prend %ss, au-delà de l'"'"'intervalle de %ss — augmentez -n%s\n' \
      "$RED" "$ELAPSED" "$INTERVAL" "$RST"
  fi

  sleep "$INTERVAL"
done
