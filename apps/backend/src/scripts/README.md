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
`PENDING_PRO_DEPOSIT_INDEXES` (par défaut les fiches `2`, `3` et `4`)
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

À l'impression, **chaque groupe pro (fiche × catégorie) commence sur une page
neuve**, et la partie particuliers aussi : on scanne une catégorie d'une traite
sans qu'un autre lot traîne en bas de la feuille. L'échantillon particulier
reste un seul groupe, qui coule sur autant de pages qu'il faut.

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

### 4. `import/import-predeposits-form.ts` - Importer les pré-dépôts du Google Form

Importe l'export CSV des réponses au formulaire « Pré-enregistrement bourse au
ski », à lancer **une seule fois, le matin de la bourse**. Les pré-dépôts sont
créés sans dépôt associé ; les postes les reçoivent à leur prochain poll.

```bash
# 1. Simulation : rien n'est écrit, affiche les fiches, les doublons et ce qui bloque
pnpm --filter backend script:import-predeposits "tmp/Réponses.csv"

# 2. Arbitrer les doublons signalés, puis importer
pnpm --filter backend script:import-predeposits "tmp/Réponses.csv" --merge 57,58 --skip 61 --apply
```

Le chemin est relatif au dossier depuis lequel on lance `pnpm`.

**Options :**
- `--apply` - Écrit en base (une transaction : tout ou rien). Sans lui, simulation.
- `--merge a,b` - Fusionne ces réponses en une seule fiche : articles à la suite, coordonnées de la réponse la plus récente.
- `--keep a,b` - Garde ces réponses comme fiches distinctes.
- `--skip a` - Ignore ces réponses.

Les numéros sont ceux de la simulation (« réponse n » = rang dans le CSV, en-tête
exclu). Deux réponses qui partagent un téléphone, un email ou un nom + prénom
sont des doublons : `--apply` refuse tant que chacune n'est pas arbitrée.

**Mapping :**

| Formulaire | Pré-dépôt |
|---|---|
| Nom / Prénom | `NOM` en majuscules / `Prénom` capitalisé |
| Portable | chiffres seuls (`06.31.14.41.54` → `0631144154`), `+33`/`0033` remplacé par `0`, `0` initial remis sur 9 chiffres (`673999680` → `0673999680`) ; signalé s'il n'a toujours pas 10 chiffres |
| Ville | ramenée à `types/cities.ts` (`Saint Félix` → `ST FELIX`, `Menthonnex-sous-Clermont` → `MENTHONNEX` via `CITY_ALIASES`), sinon en majuscules et signalée |
| Type de matériel | `Vêtements de ski` → `Vêtement`, le reste ramené à `types/categories.ts` sans casse ni accent (`Batons` → `Bâtons`) |
| Discipline | `Randonnée Pédestre/Alpine` → `Rando Pédestre/Alpine`, le reste ramené à `types/disciplines.ts` sans casse ni accent (`Telemark` → `Télémark`) |
| Marque | ramenée à `types/brands.ts` sans casse ni accent (`SALOMON` → `Salomon`, alias dans `import/predeposit-brand.ts`). Si une partie seulement du champ est une marque, on la garde et le reste passe à la suite du descriptif (`ALPINA AJ 3` → `Alpina`, « AJ 3 » au descriptif), signalé (« 🏷️ Marques trouvées dans une partie du champ ») ; sinon **bloque** |
| Couleur | ramenée à `types/colors.ts` quand c'est une seule couleur (`Bleue` → `Bleu`), sinon gardée et signalée |
| Taille | ne garde que les mots d'une taille (liste exhaustive dans `import/predeposit-size.ts` : XS…XXXL, TU, cm, mm, ans, mois, EU/US/UK, Bébé, Naissance), chiffres et séparateurs compris ; `Taille unique` → `TU`, `80 cms` → `80cm`, `4A`/`8ans` → `4 ans`/`8 ans`, `18M` → `18 mois`. Les autres mots (`Pointure`, un nom de modèle…) sont retirés et signalés (« ✂️ Tailles raccourcies ») |
| Descriptif / Prix | modèle / prix, tels quels |

Les fiches sont numérotées par ordre alphabétique (nom puis prénom) à la suite
du plus grand numéro de pré-dépôt en base ; les articles prennent les lettres
A, B, C… dans l'ordre du formulaire. Un type de matériel, une discipline ou
une marque hors liste, un prix illisible ou un téléphone déjà présent en base
bloquent `--apply` : ce dernier cas empêche un second passage du script.

Chaque champ ramené à une liste est comparé à cette liste **après** le mapping,
alias compris. Type de matériel, discipline et marque sont des listes fermées
au poste : une valeur absente s'y afficherait vide, donc elle bloque. Ville et
couleur sont des suggestions : une valeur absente reste lisible, la simulation
la signale avec sa réponse et son article (« 🔎 Hors liste ») pour qu'on la
corrige dans le CSV si besoin.

Pour chaque valeur hors liste, le script propose la plus proche
(`marque « Rossigol » absente de la liste → Rossignol ?`) : distance de
Damerau-Levenshtein sur les formes sans casse ni accent, une inversion de deux
lettres comptant pour une faute. Seuil : 1 faute jusqu'à 4 lettres, une de plus
par tranche de 4, 3 au plus ; rien n'est proposé au-delà, ni quand plus de
trois valeurs sont à égalité. Il propose, il ne corrige pas : la correction se
fait dans le CSV.

Le CSV doit être l'export UTF-8 de Google. Un fichier qui n'est pas en UTF-8,
ou dont les accents ont été décodés deux fois (`ValÃ©rie`), arrête le script
avant toute lecture : c'est le signe qu'il a été réenregistré dans Excel, il
faut retélécharger l'export.

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
