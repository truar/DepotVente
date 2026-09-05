# Scripts Backend

Scripts utilitaires pour tester et peupler la base de données.

## 📝 Scripts disponibles

### 1. `create-user.ts` - Créer un utilisateur

Crée un utilisateur dans la base de données.

> ⚠️ Les options sont séparées par un **espace** (`--email admin@cmr.com`), pas
> par un `=`. Le parseur découpe les arguments par paires `--clé valeur`.

```bash
# Depuis la racine du monorepo
pnpm --filter backend script:create-user --email admin@cmr.com --password admin --role ADMIN

# Depuis le dossier backend
pnpm script:create-user --email admin@cmr.com --password admin --role ADMIN

# Ou directement avec tsx
tsx src/scripts/create-user.ts --email admin@cmr.com --password admin --role ADMIN
```

**Options:**
- `--email` (requis) - Email
- `--password` (requis) - Mot de passe (sera hashé avec bcrypt)
- `--role` - `ADMIN` | `BENEVOLE` (défaut : `BENEVOLE`)

### 2. `create-sales.ts` - Créer des ventes en batch

Crée un nombre défini de ventes avec un délai entre chaque.

```bash
# Créer 5 ventes (défaut)
pnpm script:create-sales

# Créer 10 ventes avec 1 seconde entre chaque
pnpm script:create-sales -- --count=10 --delay=1000

# Créer 20 ventes avec des montants entre 50€ et 500€
pnpm script:create-sales -- --count=20 --min=50 --max=500
```

**Options:**
- `--count=<number>` - Nombre de ventes à créer (défaut: 5)
- `--delay=<ms>` - Délai entre chaque vente en millisecondes (défaut: 2000)
- `--min=<amount>` - Montant minimum (défaut: 10)
- `--max=<amount>` - Montant maximum (défaut: 200)
- `--help` - Afficher l'aide

### 3. `simulate-sales.ts` - Simuler des ventes en continu

Simule des ventes en temps réel de manière continue. **Parfait pour tester le dashboard live !**

```bash
# Simulation infinie (Ctrl+C pour arrêter)
pnpm script:simulate

# Simulation avec une vente toutes les 2 secondes
pnpm script:simulate -- --interval=2000

# Simulation pendant 60 secondes
pnpm script:simulate -- --interval=1000 --duration=60

# Simulation avec des montants élevés
pnpm script:simulate -- --min=100 --max=1000
```

**Options:**
- `--interval=<ms>` - Intervalle entre chaque vente en millisecondes (défaut: 3000)
- `--min=<amount>` - Montant minimum (défaut: 10)
- `--max=<amount>` - Montant maximum (défaut: 200)
- `--duration=<sec>` - Durée de la simulation en secondes (défaut: 0 = infini)
- `--help` - Afficher l'aide

**Appuyez sur Ctrl+C pour arrêter la simulation**

### 4. `import/import.ts` - Importer les données historiques

Importe les données de l'ancienne bourse depuis les fichiers `.tsv` du dossier
`src/scripts/import/` (dépôts, articles, acheteurs, ventes, pré-dépôts, caisses).

```bash
# Depuis la racine du monorepo
pnpm --filter backend script:import

# Depuis le dossier backend
pnpm script:import

# Ou directement avec tsx
tsx src/scripts/import/import.ts
```

> ⚠️ Le script **n'efface pas** la base avant d'importer : il ne fait
> qu'insérer. Pour repartir d'une base propre, lance d'abord `db:reset`
> (voir ci-dessous).

**Options :**
- `--depot-state` - Importe uniquement l'**état de fin de dépôt** (voir plus bas)

#### Mode `--depot-state`

Rejoue l'export en s'arrêtant à la fin de la phase de dépôt, pour répéter la
journée à partir d'une base « tout est déposé, rien n'est vendu ».

```bash
pnpm --filter backend script:import --depot-state
```

Ce que le mode change :

| | Import complet | `--depot-state` |
|---|---|---|
| Ventes / acheteurs | importées | **aucune** |
| Articles vendus (`SOLD`) | importés | **aucun** |
| Contrôles de caisse (dépôt **et** vente) | importés | **aucun** |
| Chèques rendus (`checkId`, `collectedAt`, `signatory`, `collectWorkstationId`, `clubAmount`) | importés | **vides** |
| Dépôts, articles, pré-dépôts | importés | importés |
| Statut des articles particuliers | `RECEPTION_PENDING` | `RECEPTION_OK` |
| Statut des articles pro | `RECEPTION_PENDING` | colonne `ReceptOK` de l'export |

**Articles réservés pour tester le scan.** Les fiches pro listées dans
`PENDING_PRO_DEPOSIT_INDEXES` (par défaut `2` = PERRILLAT et `3` = ALLOSKI)
gardent exactement `PENDING_ARTICLES_PER_PRO` articles (par défaut 30) en
`RECEPTION_PENDING` — leurs 30 derniers articles du fichier, donc la sélection
est déterministe et un ré-import redonne le même lot. Le reste de ces fiches
passe en `RECEPTION_OK`. Les deux constantes sont en haut de `import/import.ts`.

Les autres fiches pro suivent la colonne `ReceptOK` de l'export : elles ont
donc quelques articles réellement non réceptionnés en 2025 (9 au total sur les
fiches 4, 8 et 9), qui apparaîtront eux aussi dans la planche de codes-barres.

### 5. `pro-barcodes/generate.ts` - Planche de codes-barres à scanner

Génère une page HTML avec un code-barres **Code 128** par article pro encore en
`RECEPTION_PENDING`, groupés par fiche. Sert à répéter la partie humaine de la
réception pro : on imprime la planche, et on scanne les codes un par un dans
l'écran « Réceptionner les articles des pros ».

```bash
# Sortie par défaut : tmp/pro-barcodes.html (dossier ignoré par git)
pnpm --filter backend script:pro-barcodes

# Ailleurs
pnpm --filter backend script:pro-barcodes --output ~/Desktop/planche.html
```

**Options :**
- `--output <chemin>` - Fichier HTML à écrire (défaut : `tmp/pro-barcodes.html`)

Les codes-barres sont des images PNG embarquées en `data:` URI : la page
s'imprime telle quelle depuis le navigateur, et un copier-coller vers Word
emmène les images avec lui.

Le code encodé est exactement le `code` de l'article (`2026 2A`, espace
comprise), celui que cherche `articlesDb.findByCode` — c'est le même Code 128
que les étiquettes Dymo.

## 🗄️ Réinitialiser & importer la base

Les commandes Prisma vivent dans le package `database` (pas `backend`).

```bash
# Réinitialiser la base : drop + rejoue les migrations
pnpm --filter database db:reset
```

**Séquence recommandée pour repartir de zéro :**

```bash
# 1. Réinitialiser la base (drop + migrations)
pnpm --filter database db:reset

# 2. Régénérer le client Prisma (si le schéma a changé)
pnpm --filter database db:generate

# 3. Créer l'utilisateur admin
pnpm --filter backend script:create-user --email admin@cmr.com --password admin --role ADMIN

# 4. Importer les données historiques
pnpm --filter backend script:import
```

**Autres commandes `database` disponibles :**
- `db:push` - Pousse le schéma vers la base sans migration
- `db:migrate` - Applique les migrations (`prisma migrate deploy`)
- `db:migrate:dev` - Crée/applique une migration en dev
- `db:generate` - Régénère le client Prisma
- `db:studio` - Ouvre Prisma Studio

## 🧪 Tester le Dashboard en Temps Réel

Pour voir le dashboard se mettre à jour automatiquement :

1. **Connecte-toi au dashboard admin**
   ```bash
   # Frontend doit être lancé
   cd apps/frontend
   pnpm dev
   ```

   Ouvre http://localhost:5173/admin et connecte-toi

2. **Lance le backend**
   ```bash
   cd apps/backend
   pnpm dev
   ```

3. **Dans un autre terminal, lance la simulation**
   ```bash
   cd apps/backend

   # Simulation rapide (1 vente par seconde)
   pnpm script:simulate -- --interval=1000

   # Ou simulation normale (1 vente toutes les 3 secondes)
   pnpm script:simulate
   ```

4. **Observe le dashboard** 📊
   - Les statistiques se mettent à jour automatiquement toutes les 5 secondes
   - Le CA du jour augmente en temps réel
   - Le compteur de ventes s'incrémente
   - L'indicateur "Temps réel actif" (point vert) montre que le polling fonctionne

## 🎯 Scénarios de Test

### Scénario 1 : Test rapide
```bash
# Créer 10 ventes rapidement (1 vente par seconde)
pnpm script:create-sales -- --count=10 --delay=1000
```

### Scénario 2 : Simulation continue
```bash
# Laisser tourner pendant 2 minutes
pnpm script:simulate -- --interval=2000 --duration=120
```

### Scénario 3 : Grosses transactions
```bash
# Simuler des ventes de ski haut de gamme
pnpm script:simulate -- --min=200 --max=1500 --interval=5000
```

## ⚙️ Fonctionnement

Les scripts créent automatiquement les dépendances nécessaires si elles n'existent pas :
- ✅ Event (événement actif)
- ✅ Workstation (station de travail)
- ✅ Checkout (caisse)
- ✅ User (utilisateur)

Chaque vente générée contient :
- Un montant total aléatoire
- Une répartition aléatoire entre cash, carte et chèque
- La date/heure actuelle (pour les stats du jour)

## 🔍 Vérifier les Données

```bash
# Se connecter à la base de données
psql $DATABASE_URL

# Voir les ventes du jour
SELECT COUNT(*), SUM(total_amount) FROM sales WHERE sale_at >= CURRENT_DATE;

# Voir les dernières ventes
SELECT id, total_amount, sale_at FROM sales ORDER BY sale_at DESC LIMIT 10;
```
