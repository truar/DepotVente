#!/usr/bin/env tsx
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from 'database';
import { barcodeDataUri } from './code128.js';
import { groupByCategory, sampleAcrossSellersAndCategories } from './sample.js';

// Planche de codes-barres à scanner.
//
// Deux familles, dans le même fichier :
//  - les articles PRO non réceptionnés (RECEPTION_PENDING), groupés par fiche
//    puis par catégorie (l'import --depot-state réserve 30 skis et 30
//    chaussures sur les fiches 2, 3 et 4), qui servent à répéter la partie humaine
//    de la réception pro : on imprime la planche (ou on la colle dans un
//    document Word) et on scanne les codes un par un dans l'écran
//    « Réceptionner les articles des pros » ;
//  - un échantillon d'articles PARTICULIER invendus (RECEPTION_OK, la même
//    définition d'« invendu » que load-unreturned-articles-pdf-data), pour
//    pouvoir répéter un passage en caisse sans aller chercher un article dans
//    les rayons.
//
// L'échantillon particulier est volontairement petit : il y a plus de mille
// articles particulier invendus, en imprimer la totalité n'a pas de sens et
// alourdit le HTML d'autant d'images embarquées. Il est aussi volontairement
// varié : un seul article par vendeur, et les catégories sont tirées en
// tournant (un ski, une chaussure, un vêtement, ... puis on recommence) pour
// qu'un passage en caisse mélange des vendeurs et des rayons différents.
// --particuliers 0 revient à la planche pro seule, --particuliers N en
// demande N.
//
// Le code encodé est exactement le `code` de l'article, celui que cherche
// articlesDb.findByCode.

// Résolu depuis le fichier et non depuis process.cwd() : le script doit sortir
// au même endroit qu'on l'appelle depuis la racine du monorepo, depuis
// apps/backend ou directement via tsx.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'tmp', 'pro-barcodes.html');

const DEFAULT_PARTICULIER_SAMPLE = 30;

// Pseudo-catégories de l'export (article absent / refusé au dépôt) : ce ne
// sont pas des articles en rayon, on ne les propose au scan ni côté pro ni
// côté particulier.
const EXCLUDED_CATEGORIES = ['Zabsent', 'Zrefusé'];

function parseArgs() {
  const args = process.argv.slice(2);
  const output = args.indexOf('--output');
  const sample = args.indexOf('--particuliers');

  let particuliers = DEFAULT_PARTICULIER_SAMPLE;
  if (sample !== -1) {
    const raw = args[sample + 1];
    const parsed = Number(raw);
    if (!raw || !Number.isInteger(parsed) || parsed < 0) {
      console.error(`❌ --particuliers attend un entier positif ou nul, reçu : ${raw ?? '(rien)'}`);
      process.exit(1);
    }
    particuliers = parsed;
  }

  return {
    output: output !== -1 && args[output + 1] ? path.resolve(args[output + 1]) : DEFAULT_OUTPUT,
    particuliers,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ScanArticle = {
  code: string;
  brand: string;
  model: string | null;
  size: string | null;
  category: string;
  identificationLetter: string;
  // Renseigné quand le groupe mélange plusieurs vendeurs (échantillon
  // particulier) : la fiche est alors rappelée sous chaque code.
  owner?: string;
};

function renderArticle(article: ScanArticle) {
  const details = [article.brand, article.model, article.size]
    .filter((part) => part && part.trim())
    .join(' · ');
  const owner = article.owner ? `\n          <span class="owner">${escapeHtml(article.owner)}</span>` : '';
  return `      <figure class="article">
        <img src="${barcodeDataUri(article.code)}" alt="${escapeHtml(article.code)}" />
        <figcaption>
          <span class="code">${escapeHtml(article.code)}</span>
          <span class="details">${escapeHtml(article.category)}${details ? ` — ${escapeHtml(details)}` : ''}</span>${owner}
        </figcaption>
      </figure>`;
}

type Group = { title: string; articles: ScanArticle[] };
// `pageBreakBetweenGroups` : chaque groupe de la famille commence sur une page
// neuve (hors le premier, qui suit son titre de famille). C'est ce qu'on veut
// côté pro — une planche par fiche et par catégorie, qu'on scanne d'une traite
// sans qu'une autre catégorie traîne en bas de page — et pas côté particulier,
// où l'échantillon reste un seul groupe qui coule sur autant de pages qu'il
// faut.
type Family = { title: string; note?: string; groups: Group[]; pageBreakBetweenGroups?: boolean };

const ARTICLES_PER_ROW = 3;

// Les lignes sont des blocs explicites plutôt qu'un seul conteneur flex : Safari
// et Word ne savent pas couper un conteneur flex entre deux pages et le
// repoussent entier sur la page suivante, ce qui laisse la première page vide.
// Un bloc par ligne se coupe proprement entre deux lignes partout.
function renderRows(articles: ScanArticle[]) {
  const rows: string[] = [];
  for (let start = 0; start < articles.length; start += ARTICLES_PER_ROW) {
    rows.push(`      <div class="row">
${articles.slice(start, start + ARTICLES_PER_ROW).map(renderArticle).join('\n')}
      </div>`);
  }
  return rows.join('\n');
}

function renderGroup(group: Group, pageBreak: boolean) {
  return `    <section${pageBreak ? ' class="page-break"' : ''}>
      <h3>${escapeHtml(group.title)} <small>${group.articles.length} articles à scanner</small></h3>
${renderRows(group.articles)}
    </section>`;
}

function countArticles(groups: Group[]) {
  return groups.reduce((sum, group) => sum + group.articles.length, 0);
}

function renderFamily(family: Family, pageBreak: boolean) {
  const count = countArticles(family.groups);
  return `  <h2${pageBreak ? ' class="page-break"' : ''}>${escapeHtml(family.title)} <small>${count} code${count > 1 ? 's' : ''}</small></h2>${
    family.note ? `\n  <p class="note">${escapeHtml(family.note)}</p>` : ''
  }
${family.groups
    .map((group, index) => renderGroup(group, family.pageBreakBetweenGroups === true && index > 0))
    .join('\n')}`;
}

function renderHtml(families: Family[]) {
  const shown = families.filter((family) => family.groups.length > 0);
  const total = shown.reduce((sum, family) => sum + countArticles(family.groups), 0);
  const sections = shown.map((family, index) => renderFamily(family, index > 0)).join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Codes-barres — articles à scanner</title>
<style>
  /* Les largeurs sont en millimètres : un module fait ~0,3 mm à l'impression,
     bien au-dessus du minimum lisible par une douchette. Trois codes par ligne
     sur A4 : 3 × 52 mm + 2 × 4 mm = 164 mm, dans les 190 mm laissés par @page. */
  body { font-family: Arial, Helvetica, sans-serif; margin: 12mm; color: #000; }
  h1 { font-size: 16pt; margin: 0 0 2mm; }
  .intro { font-size: 9pt; color: #444; margin: 0 0 8mm; }
  h2 { font-size: 13pt; margin: 10mm 0 2mm; border-bottom: 2px solid #000; padding-bottom: 1mm; break-after: avoid; page-break-after: avoid; }
  h2:first-of-type { margin-top: 4mm; }
  h2 small, h3 small { font-weight: normal; font-size: 9pt; color: #444; }
  h3 { font-size: 11pt; margin: 5mm 0 3mm; border-bottom: 1px solid #999; padding-bottom: 1mm; break-after: avoid; page-break-after: avoid; }
  .note { font-size: 8.5pt; color: #444; margin: 0 0 3mm; }
  .row { display: flex; gap: 4mm; margin-bottom: 4mm; break-inside: avoid; page-break-inside: avoid; }
  .article { margin: 0; width: 52mm; }
  .article img { display: block; width: 50mm; height: 12mm; image-rendering: crisp-edges; }
  figcaption { display: flex; flex-direction: column; }
  .code { font-family: "Courier New", monospace; font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; }
  .details { font-size: 7.5pt; color: #444; }
  .owner { font-size: 7.5pt; color: #444; font-style: italic; }
  section { break-inside: auto; page-break-inside: auto; }
  /* Une planche par groupe pro, et la famille suivante sur sa propre page :
     on scanne une catégorie d'une traite, sans qu'un autre lot traîne en bas
     de la feuille. */
  .page-break { break-before: page; page-break-before: always; }
  @page { size: A4; margin: 10mm; }
  @media print { body { margin: 0; } .intro { display: none; } }
</style>
</head>
<body>
  <h1>Articles à scanner — ${total} codes</h1>
  <p class="intro">
    Imprime cette page directement, ou sélectionne tout et colle dans Word : les
    codes-barres sont des images embarquées, elles suivent le copier-coller.
  </p>
${sections}
</body>
</html>
`;
}

async function generate() {
  const { output, particuliers } = parseArgs();

  const deposits = await prisma.deposit.findMany({
    where: { type: 'PRO', deletedAt: null },
    orderBy: { depositIndex: 'asc' },
    include: {
      seller: true,
      articles: {
        where: {
          status: 'RECEPTION_PENDING',
          deletedAt: null,
          category: { notIn: EXCLUDED_CATEGORIES },
        },
        orderBy: { articleIndex: 'asc' },
      },
    },
  });

  // Une section par fiche et par catégorie : les skis et les chaussures d'une
  // même fiche se scannent en deux passes distinctes.
  const proGroups: Group[] = [];
  for (const deposit of deposits) {
    if (deposit.articles.length === 0) continue;
    const sellerName = `${deposit.seller.firstName} ${deposit.seller.lastName}`.trim();
    for (const [category, articles] of groupByCategory(deposit.articles)) {
      proGroups.push({ title: `Fiche ${deposit.depositIndex} — ${sellerName} · ${category}`, articles });
    }
  }

  // Invendu = RECEPTION_OK : reçu au dépôt, jamais passé en caisse. Même
  // définition que load-unreturned-articles-pdf-data côté frontend.
  const particulierWhere = {
    status: 'RECEPTION_OK',
    deletedAt: null,
    category: { notIn: EXCLUDED_CATEGORIES },
    deposit: { type: 'PARTICULIER' as const, deletedAt: null },
  };
  const unsold =
    particuliers > 0
      ? await prisma.article.findMany({
          where: particulierWhere,
          orderBy: [{ depositIndex: 'asc' }, { articleIndex: 'asc' }],
          include: { deposit: { include: { seller: true } } },
        })
      : [];
  const sample = sampleAcrossSellersAndCategories(unsold, particuliers).map((article) => ({
    ...article,
    owner: `Fiche ${article.depositIndex} — ${`${article.deposit.seller.firstName} ${article.deposit.seller.lastName}`.trim()}`,
  }));
  const sampledCategories = new Set(sample.map((article) => article.category)).size;

  const families: Family[] = [
    { title: 'Articles pro non réceptionnés', groups: proGroups, pageBreakBetweenGroups: true },
    {
      title: 'Articles particuliers invendus',
      note:
        `Échantillon de ${sample.length} article(s) sur ${unsold.length} invendus, un par vendeur, ` +
        `${sampledCategories} catégorie(s) — pour répéter un passage en caisse. ` +
        `--particuliers N pour en demander plus, 0 pour aucun.`,
      groups: sample.length > 0 ? [{ title: 'Un article par vendeur, catégories mélangées', articles: sample }] : [],
    },
  ];
  const particulierGroups = families[1].groups;

  if (proGroups.length === 0 && particulierGroups.length === 0) {
    console.log('ℹ️  Aucun article à scanner : rien à imprimer.');
    return;
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderHtml(families), 'utf-8');

  for (const family of families) {
    if (family.groups.length === 0) continue;
    console.log(`\n${family.title} :`);
    for (const group of family.groups) {
      console.log(`  • ${group.title} : ${group.articles.length} articles`);
    }
  }
  const total = countArticles(proGroups) + countArticles(particulierGroups);
  console.log(`\n✅ ${total} codes-barres écrits dans ${output}`);
}

generate()
  .catch((error) => {
    console.error('❌ Erreur pendant la génération des codes-barres :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
