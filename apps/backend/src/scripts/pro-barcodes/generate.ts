#!/usr/bin/env tsx
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from 'database';
import { barcodeDataUri } from './code128.js';

// Planche de codes-barres des articles pro non réceptionnés.
//
// Sert à répéter la partie humaine de la réception pro : on imprime la planche
// (ou on la colle dans un document Word), et on scanne les codes un par un dans
// l'écran « Réceptionner les articles des pros ». Le code encodé est exactement
// le `code` de l'article, celui que cherche articlesDb.findByCode.

// Résolu depuis le fichier et non depuis process.cwd() : le script doit sortir
// au même endroit qu'on l'appelle depuis la racine du monorepo, depuis
// apps/backend ou directement via tsx.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'tmp', 'pro-barcodes.html');

function parseArgs() {
  const args = process.argv.slice(2);
  const output = args.indexOf('--output');
  return {
    output: output !== -1 && args[output + 1] ? path.resolve(args[output + 1]) : DEFAULT_OUTPUT,
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

function renderHtml(
  groups: { depositIndex: number; sellerName: string; articles: PendingArticle[] }[]
) {
  const total = groups.reduce((sum, group) => sum + group.articles.length, 0);
  const sections = groups
    .map(
      (group) => `    <section>
      <h2>Fiche ${group.depositIndex} — ${escapeHtml(group.sellerName)} <small>${group.articles.length} articles à scanner</small></h2>
      <div class="grid">
${group.articles.map(renderArticle).join('\n')}
      </div>
    </section>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Codes-barres — articles pro non réceptionnés</title>
<style>
  /* Les largeurs sont en millimètres : un module fait ~0,35 mm à l'impression,
     bien au-dessus du minimum lisible par une douchette. */
  body { font-family: Arial, Helvetica, sans-serif; margin: 12mm; color: #000; }
  h1 { font-size: 16pt; margin: 0 0 2mm; }
  .intro { font-size: 9pt; color: #444; margin: 0 0 8mm; }
  h2 { font-size: 12pt; margin: 6mm 0 3mm; border-bottom: 1px solid #000; padding-bottom: 1mm; }
  h2 small { font-weight: normal; font-size: 9pt; color: #444; }
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
  <h1>Articles pro non réceptionnés — ${total} codes à scanner</h1>
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
  const { output } = parseArgs();

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

  const groups = deposits
    .filter((deposit) => deposit.articles.length > 0)
    .map((deposit) => ({
      depositIndex: deposit.depositIndex,
      sellerName: `${deposit.seller.firstName} ${deposit.seller.lastName}`.trim(),
      articles: deposit.articles as PendingArticle[],
    }));

  if (groups.length === 0) {
    console.log('ℹ️  Aucun article pro en attente de réception : rien à imprimer.');
    return;
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderHtml(groups), 'utf-8');

  for (const group of groups) {
    console.log(`  • Fiche ${group.depositIndex} — ${group.sellerName} : ${group.articles.length} articles`);
  }
  const total = groups.reduce((sum, group) => sum + group.articles.length, 0);
  console.log(`\n✅ ${total} codes-barres écrits dans ${output}`);
}

generate()
  .catch((error) => {
    console.error('❌ Erreur pendant la génération des codes-barres :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
