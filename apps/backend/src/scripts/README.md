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
# 1. Simulation : rien n'est écrit, affiche les fiches, les doublons, et écrit le journal
pnpm --filter backend script:import-predeposits "tmp/Réponses.csv"

# 2. Arbitrer les doublons signalés dans import/predeposit-decisions.ts, puis importer
pnpm --filter backend script:import-predeposits "tmp/Réponses.csv" --apply
```

Le chemin est relatif au dossier depuis lequel on lance `pnpm`.

**Options :**
- `--apply` - Écrit en base (une transaction : tout ou rien). Sans lui, simulation.
- `--corrections=<doc.md>` - Corrections article par article (voir plus bas).

**Corrections du doc.** Le tableau du doc « Descriptifs des pré-dépôts »,
exporté en Markdown dans `tmp/predepot/descriptifs-doc.md`, corrige chaque
article. Une ligne y désigne un article par son N° `réponse.article` (réponse
1 = première ligne sous l'en-tête de l'export, article 1 = premier bloc
rempli). Ses colonnes Catégorie (`Vêtement → Gants` donne `Gants`), Marque et
Taille remplacent la saisie, puis passent par le même mapping qu'elle ; DESC
proposé remplace le descriptif (`—` = vide), le reste du champ marque compris.
`A supprimer` est importé tel quel : l'article refusé reste sur la fiche et le
vendeur l'apprend au dépôt. Les numéros bougent si une ligne du Sheet est
supprimée : une ligne du doc dont le Vendeur ou le DESC originale ne
correspond plus à l'export est écartée, et un article sans ligne garde sa
saisie ; les deux sont notés au journal. Le fichier contient les noms des
vendeurs : il reste dans `tmp/`.

Les vendeurs à prévenir, ceux dont au moins un article est `A supprimer`,
sortent en tableau Markdown, à coller dans le doc :

```bash
pnpm --filter backend script:list-refused-predeposits "tmp/Réponses.csv" --corrections=tmp/predepot/descriptifs-doc.md
```

**Tout s'importe.** Un champ sans correspondance n'arrête pas l'import : un type
de matériel ou une discipline hors liste est importé vide, une marque hors liste
en « ? » (la saisie du vendeur passe en tête du descriptif), un prix illisible à
0. Le formulaire de dépôt exige type, discipline et marque : le bénévole les
complète au poste. Un doublon non arbitré est importé en fiches distinctes.

**Le journal.** Chaque passage, simulation comprise, écrit à côté du CSV un
`<export>-journal.csv` : une ligne par champ que le script n'a pas repris tel
quel (ligne du Sheet, réponse, vendeur, article, champ, valeur saisie, valeur
importée, motif avec la valeur la plus proche quand il y en a une) et par
doublon non arbitré. Il contient les noms des vendeurs : il reste dans `tmp/`.

**Arbitrages :** ils sont codés dans `import/predeposit-decisions.ts`, pas passés
en ligne de commande. Trois listes : `skip` (réponses ignorées), `keep`
(gardées comme fiches distinctes) et `merge` (groupes fusionnés en une fiche :
articles à la suite, coordonnées de la réponse la plus récente). Une réponse y
est repérée par son **horodatage**, la colonne Timestamp de l'export telle
quelle (`10/20/2026 9:20:08`), que la simulation affiche entre parenthèses pour
chaque doublon. Il ne bouge pas quand une ligne du Sheet est ajoutée ou
supprimée, et ne désigne personne : le dépôt est public, donc jamais de nom,
de téléphone ni d'email dans ce fichier. Un horodatage absent de l'export, mal
recopié ou cité deux fois arrête le script : les listes de l'an passé se vident
avant d'importer le formulaire suivant. Un groupe dont il ne reste qu'une
réponse, une fois les autres ignorées, n'a plus rien à arbitrer.

Les réponses d'une **même personne** (mêmes nom, prénom et téléphone, sans
casse ni accent) sont fusionnées d'office en une fiche : articles à la suite,
coordonnées de la plus récente. Si elles ont les mêmes articles (formulaire
renvoyé : même catégorie, discipline, marque, taille et prix, le descriptif et
la couleur ressaisis ne comptent pas), ils ne sont gardés qu'une fois, ceux de
la réponse la plus récente.

Les autres réponses qui partagent un téléphone, un email ou un nom + prénom
sont des doublons, à arbitrer dans `predeposit-decisions.ts` ; sans arbitrage,
elles sont importées en fiches distinctes et notées au journal. La
simulation dit pourquoi, et marque d'un ☎️ les cas où il faut **appeler le
vendeur** : un même téléphone sous deux noms, ou une même personne dont une
partie seulement des articles se répète (renvoi, ou deux objets identiques ?).

**Mapping :**

| Formulaire | Pré-dépôt |
|---|---|
| Nom / Prénom | `NOM` en majuscules / `Prénom` capitalisé |
| Portable | chiffres seuls (`06.31.14.41.54` → `0631144154`), `+33`/`0033` remplacé par `0`, `0` initial remis sur 9 chiffres (`673999680` → `0673999680`) ; signalé s'il n'a toujours pas 10 chiffres |
| Ville | ramenée à `types/cities.ts` (`Saint Félix` → `ST FELIX`, `Menthonnex-sous-Clermont` → `MENTHONNEX` via `CITY_ALIASES`), sinon en majuscules et signalée |
| Type de matériel | `Vêtements de ski` → `Vêtement`, le reste ramené à `types/categories.ts` sans casse ni accent (`Batons` → `Bâtons`) |
| Discipline | `Randonnée Pédestre/Alpine` → `Rando Pédestre/Alpine`, le reste ramené à `types/disciplines.ts` sans casse ni accent (`Telemark` → `Télémark`) |
| Marque | ramenée à `types/brands.ts` sans casse ni accent (`SALOMON` → `Salomon`, alias dans `import/predeposit-brand.ts`). Si une partie seulement du champ est une marque, on la garde et le reste passe à la suite du descriptif (`ALPINA AJ 3` → `Alpina`, « AJ 3 » au descriptif), signalé (« 🏷️ Marques trouvées dans une partie du champ ») ; sinon importée « ? », la saisie en tête du descriptif, et notée au journal |
| Couleur | ramenée à `types/colors.ts` quand c'est une seule couleur (`Bleue` → `Bleu`), sinon gardée et signalée |
| Taille | ne garde que les mots d'une taille (liste exhaustive dans `import/predeposit-size.ts` : XS…XXXL, TU, cm, mm, ans, mois, EU/US/UK, Bébé, Naissance), chiffres et séparateurs compris ; `Taille unique` → `TU`, `80 cms` → `80cm`, `4A`/`8ans` → `4 ans`/`8 ans`, `18M` → `18 mois`. Les autres mots (`Pointure`, un nom de modèle…) sont retirés et signalés (« ✂️ Tailles raccourcies ») |
| Descriptif / Prix | modèle / prix, tels quels |

Les fiches sont numérotées par ordre alphabétique (nom puis prénom) à la suite
du plus grand numéro de pré-dépôt en base ; les articles prennent les lettres
A, B, C… dans l'ordre du formulaire. L'import est itératif : on le relance
sur l'export complet après chaque nouvelle réponse. Une fiche dont le
téléphone est déjà en base (même supprimée) est sautée, seules les nouvelles
sont créées ; si une fiche sautée n'a plus le même nombre d'articles (réponse
renvoyée depuis), c'est signalé et noté au journal, à reporter à la main.
`import-pros.ts` fait de même par numéro de fiche pro.

**Les deux CSV au propre.** Une fois le formulaire clos, `--export=<dossier>`
écrit le résultat de tout ce qui précède (corrections du doc, arbitrages,
fusions, mapping, numérotation à partir de 1) au lieu d'importer :
`predeposants.csv` (Fiche, Nom, Prénom, Téléphone, Ville, Date, Origine) et
`articles.csv` (Fiche, Lettre, Catégorie, Discipline, Marque, Descriptif,
Taille, Couleur, Prix). On les relit et corrige à la main, puis
`import/import-predeposits-csv.ts <dossier>` les importe tels quels :

```bash
pnpm --silent --filter backend exec tsx src/scripts/import/import-predeposits-form.ts \
  ../../tmp/predepot/<export>.csv --corrections=../../tmp/predepot/descriptifs-doc.md \
  --export=../../tmp/predepot/final
pnpm --filter backend script:import-predeposits-csv ../../tmp/predepot/final            # simulation
pnpm --filter backend script:import-predeposits-csv ../../tmp/predepot/final --apply    # écriture
```

L'import des CSV signale une catégorie, une discipline ou une marque hors liste
sans la changer, et s'arrête sans rien écrire sur ce qui rend une fiche
inutilisable : numéro manquant ou en double, nom vide, article d'une fiche
absente, lettre en double, prix illisible (`15`, `15,50` et `15 €` se lisent).
Il est itératif par numéro de fiche (supprimées comprises) : ajouter une fiche
au fichier et relancer n'importe qu'elle. Un tableur doit enregistrer en « CSV
UTF-8 » avec des virgules. `./scripts/prepare-sale-db.sh` importe les pros et
ces deux fichiers (`--new <volume>` la première fois).

Chaque champ ramené à une liste est comparé à cette liste **après** le mapping,
alias compris. Type de matériel, discipline et marque sont des listes fermées
au poste : une valeur absente y est importée vide (« ? » pour la marque) et
notée au journal, et le bénévole la complète au dépôt. Ville et couleur sont des
suggestions : une valeur absente reste lisible, gardée telle quelle et notée au
journal (« 🔎 Hors liste » dans la simulation).

Pour chaque valeur hors liste, le script propose la plus proche
(`marque « Rossigol » absente de la liste → Rossignol ?`) : distance de
Damerau-Levenshtein sur les formes sans casse ni accent, une inversion de deux
lettres comptant pour une faute. Seuil : 1 faute jusqu'à 4 lettres, une de plus
par tranche de 4, 3 au plus ; rien n'est proposé au-delà, ni quand plus de
trois valeurs sont à égalité. Il propose, il ne corrige pas : la proposition est
notée au journal, la correction se fait dans le Sheet ou par un alias.

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
