#!/usr/bin/env bash
#
# Ouvre l'écran de supervision du jour : une grille tmux qui montre l'état du
# serveur, les postes clients et les journaux en même temps.
#
#   ./scripts/supervision.sh          # ouvre (ou rouvre) la grille
#   ./scripts/supervision.sh --2x4    # 8 volets, 2 colonnes de 4
#   ./scripts/supervision.sh --stop   # ferme tout
#
# Disposition, sur deux colonnes :
#
#   ┌──────────────────────────┬──────────────────────────┐
#   │                          │ postes clients (10 s)    │
#   │  état du serveur         ├──────────────────────────┤
#   │  (status.sh, 30 s)       │ requêtes en direct       │
#   │                          ├──────────────────────────┤
#   │  39 lignes : il lui faut │ conteneurs (10 s)        │
#   │  toute la hauteur        ├──────────────────────────┤
#   │                          │ ressources (docker stats)│
#   └──────────────────────────┴──────────────────────────┘
#
# status.sh occupe la colonne entière parce qu'il sort 39 lignes : dans un
# huitième d'écran il serait tronqué aux deux tiers. Les trois autres vues
# ponctuelles tiennent en 5 à 11 lignes.
#
# Ctrl-b puis :  flèches = changer de volet · z = zoomer · d = détacher
# Détacher laisse tout tourner ; ./scripts/supervision.sh rattache.
#
set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
SESSION=bourse

command -v tmux >/dev/null || {
  echo "tmux n'est pas installé.  brew install tmux" >&2; exit 1
}

LAYOUT=colonne
[ "${1:-}" = "--2x4" ] && { LAYOUT=2x4; shift; }

if [ "${1:-}" = "--stop" ]; then
  tmux kill-session -t "$SESSION" 2>/dev/null && echo "Grille fermée." \
    || echo "Aucune grille ouverte."
  exit 0
fi

# `exec tmux attach` n'a de sens que depuis un terminal. Appelé autrement (test,
# script, hook), on laisse la grille prête et on dit comment la rejoindre.
attach() {
  [ -t 1 ] && exec tmux attach -t "$SESSION"
  echo "Grille prête. Rejoignez-la avec :  tmux attach -t $SESSION"
}

# Déjà ouverte : on rattache au lieu d'empiler une deuxième grille.
if tmux has-session -t "$SESSION" 2>/dev/null; then
  attach
  exit 0
fi

W="$REPO/scripts/watch.sh"

# -x/-y : une session détachée naîtrait en 80x24 et les volets seraient calculés
# sur cette taille. tmux réajuste à l'attachement, mais partir large évite des
# volets nés trop courts pour leur contenu.
tmux new-session -d -s "$SESSION" -x 240 -y 60 \
  "$W -n 30 $REPO/scripts/status.sh"

# Colonne de droite, puis découpe en quatre. Les pourcentages décroissants
# (75 → 66 → 50) partagent le reste en parts égales, et chaque split rend le
# nouveau volet actif : pas d'index à calculer.
tmux split-window -h -t "$SESSION" "$W -n 10 pnpm --silent traces postes"
tmux split-window -v -l 75% -t "$SESSION" "pnpm --silent traces tail"
tmux split-window -v -l 66% -t "$SESSION" "$W -n 10 docker compose ps"
tmux split-window -v -l 50% -t "$SESSION" "docker stats"

# Le 2×4 demandé : la colonne de gauche se découpe aussi en quatre. status.sh y
# est forcément tronqué (39 lignes pour ~14), d'où le volet libre en bas pour
# le relancer en pleine hauteur au besoin (Ctrl-b z zoome).
if [ "$LAYOUT" = 2x4 ]; then
  tmux select-pane -t "$SESSION:0.0"
  tmux split-window -v -l 75% -t "$SESSION" "$W -n 20 pnpm --silent traces epochs"
  tmux split-window -v -l 66% -t "$SESSION" "$W -n 20 pnpm --silent traces stats"
  tmux split-window -v -l 50% -t "$SESSION" "$SHELL"
fi

tmux select-pane -t "$SESSION:0.0"
attach
