"""Décode l'export des pros (identifiants numériques) vers notre référentiel.

Entrées, dans le dossier passé en argument :
  - le référentiel des pros : Marque.xlsx, Materiel.xlsx, Type.xlsx ;
  - l'export : un Article <date>.xlsx et un Fiche <date>.xlsx ;
et notre référentiel, lu dans le code de l'app par referentiel.ts : marques
(avec les alias de l'import des pré-dépôts), catégories, disciplines,
couleurs, lettres d'identification.

Sorties, dans le même dossier (hors git : données des pros) :
  - articles-pro.csv : un article par ligne, décodé, avec les valeurs
    d'origine à côté pour relecture. C'est le fichier que lit
    `pnpm --filter backend script:import-pros` ;
  - verification.txt : le rapport de contrôle, aussi affiché.

Usage, depuis la racine du projet (Python 3 avec openpyxl, et pnpm install
fait pour referentiel.ts) :
  python3 apps/backend/src/scripts/import/pros/decode_pro.py tmp/pro
Sort en erreur (code 1) s'il reste un point bloquant.
"""
import collections
import csv
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import openpyxl

SCRIPTS = Path(__file__).resolve().parent
BACKEND = SCRIPTS.parents[3]
if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
    sys.exit('Usage : python3 apps/backend/src/scripts/import/pros/decode_pro.py <dossier des fichiers des pros>')
HERE = Path(sys.argv[1]).resolve()
YEAR = 2026

# Libellés des pros sans équivalent exact (à la casse et aux accents près)
# dans notre référentiel. None : pas d'équivalent, bloquant si un article
# l'utilise.
CATEGORY_NAMES = {
    'Surf': 'Snowboard',
    'Vetements': 'Vêtement',
    'Polaire': 'Vêtement',
    'Lunette': 'Lunettes',
    'Zabsent': None,
    'Zrefusé': None,
}
# Articles rangés par le pro dans une autre catégorie que la nôtre, reconnus à
# leur descriptif (minuscules, sans accent) plutôt qu'à leur code, qui peut
# changer d'un export à l'autre.
RECLASSIFY = [
    # (catégorie décodée, descriptif, notre catégorie, raison)
    ('Chaussures', r'^boots\b', 'Boots', 'boots de snowboard, que les autres pros rangent en Boots'),
    ('Divers', r'^(polaire|gilet dorsal)$', 'Vêtement', 'vêtement rangé en Divers'),
]
DISCIPLINE_NAMES = {
    'RA': 'Rando Alpine',
    'RP': 'Rando Pédestre',
    'Surf': 'Snowboard',
}
# Couleurs au féminin ou au pluriel, comme à l'import des pré-dépôts
# (COLOR_ALIASES d'import-predeposits-form.ts), et en anglais.
COLOR_ALIASES = {
    'bleue': 'Bleu', 'bleus': 'Bleu', 'bleues': 'Bleu',
    'noire': 'Noir', 'noirs': 'Noir', 'noires': 'Noir',
    'grise': 'Gris', 'grises': 'Gris',
    'blanche': 'Blanc', 'blancs': 'Blanc', 'blanches': 'Blanc',
    'verte': 'Vert', 'verts': 'Vert', 'vertes': 'Vert',
    'violette': 'Violet', 'oorange': 'Orange',
    'black': 'Noir', 'white': 'Blanc', 'grey': 'Gris', 'red': 'Rouge',
}
# Saisis dans la colonne Couleur, mais ce n'en sont pas. L'état (« Skis
# occas », « Skis neufs ») est déjà dans le descriptif.
NOT_COLORS = {'occasion', 'neufs', 'snowprotec'}
UNKNOWN_COLOR = '?'


def key_spaced(value):
    """Minuscules, sans accent, espaces gardés."""
    value = unicodedata.normalize('NFD', value)
    return ''.join(c for c in value if not unicodedata.combining(c)).lower()


def key(value):
    value = unicodedata.normalize('NFD', value)
    value = ''.join(c for c in value if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', value.lower())


def load(name):
    path = HERE / name
    rows = list(openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0].iter_rows(values_only=True))
    return [str(h).strip() for h in rows[0]], rows[1:]


def text(value):
    return '' if value is None else str(value)


report = []
blocking = []


def say(line=''):
    report.append(line)


def block(line):
    blocking.append(line)


def section(title):
    say()
    say(f'== {title}')


def check(ok, line):
    """Un contrôle : affiché OK ou bloquant."""
    say(f'  [{"OK" if ok else "KO"}] {line}')
    if not ok:
        block(line)


# ── Référentiel des pros ────────────────────────────────────────────────────

def id_table(name, id_col, name_col):
    head, rows = load(name)
    assert head == [id_col, name_col], f'{name} : colonnes inattendues {head}'
    ids = [r[0] for r in rows]
    check(all(isinstance(i, int) for i in ids), f'{name} : identifiants tous entiers ({len(ids)} lignes)')
    dupes = [i for i, n in collections.Counter(ids).items() if n > 1]
    check(not dupes, f'{name} : identifiants uniques{f" (doublons {dupes})" if dupes else ""}')
    empty = [r[0] for r in rows if not text(r[1]).strip()]
    check(not empty, f'{name} : aucun libellé vide{f" (vides : {empty})" if empty else ""}')
    spaced = [r for r in rows if text(r[1]) != text(r[1]).strip()]
    if spaced:
        say(f'  [i] {name} : espaces en trop retirés : {[(r[0], r[1]) for r in spaced]}')
    return {r[0]: text(r[1]).strip() for r in rows}


section('Référentiel des pros')
materiels = id_table('Materiel.xlsx', 'Id_Materiel', 'Nom_Materiel')
types = id_table('Type.xlsx', 'Id_Type', 'Nom_Type')
marques = id_table('Marque.xlsx', 'Id_Marque', 'Nom_Marque')

# ── Export ──────────────────────────────────────────────────────────────────

ART_COLS = ['Vendeur', 'Id-Article', 'IdentifianArticle', 'Id_Materiel', 'Id_Marque', 'Id_Type', 'Descriptif',
            'N° série', 'Couleur', 'Taille', 'Prix', 'Date', 'Garantie', 'Indice', 'Modèle', 'Prix Péri']
FICHE_COLS = ['Id-Fiche', 'N° Fiche', 'Nom', 'Adresse', 'Cotisation', 'Poste', 'Année', 'Prénom', 'Reglement',
              'Montant Reglement', 'N° CH', 'Heure', 'Poste Retour', 'Signature', 'Heure retour']
def export_file(prefix):
    """L'export porte sa date dans son nom (« Article 26-10-2026.xlsx ») : un seul par dossier."""
    found = sorted(p.name for p in HERE.glob(f'{prefix} *.xlsx') if not p.name.startswith('~$'))
    if len(found) != 1:
        sys.exit(f'Il faut un et un seul fichier « {prefix} <date>.xlsx » dans {HERE}, trouvé : {found or "aucun"}')
    return found[0]


art_file, fiche_file = export_file('Article'), export_file('Fiche')
say(f'Export : {art_file}, {fiche_file}')
art_head, art_rows = load(art_file)
fiche_head, fiche_rows = load(fiche_file)
assert art_head == ART_COLS, f'Article : colonnes inattendues {art_head}'
assert fiche_head == FICHE_COLS, f'Fiche : colonnes inattendues {fiche_head}'
articles = [dict(zip(ART_COLS, r)) for r in art_rows]
fiches = [dict(zip(FICHE_COLS, r)) for r in fiche_rows]

# ── Notre référentiel, lu dans le code de l'app ─────────────────────────────

max_per_fiche = max(collections.Counter(text(a['Vendeur']) for a in articles).values())
ours = json.loads(subprocess.run(
    ['pnpm', 'exec', 'tsx', str(SCRIPTS / 'referentiel.ts')], cwd=BACKEND, check=True, capture_output=True, text=True,
    input=json.dumps({'brands': list(marques.values()), 'letters': max_per_fiche}),
).stdout)
section('Notre référentiel (code de l\'app)')
say(f'  {len(ours["brands"])} marques, {len(ours["categories"])} catégories, {len(ours["disciplines"])} disciplines, '
    f'{len(ours["colors"])} couleurs')


def to_ours(pro_names, ours_list, explicit, what):
    """Libellé des pros → le nôtre : même forme normalisée, sinon table explicite."""
    by_key = {key(v): v for v in ours_list}
    result = {}
    for pro_id, name in pro_names.items():
        if name in explicit:
            result[pro_id] = explicit[name]
            rule = 'table du script'
        else:
            result[pro_id] = by_key.get(key(name))
            rule = 'même nom' if result[pro_id] == name else 'casse/accents'
        target = result[pro_id]
        say(f'  {what} {pro_id:>3} « {name} » → {f"« {target} »" if target else "AUCUN"} ({rule})')
    return result


section('Matériel → catégorie')
category_of = to_ours(materiels, ours['categories'], CATEGORY_NAMES, 'matériel')
section('Type → discipline')
discipline_of = to_ours(types, ours['disciplines'], DISCIPLINE_NAMES, 'type')

section('Marques des pros → notre liste consolidée')
# Par le nom, avec les règles de l'import des pré-dépôts (findBrand : casse,
# accents, alias). Recoupé par l'identifiant avec la table de l'ancien export
# (marques.ts), tenue à jour avec nos écritures officielles : quand le nom ne
# donne rien, l'identifiant tranche.
legacy = {int(i): name for i, name in ours['legacy'].items()}
brand_of = {}
renamed, by_id, missing, conflicts = [], [], [], []
for (pro_id, name), found in zip(marques.items(), ours['found']):
    by_name = found.get('brand') if found['rest'] == '' else None
    old = legacy.get(pro_id) if legacy.get(pro_id) in ours['brands'] else None
    if by_name is not None and old is not None and by_name != old:
        conflicts.append((pro_id, name, by_name, old))
    brand = by_name or old
    brand_of[pro_id] = brand
    if brand is None:
        missing.append((pro_id, name, found.get('brand')))
    elif by_name is None:
        by_id.append((pro_id, name, brand))
    elif brand != name:
        renamed.append((pro_id, name, brand))
say(f'  {len(marques) - len(renamed) - len(by_id) - len(missing)} marques identiques, {len(renamed)} rattachées par le nom '
    f'à notre écriture, {len(by_id)} par l\'identifiant, {len(missing)} absentes')
both = sum(1 for i in marques if i in legacy)
say(f'  {both} identifiants aussi dans la table de l\'ancien export, {len(marques) - both} nouveaux '
    f'({", ".join(str(i) for i in marques if i not in legacy)})')
check(not conflicts, 'le nom et l\'identifiant donnent la même marque'
                     f'{f" — désaccords : {conflicts}" if conflicts else ""}')
used_brands = collections.Counter(a['Id_Marque'] for a in articles)
for pro_id, name, brand in renamed:
    say(f'  [~] {pro_id:>3} « {name} » → « {brand} »')
for pro_id, name, brand in by_id:
    say(f'  [#] {pro_id:>3} « {name} » → « {brand} » (par l\'identifiant) — {used_brands.get(pro_id, 0)} article(s)')
for pro_id, name, partial in missing:
    note = f', « {partial} » trouvé dans une partie seulement' if partial else ''
    say(f'  [?] {pro_id:>3} « {name} » absente de notre liste{note} — {used_brands.get(pro_id, 0)} article(s)')
ours_brand_keys = collections.Counter(key(b) for b in ours['brands'])
check(all(n == 1 for n in ours_brand_keys.values()), 'notre liste : aucune marque en double (à la casse et aux accents près)')

# ── Fiches ──────────────────────────────────────────────────────────────────

section('Fiches')
numbers = [f['N° Fiche'] for f in fiches]
check(len(set(numbers)) == len(numbers), f'{len(fiches)} fiches, numéros uniques : {numbers}')
check(all(isinstance(n, int) and 1 <= n < 1000 for n in numbers),
      'numéros entre 1 et 999 (les fiches des particuliers commencent à 1000 par poste)')
for col, expected in [('Cotisation', 'Ext.1'), ('Année', str(YEAR))]:
    values = collections.Counter(text(f[col]) for f in fiches)
    check(set(values) == {expected}, f'{col} : {dict(values)} (attendu « {expected} » partout)')
for col in ['Prénom', 'Reglement', 'N° CH', 'Poste Retour', 'Signature']:
    values = collections.Counter(text(f[col]) for f in fiches)
    check(set(values) <= {''}, f'{col} vide partout ({dict(values)})')
check({f['Montant Reglement'] for f in fiches} == {0}, 'Montant Reglement à 0 partout')
say(f'  Poste : {dict(collections.Counter(text(f["Poste"]) for f in fiches))}')
fiche_by_number = {f['N° Fiche']: f for f in fiches}

# ── Articles ────────────────────────────────────────────────────────────────

section('Articles : identifiants et codes')
say(f'  {len(articles)} articles')
ids = [a['Id-Article'] for a in articles]
check(len(set(ids)) == len(ids), 'Id-Article unique')
check(ids == sorted(ids), 'Id-Article croissant dans le fichier')
vendors = collections.Counter(text(a['Vendeur']) for a in articles)
unknown_vendor = [v for v in vendors if not v.isdigit() or int(v) not in fiche_by_number]
check(not unknown_vendor, f'chaque Vendeur est une fiche du fichier Fiche{f" (inconnus : {unknown_vendor})" if unknown_vendor else ""}')
for number in numbers:
    count = vendors.get(str(number), 0)
    if count == 0:
        say(f'  [!] fiche {number} ({fiche_by_number[number]["Nom"]}) : aucun article')
bad_code = [a['Id-Article'] for a in articles
            if a['IdentifianArticle'] != f'{YEAR} {a["Vendeur"]}{a["Indice"]}']
check(not bad_code, f'IdentifianArticle = « {YEAR} » + fiche + indice, comme le code de l\'app '
                    f'(generateArticleCode){f" — écarts : {bad_code[:10]}" if bad_code else ""}')
codes = [a['IdentifianArticle'] for a in articles]
check(len(set(codes)) == len(codes), 'codes uniques')
for vendor in sorted(vendors, key=int):
    letters = [a['Indice'] for a in articles if text(a['Vendeur']) == vendor]
    expected = ours['letters'][:len(letters)]
    first_gap = next((i for i, (x, y) in enumerate(zip(letters, expected)) if x != y), None)
    check(letters == expected,
          f'fiche {vendor} : {len(letters)} articles, lettres {letters[0]}…{letters[-1]} sans trou ni doublon, '
          f'dans l\'ordre de l\'app{"" if first_gap is None else f" — écart à la position {first_gap}: {letters[first_gap]} au lieu de {expected[first_gap]}"}')

section('Articles : identifiants du référentiel')
for col, table, mapping, what in [('Id_Materiel', materiels, category_of, 'matériel'),
                                  ('Id_Type', types, discipline_of, 'type'),
                                  ('Id_Marque', marques, brand_of, 'marque')]:
    used = collections.Counter(a[col] for a in articles)
    unknown = sorted(i for i in used if i not in table)
    check(not unknown, f'{col} : {len(used)} valeurs utilisées, toutes dans le référentiel des pros'
                       f'{f" (inconnues : {unknown})" if unknown else ""}')
    unmapped = sorted((i, table[i], used[i]) for i in used if i in table and mapping[i] is None)
    check(not unmapped, f'{col} : toutes rattachées à notre référentiel'
                        f'{f" — sans équivalent : {unmapped} (id, nom, articles)" if unmapped else ""}')

section('Articles : reclassements')
category = {}
for rule in RECLASSIFY:
    rule_hits = []
    for a in articles:
        if a['Id-Article'] in category:
            continue
        desc = ' '.join(re.sub(r'[^a-z0-9]+', ' ', key_spaced(text(a['Descriptif']))).split())
        if category_of.get(a['Id_Materiel']) == rule[0] and re.search(rule[1], desc):
            category[a['Id-Article']] = rule[2]
            rule_hits.append(a)
    codes_hit = ', '.join(f"{a['IdentifianArticle']} « {' '.join(text(a['Descriptif']).split())} »" for a in rule_hits)
    say(f'  {rule[0]} → {rule[2]} ({rule[3]}) : {len(rule_hits)} article(s){f" — {codes_hit}" if rule_hits else ""}')
for a in articles:
    category.setdefault(a['Id-Article'], category_of.get(a['Id_Materiel']))

section('Articles : colonnes inutilisées')
for col, empty in [('Garantie', ''), ('Modèle', ''), ('Prix Péri', 0)]:
    values = collections.Counter(a[col] for a in articles)
    check(set(values) == {empty}, f'{col} : {"vide" if empty == "" else empty} partout ({dict(values)})')
dates = [a['Date'] for a in articles]
say(f'  Date de saisie : du {min(dates)} au {max(dates)} (non reprise)')

section('Articles : textes')
for col in ['Descriptif', 'N° série', 'Couleur', 'Taille']:
    values = [text(a[col]) for a in articles]
    odd = [(a['IdentifianArticle'], v) for a, v in zip(articles, values) if re.search(r'[\t\r\n]', v)]
    check(not odd, f'{col} : aucune tabulation ni retour à la ligne{f" ({odd[:5]})" if odd else ""}')
    spaced = [(a['IdentifianArticle'], v) for a, v in zip(articles, values) if v != v.strip() or '  ' in v]
    if spaced:
        say(f'  [i] {col} : {len(spaced)} valeurs avec espaces en trop, nettoyées : {spaced[:8]}')
    say(f'  {col} : {sum(1 for v in values if v.strip())} renseignés, {sum(1 for v in values if not v.strip())} vides')
both = sum(1 for a in articles if text(a['Descriptif']).strip() and text(a['N° série']).strip())
say(f'  Descriptif et N° série tous deux renseignés : {both}')

section('Articles : prix')
prices = [a['Prix'] for a in articles]
check(all(isinstance(p, (int, float)) for p in prices), 'Prix numérique partout')
check(all(p > 0 for p in prices), f'Prix > 0 partout (min {min(prices)}, max {max(prices)})')
check(all(float(p).is_integer() for p in prices), 'Prix en euros entiers')
by_cat = collections.defaultdict(list)
for a in articles:
    by_cat[category[a['Id-Article']]].append(a['Prix'])
for cat, ps in sorted(by_cat.items(), key=lambda x: str(x[0])):
    ps = sorted(ps)
    say(f'  {cat:<12} {len(ps):>4} articles, {min(ps):>4} à {max(ps):>4} €, médiane {ps[len(ps) // 2]} €')

section('Articles : couleurs')
colors_by_key = {key(c): c for c in ours['colors']}


def color_of(raw):
    raw = ' '.join(text(raw).split()).strip(' .')
    if raw == UNKNOWN_COLOR:
        return '', 'inconnue'
    k = key(raw)
    if k in NOT_COLORS:
        return '', 'pas une couleur'
    if k in colors_by_key:
        return colors_by_key[k], 'liste'
    if k in COLOR_ALIASES:
        return COLOR_ALIASES[k], 'alias'
    # Hors liste : le champ est libre, on garde la saisie avec une majuscule
    # en tête, comme l'import des pré-dépôts.
    return raw[:1].upper() + raw[1:].lower(), 'hors liste'


color_rules = collections.Counter()
off_list = collections.Counter()
changed = collections.Counter()
for a in articles:
    color, rule = color_of(a['Couleur'])
    color_rules[rule] += 1
    if rule == 'hors liste':
        off_list[color] += 1
    elif rule in ('alias', 'pas une couleur'):
        changed[(text(a['Couleur']), color)] += 1
say(f'  {dict(color_rules)}')
say(f'  « ? » → couleur vide ({color_rules["inconnue"]} articles), le formulaire des pros l\'accepte')
for (raw, color), n in sorted(changed.items()):
    say(f'  « {raw} » → {f"« {color} »" if color else "vide"} ({n})')
say(f'  Hors liste, gardées telles quelles ({sum(off_list.values())} articles) : '
    + ', '.join(f'{c} ({n})' for c, n in off_list.most_common()))

section('Articles : catégorie × discipline')
pairs = collections.Counter((category[a['Id-Article']], discipline_of.get(a['Id_Type'])) for a in articles)
for (cat, disc), n in sorted(pairs.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))):
    say(f'  {str(cat):<12} {str(disc):<15} {n:>4}')

section('Articles : tailles vides')
for cat in sorted(set(category.values()), key=str):
    empty = sum(1 for a in articles if category[a['Id-Article']] == cat and not text(a['Taille']).strip())
    if empty:
        say(f'  {cat} : {empty} sans taille')

section('Articles : lignes identiques (hors identifiant et lettre)')
same = collections.Counter(
    tuple(text(a[c]) for c in ['Vendeur', 'Id_Materiel', 'Id_Marque', 'Id_Type', 'Descriptif', 'N° série', 'Couleur',
                               'Taille', 'Prix'])
    for a in articles)
groups = [(k, n) for k, n in same.items() if n > 1]
say(f'  {len(groups)} groupes, {sum(n for _, n in groups)} articles (normal pour des pros : même article en plusieurs exemplaires)')

section('À relire : texte et décodage')
# Le texte saisi par le pro cite-t-il une autre marque que celle décodée ?
# Marques du fichier de 4 lettres ou plus, hors celles qui sont aussi des mots
# courants.
COMMON_WORDS = {'rose', 'racer', 'shred', 'smith', 'electric', 'anon', 'craft', 'head', 'elan', 'line', 'skibag',
                'confortable'}
cited = sorted({b for b in brand_of.values() if b and len(key(b)) >= 4 and key(b) not in COMMON_WORDS
                and any(brand_of.get(a['Id_Marque']) == b for a in articles)}, key=len, reverse=True)
mismatch = []
for a in articles:
    words = ' ' + re.sub(r'[^a-z0-9]+', ' ', key(text(a['Descriptif']) + ' ' + text(a['N° série']).replace('/', ' '))) + ' '
    other = next((b for b in cited if f' {key(b)} ' in words and b != brand_of.get(a['Id_Marque'])), None)
    if other:
        mismatch.append(f'{a["IdentifianArticle"]} : marque {brand_of.get(a["Id_Marque"])}, le texte cite {other}')
say(f'  Texte qui cite une autre marque que celle décodée : {len(mismatch)}')
for line in mismatch:
    say(f'    {line}')
# Le descriptif évoque-t-il une autre catégorie que celle décodée ?
CATEGORY_WORDS = {
    'Vêtement': ['veste', 'pantalon', 'polaire', 'doudoune', 'blouson', 'gilet', 'softshell', 'parka', 'salopette'],
    'Gants': ['gant', 'moufle'], 'Casque': ['casque'], 'Masque Ski': ['masque'], 'Bâtons': ['baton'],
    'Chaussures': ['chaussure'], 'Boots': ['boots', 'apres ski'], 'Housse Ski': ['housse'],
    'Snowboard': ['snowboard'], 'Raquettes': ['raquette'],
}
hints = collections.Counter()
for a in articles:
    words = ' ' + re.sub(r'[^a-z0-9]+', ' ', key(text(a['Descriptif']))) + ' '
    cat = category[a['Id-Article']]
    evoked = sorted(c for c, ws in CATEGORY_WORDS.items() if any(f' {w}' in words for w in ws))
    if evoked and cat not in evoked:
        hints[(cat, ' '.join(text(a['Descriptif']).split()), ', '.join(evoked), text(a['Vendeur']))] += 1
say(f'  Descriptif qui évoque une autre catégorie : {sum(hints.values())} articles')
odd_pairs = [a for a in articles if category[a['Id-Article']] == 'Chaussures' and discipline_of.get(a['Id_Type']) == 'Snowboard']
say(f'  Chaussures en discipline Snowboard (catégorie ou discipline à vérifier) : {len(odd_pairs)}')
for a in odd_pairs:
    say(f"    {a['IdentifianArticle']} {brand_of.get(a['Id_Marque'])} « {' '.join(text(a['Descriptif']).split())} » "
        f"n° série {text(a['N° série'])}, taille {text(a['Taille'])}, {a['Prix']} €")
for (cat, desc, evoked, vendor), n in sorted(hints.items()):
    say(f'    fiche {vendor}, {cat} : {n} × « {desc} » (évoque {evoked})')

# ── Sortie ──────────────────────────────────────────────────────────────────

out = HERE / 'articles-pro.csv'
with out.open('w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['Fiche', 'Vendeur', 'Ville', 'Code', 'Lettre', 'Catégorie', 'Discipline', 'Marque', 'Descriptif',
                'N° série', 'Couleur', 'Taille', 'Prix',
                'Matériel (pro)', 'Type (pro)', 'Marque (pro)', 'Couleur (pro)'])
    for a in articles:
        fiche = fiche_by_number.get(int(a['Vendeur']), {})
        w.writerow([
            a['Vendeur'], text(fiche.get('Nom')).strip(), text(fiche.get('Adresse')).strip(), a['IdentifianArticle'],
            a['Indice'], category[a['Id-Article']] or '', discipline_of.get(a['Id_Type']) or '',
            brand_of.get(a['Id_Marque']) or '', ' '.join(text(a['Descriptif']).split()),
            ' '.join(text(a['N° série']).split()), color_of(a['Couleur'])[0], ' '.join(text(a['Taille']).split()),
            a['Prix'], materiels.get(a['Id_Materiel']), types.get(a['Id_Type']), marques.get(a['Id_Marque']),
            text(a['Couleur']),
        ])

section('Totaux par fiche')
for number in numbers:
    rows = [a for a in articles if text(a['Vendeur']) == str(number)]
    say(f'  fiche {number} {text(fiche_by_number[number]["Nom"]):<16} {len(rows):>4} articles {sum(a["Prix"] for a in rows):>7} €')
say(f'  total            {len(articles):>4} articles {sum(prices):>7} €')

# Contrôle de la sortie : relue, elle redonne chaque article.
with out.open(encoding='utf-8') as f:
    written = list(csv.DictReader(f))
check(len(written) == len(articles) and [r['Code'] for r in written] == codes,
      f'{out.name} : {len(written)} lignes relues, mêmes codes dans le même ordre')
check(sum(int(r['Prix']) for r in written) == sum(prices), f'{out.name} : même total de prix')
check(all(r['Catégorie'] in ours['categories'] and r['Discipline'] in ours['disciplines'] for r in written),
      f'{out.name} : catégories et disciplines toutes dans la liste de l\'app')
unknown_brand_rows = [r['Code'] for r in written if r['Marque'] not in ours['brands']]
check(not unknown_brand_rows, f'{out.name} : marques toutes dans la liste de l\'app'
                              f'{f" — {len(unknown_brand_rows)} articles sans marque reconnue" if unknown_brand_rows else ""}')

section('Bilan')
if blocking:
    say(f'  {len(blocking)} point(s) bloquant(s) :')
    for line in blocking:
        say(f'  - {line}')
else:
    say('  Aucun point bloquant.')

(HERE / 'verification.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))
sys.exit(1 if blocking else 0)
