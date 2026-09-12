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

### 2. `import/import.ts` - Importer les données historiques

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
`PENDING_PRO_DEPOSIT_INDEXES` (par défaut `2` = PERRILLAT, `3` = ALLOSKI et
`4` = SPORT)
gardent, pour chaque catégorie de `PENDING_PRO_CATEGORIES` (par défaut `Skis`,
`Chaussures` et `Bâtons`), exactement `PENDING_ARTICLES_PER_CATEGORY` articles
(par défaut 30) en `RECEPTION_PENDING` — soit trois lots de 30 par fiche,
leurs 30 derniers de chaque catégorie dans le fichier, donc la sélection est
déterministe et un ré-import redonne le même lot. Le reste de ces fiches passe
en `RECEPTION_OK`. Les trois constantes sont en haut de `import/import.ts`.

Les autres fiches pro suivent la colonne `ReceptOK` de l'export : elles ont
donc quelques articles réellement non réceptionnés en 2025 (9 au total sur les
fiches 4, 8 et 9), qui apparaîtront eux aussi dans la planche de codes-barres.

### 3. `pro-barcodes/generate.ts` - Planche de codes-barres à scanner

Génère une page HTML avec un code-barres **Code 128** par article pro encore en
`RECEPTION_PENDING`, groupés par fiche puis par catégorie. Sert à répéter la
partie humaine de la réception pro : on imprime la planche, et on scanne les
codes un par un dans l'écran « Réceptionner les articles des pros ».

La planche ajoute un échantillon d'articles **particuliers** invendus
(`RECEPTION_OK`), pour répéter un passage en caisse : par défaut 30 articles,
**un seul par vendeur**, tirés en tournant sur les catégories (un ski, une
chaussure, un vêtement, ...) pour mélanger vendeurs et rayons. Les
pseudo-catégories `Zabsent` et `Zrefusé` sont exclues.

```bash
# Sortie par défaut : tmp/pro-barcodes.html (dossier ignoré par git)
pnpm --filter backend script:pro-barcodes

# Ailleurs
pnpm --filter backend script:pro-barcodes --output ~/Desktop/planche.html
```

**Options :**
- `--output <chemin>` - Fichier HTML à écrire (défaut : `tmp/pro-barcodes.html`)
- `--particuliers <N>` - Nombre d'articles particuliers dans l'échantillon (défaut : 30, `0` pour la planche pro seule)

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

# 3. Importer les données historiques
pnpm --filter backend script:import
```

`db:reset` recrée au passage les deux comptes de service (`prisma/seed.ts`) :
`admin@cmr.com` / `admin` (ADMIN) et `benevole@cmr.com` / `benevole`
(BENEVOLE). `pnpm --filter database db:seed` les remet sur une base déjà en
place, sans rien effacer. `script:create-user` reste là pour un compte
supplémentaire.

**Autres commandes `database` disponibles :**
- `db:push` - Pousse le schéma vers la base sans migration
- `db:migrate` - Applique les migrations (`prisma migrate deploy`)
- `db:migrate:dev` - Crée/applique une migration en dev
- `db:generate` - Régénère le client Prisma
- `db:studio` - Ouvre Prisma Studio
- `db:seed` - (Re)crée les comptes admin et bénévole

## Où lancer ces scripts

Depuis le dépôt, avec `tsx` : le dossier `src/scripts` est exclu de l'image
Docker (`.dockerignore`) et du build Nest (`tsconfig.build.json`), donc ces
commandes ne s'exécutent pas dans le conteneur. Elles lisent `DATABASE_URL`
depuis `packages/database/.env` (le client Prisma charge ce fichier).
