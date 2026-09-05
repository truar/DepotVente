#!/usr/bin/env tsx
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from 'database';
import { barcodeDataUri } from './code128.js';

// Planche de codes-barres à scanner.
//
// Deux familles, dans le même fichier :
//  - les articles PRO non réceptionnés (RECEPTION_PENDING), qui servent à
//    répéter la partie humaine de la réception pro : on imprime la planche (ou
//    on la colle dans un document Word) et on scanne les codes un par un dans
//    l'écran « Réceptionner les articles des pros » ;
//  - un échantillon d'articles PARTICULIER invendus (RECEPTION_OK, la même
//    définition d'« invendu » que load-unreturned-articles-pdf-data), pour
//    pouvoir répéter un passage en caisse sans aller chercher un article dans
//    les rayons.
//
// L'échantillon est volontairement petit : il y a plus de mille articles
// particulier invendus, en imprimer la totalité n'a pas de sens et alourdit le
// HTML d'autant d'images embarquées. --particuliers 0 revient à la planche pro
// seule, --particuliers N en demande N.
//
// Le code encodé est exactement le `code` de l'article, celui que cherche
// articlesDb.findByCode.

// Résolu depuis le fichier et non depuis process.cwd() : le script doit sortir
// au même endroit qu'on l'appelle depuis la racine du monorepo, depuis
// apps/backend ou directement via tsx.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'tmp', 'pro-barcodes.html');

const DEFAULT_PARTICULIER_SAMPLE = 20;

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

type PendingArticle = {
  code: string;
  brand: string;
  model: string | null;
  size: string | null;
  category: string;
  identificationLetter: string;
};

function renderArticle(article: PendingArticle) {
  const details = [article.brand, article.model, article.size]
    .filter((part) => part && part.trim())
    .join(' · ');
  return `      <figure class="article">
        <img src="${barcodeDataUri(article.code)}" alt="${escapeHtml(article.code)}" />
        <figcaption>
          <span class="code">${escapeHtml(article.code)}</span>
          <span class="details">${escapeHtml(article.category)}${details ? ` — ${escapeHtml(details)}` : ''}</span>
        </figcaption>
      </figure>`;
}

type Group = { depositIndex: number; sellerName: string; articles: PendingArticle[] };
type Family = { title: string; note?: string; groups: Group[] };

function renderGroup(group: Group) {
  return `    <section>
      <h3>Fiche ${group.depositIndex} — ${escapeHtml(group.sellerName)} <small>${group.articles.length} articles à scanner</small></h3>
      <div class="grid">
${group.articles.map(renderArticle).join('\n')}
      </div>
    </section>`;
}

function countArticles(groups: Group[]) {
  return groups.reduce((sum, group) => sum + group.articles.length, 0);
}

function renderFamily(family: Family) {
  const count = countArticles(family.groups);
  return `  <h2>${escapeHtml(family.title)} <small>${count} code${count > 1 ? 's' : ''}</small></h2>${
    family.note ? `\n  <p class="note">${escapeHtml(family.note)}</p>` : ''
  }
${family.groups.map(renderGroup).join('\n')}`;
}

function renderHtml(families: Family[]) {
  const shown = families.filter((family) => family.groups.length > 0);
  const total = shown.reduce((sum, family) => sum + countArticles(family.groups), 0);
  const sections = shown.map(renderFamily).join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Codes-barres — articles à scanner</title>
<style>
  /* Les largeurs sont en millimètres : un module fait ~0,35 mm à l'impression,
     bien au-dessus du minimum lisible par une douchette. */
  body { font-family: Arial, Helvetica, sans-serif; margin: 12mm; color: #000; }
  h1 { font-size: 16pt; margin: 0 0 2mm; }
  .intro { font-size: 9pt; color: #444; margin: 0 0 8mm; }
  h2 { font-size: 13pt; margin: 10mm 0 2mm; border-bottom: 2px solid #000; padding-bottom: 1mm; }
  h2:first-of-type { margin-top: 4mm; }
  h2 small, h3 small { font-weight: normal; font-size: 9pt; color: #444; }
  h3 { font-size: 11pt; margin: 5mm 0 3mm; border-bottom: 1px solid #999; padding-bottom: 1mm; }
  .note { font-size: 8.5pt; color: #444; margin: 0 0 3mm; }
  .grid { display: flex; flex-wrap: wrap; gap: 4mm; }
  .article { margin: 0; width: 60mm; break-inside: avoid; page-break-inside: avoid; }
  .article img { display: block; width: 58mm; height: 14mm; image-rendering: crisp-edges; }
  figcaption { display: flex; flex-direction: column; }
  .code { font-family: "Courier New", monospace; font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; }
  .details { font-size: 7.5pt; color: #444; }
  section { break-inside: auto; }
  @media print { body { margin: 8mm; } .intro { display: none; } }
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
        where: { status: 'RECEPTION_PENDING', deletedAt: null },
        orderBy: { articleIndex: 'asc' },
      },
    },
  });

  const proGroups = deposits
    .filter((deposit) => deposit.articles.length > 0)
    .map((deposit) => ({
      depositIndex: deposit.depositIndex,
      sellerName: `${deposit.seller.firstName} ${deposit.seller.lastName}`.trim(),
      articles: deposit.articles as PendingArticle[],
    }));

  // Invendu = RECEPTION_OK : reçu au dépôt, jamais passé en caisse. Même
  // définition que load-unreturned-articles-pdf-data côté frontend.
  const particulierWhere = {
    status: 'RECEPTION_OK',
    deletedAt: null,
    deposit: { type: 'PARTICULIER' as const, deletedAt: null },
  };
  const unsoldTotal = particuliers > 0 ? await prisma.article.count({ where: particulierWhere }) : 0;
  // On prend les N premiers articles, pas les N premières fiches : l'échantillon
  // reste de taille prévisible même si un vendeur a déposé trente articles.
  const unsold =
    particuliers > 0
      ? await prisma.article.findMany({
          where: particulierWhere,
          orderBy: [{ depositIndex: 'asc' }, { articleIndex: 'asc' }],
          take: particuliers,
          include: { deposit: { include: { seller: true } } },
        })
      : [];

  const particulierGroups: Group[] = [];
  for (const article of unsold) {
    const last = particulierGroups[particulierGroups.length - 1];
    if (last && last.depositIndex === article.depositIndex) {
      last.articles.push(article as PendingArticle);
      continue;
    }
    particulierGroups.push({
      depositIndex: article.depositIndex,
      sellerName: `${article.deposit.seller.firstName} ${article.deposit.seller.lastName}`.trim(),
      articles: [article as PendingArticle],
    });
  }

  const families: Family[] = [
    { title: 'Articles pro non réceptionnés', groups: proGroups },
    {
      title: 'Articles particuliers invendus',
      note:
        `Échantillon de ${unsold.length} article(s) sur ${unsoldTotal} invendus — ` +
        `pour répéter un passage en caisse. --particuliers N pour en demander plus, 0 pour aucun.`,
      groups: particulierGroups,
    },
  ];

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
      console.log(`  • Fiche ${group.depositIndex} — ${group.sellerName} : ${group.articles.length} articles`);
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
