#!/usr/bin/env tsx
import { Article, Deposit, prisma, Sale, Predeposit } from 'database';
import 'dotenv/config';
import { DepositData, extractDeposits } from './extract-deposits';
import { ArticleData, extractArticles } from './extract-articles';
import { BuyerData, extractBuyers } from './extract-buyers';
import { extractSoldArticles, SoldArticleData } from './extract-sold-articles';
import { extractPredeposits, PredepositData } from './extract-predeposits';
import { extractPredepositArticles, PredepositArticleData } from './extract-predepositArticles';
import { CashRegisterDeposit, extractCashRegisterDeposits } from './extract-deposit-cash-register';
import { extractCashRegisterSales } from './extract-sale-cash-register';
import { extraPredeposits } from './extra-predeposits';
import { TARGET_YEAR } from './utils';

// NOTE: these imports deliberately do NOT set `updatedAt`.
//
// `updatedAt` is the sync cursor: /sync/delta returns every row where
// `updatedAt >= since`. Writing a source timestamp into it means importing a
// date the database has no control over, and any row dated in the future then
// satisfies that filter forever - every client re-downloads it on every poll,
// so delta sync degenerates into a full sync that never converges.
//
// Prisma's @updatedAt sets it to now() on create, which is what it should mean:
// when this row last changed *in this database*. `createdAt` still carries the
// original date, and nothing in the sync path reads it.

// ── Mode « état de dépôt » (--depot-state) ──────────────────────────────────
//
// Rejoue l'export en s'arrêtant à la fin de la phase de dépôt : les dépôts et
// leurs articles existent, mais rien de ce qui vient d'après n'est importé.
// Concrètement, aucune vente, aucun article vendu, aucun contrôle de caisse, et
// aucun chèque rendu — les champs de restitution des fiches restent vides.
//
// Les statuts d'article sont alors ceux qu'on aurait vraiment à ce moment-là :
//   • particulier → RECEPTION_OK   (remis en main propre pendant le dépôt)
//   • pro         → RECEPTION_OK / RECEPTION_PENDING selon la colonne ReceptOK
//
// Pour pouvoir répéter la partie « scan humain » de la réception pro, les fiches
// listées dans PENDING_PRO_DEPOSIT_INDEXES sont traitées à part : pour chaque
// catégorie de PENDING_PRO_CATEGORIES, leurs PENDING_ARTICLES_PER_CATEGORY
// derniers articles restent non réceptionnés, et tout le reste de la fiche passe
// en RECEPTION_OK quoi qu'en dise la colonne ReceptOK. On a donc exactement le
// nombre d'articles voulu à scanner par catégorie (30 skis et 30 chaussures par
// fiche), et la sélection est déterministe (les derniers articles du fichier) :
// un ré-import redonne le même lot.

// Même logique côté pré-dépôt : l'export ne laisse que 4 pré-dépôts non
// confirmés, donc le mode état de dépôt ajoute les pré-dépôts de
// extra-predeposits.ts, numérotés à la suite de ceux du fichier et sans dépôt
// associé. On a ainsi de quoi rejouer « déposer un pré-dépôt » sans toucher aux
// fiches déjà importées.

const PENDING_PRO_DEPOSIT_INDEXES = [2, 3];
const PENDING_PRO_CATEGORIES = ['Skis', 'Chaussures'];
const PENDING_ARTICLES_PER_CATEGORY = 30;

const depotState = process.argv.includes('--depot-state');

// Renvoie les codes des articles qu'on garde volontairement non réceptionnés.
function reservePendingArticleCodes(articles: ArticleData[]) {
  const codes = new Set<string>();
  for (const depositIndex of PENDING_PRO_DEPOSIT_INDEXES) {
    for (const category of PENDING_PRO_CATEGORIES) {
      const reserved = articles
        .filter((article) => article.depositIndex === depositIndex && article.category === category)
        .slice(-PENDING_ARTICLES_PER_CATEGORY);
      if (reserved.length < PENDING_ARTICLES_PER_CATEGORY) {
        console.warn(
          `⚠️  Fiche ${depositIndex} / ${category} : ${reserved.length} articles disponibles pour ${PENDING_ARTICLES_PER_CATEGORY} demandés`
        );
      }
      for (const article of reserved) codes.add(article.code);
    }
  }
  return codes;
}

// En mode état de dépôt la fiche n'a pas encore été restituée : ni calcul de
// retour, ni chèque, ni signature, ni poste de restitution.
function depositReturnFields(fiche: DepositData) {
  if (depotState) {
    return {
      collectWorkstationId: null,
      collectedAt: null,
      clubAmount: null,
      checkId: null,
      signatory: null,
    };
  }
  return {
    collectWorkstationId: fiche.collectWorkstationId,
    collectedAt: fiche.collectedAt,
    clubAmount: fiche.paymentAmount,
    checkId: fiche.chequeNumber,
    signatory: fiche.signature,
  };
}

async function importDeposits(fiches: DepositData[]) {
  let successCount = 0;
  let errorCount = 0;

  const deposits = new Map<number, Deposit>
  const predeposits = new Map<number, string>()
  for (const fiche of fiches) {
    try {
      // First, create or find the contact
      const contact = await prisma.contact.create({
        data: {
          lastName: fiche.lastName,
          firstName: fiche.firstName,
          phoneNumber: fiche.phoneNumber,
          city: fiche.city,
          postalCode: fiche.postalCode,
        },
      });

      // Then create the deposit linked to this contact
      const deposit = await prisma.deposit.create({
        data: {
          sellerId: contact.id,
          contributionAmount: ['PRO', 'GRATUIT'].includes(fiche.contributionStatus) ? 0 : 2,
          contributionStatus: fiche.contributionStatus || 'A_PAYER',
          depositIndex: fiche.depositIndex,
          incrementStart: fiche.incrementStart,
          dropWorkstationId: fiche.dropWorkstationId,
          type: fiche.depositIndex < 10 ? 'PRO' : 'PARTICULIER',
          createdAt: fiche.createdAt,
          ...depositReturnFields(fiche),
        },
      });
      deposits.set(deposit.depositIndex, deposit)
      if(fiche.predepositId) {
        predeposits.set(fiche.predepositId, deposit.id)
      }
      successCount++;
      console.log(`✅ Imported fiche for ${fiche.firstName} ${fiche.lastName}`);
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing fiche for ${fiche.firstName} ${fiche.lastName}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${fiches.length}`);
  console.log('='.repeat(50));
  return { deposits, predeposits };
}

// Hors mode état de dépôt on garde le comportement historique : tout arrive en
// RECEPTION_PENDING, et importSoldArticles repasse ensuite les articles vendus
// en SOLD.
function articleStatus(
  article: ArticleData,
  deposit: Deposit,
  reservedPendingCodes: Set<string>
) {
  if (!depotState) return 'RECEPTION_PENDING';
  if (deposit.type !== 'PRO') return 'RECEPTION_OK';
  if (PENDING_PRO_DEPOSIT_INDEXES.includes(article.depositIndex)) {
    return reservedPendingCodes.has(article.code) ? 'RECEPTION_PENDING' : 'RECEPTION_OK';
  }
  return article.received ? 'RECEPTION_OK' : 'RECEPTION_PENDING';
}

async function importArticles(articlesFromImport: ArticleData[], deposits: Map<number, Deposit>) {
  let successCount = 0;
  let errorCount = 0;
  const articles = new Map<string, Article>()
  const reservedPendingCodes = depotState
    ? reservePendingArticleCodes(articlesFromImport)
    : new Set<string>()
  for (const articleFromImport of articlesFromImport) {
    try {
      const deposit = deposits.get(articleFromImport.depositIndex)
      if (!deposit) throw new Error(`Deposit ${articleFromImport.depositIndex} not found`)

      const article = await prisma.article.create({
        data: {
          depositId: deposit.id,
          price: articleFromImport.price,
          category: articleFromImport.category || 'AUTRE',
          discipline: articleFromImport.discipline || 'AUTRE',
          brand: articleFromImport.brand,
          model: articleFromImport.model || 'AUTRE',
          serialNumber: articleFromImport.serialNumber ?? null,
          size: articleFromImport.size,
          color: articleFromImport.color,
          code: articleFromImport.code,
          year: articleFromImport.year,
          status: articleStatus(articleFromImport, deposit, reservedPendingCodes),
          depositIndex: articleFromImport.depositIndex,
          identificationLetter: articleFromImport.identificationLetter,
          articleIndex: articleFromImport.articleIndex,
          createdAt: articleFromImport.createdAt,
        }
      })
      articles.set(articleFromImport.code, article)

      console.log(`✅ Imported article for ${articleFromImport.code}`);
      successCount++
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing article for ${articleFromImport.code}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${articlesFromImport.length}`);
  console.log('='.repeat(50));

  return { articles }
}

async function importSales(buyers: BuyerData[]) {
  let successCount = 0;
  let errorCount = 0;
  const sales = new Map<number, Sale>()
  for (const buyer of buyers) {
    try {
      const contact = await prisma.contact.create({
        data: {
          lastName: buyer.lastName,
          firstName: buyer.firstName,
          phoneNumber: buyer.phoneNumber,
          city: buyer.city,
          postalCode: null
        }
      })

      const cardAmount = buyer.splitCardAmount ? buyer.splitCardAmount : buyer.paymentMethod === 'CB' ? buyer.paymentAmount : 0
      const cashAmount = buyer.splitCashAmount ? buyer.splitCashAmount : buyer.paymentMethod === 'Liquide' ? buyer.paymentAmount : 0

      const sale = await prisma.sale.create({
        data: {
          buyerId: contact.id,
          incrementStart: buyer.incrementStart,
          saleIndex: parseInt(buyer.idBuyer),
          cardAmount: cardAmount,
          checkAmount: buyer.paymentMethod === 'Chèque' ? buyer.paymentAmount : 0,
          cashAmount: cashAmount,
          createdAt: buyer.createdAt,
        }
      })
      sales.set(sale.saleIndex, sale)

      console.log(`✅ Imported buyer for ${buyer.idBuyer}`);
      successCount++
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing buyer for ${buyer.idBuyer}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${buyers.length}`);
  console.log('='.repeat(50));

  return { sales }
}

async function importSoldArticles(soldArticles: SoldArticleData[], articles: Map<string, Article>, sales: Map<number, Sale>) {
  let successCount = 0;
  let errorCount = 0;
  for (const soldArticle of soldArticles) {
    try {
      const sale = sales.get(parseInt(soldArticle.idBuyer))
      if (!sale) throw new Error(`Sale ${soldArticle.idBuyer} not found`)

      const article = articles.get(soldArticle.code)
      if (!article) throw new Error(`Article ${soldArticle.code} not found`)
      await prisma.article.update({
        where: {
          code: article.code,
        }, data: {
          saleId: sale.id,
          status: 'SOLD',
        }
      })
      console.log(`✅ Imported sold article for ${soldArticle.code}`);
      successCount++
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing soldArticle for ${soldArticle.code}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${soldArticles.length}`);
  console.log('='.repeat(50));
}

async function importPredeposits(fiches: PredepositData[], preDepositToDeposit: Map<number, string>) {
  let successCount = 0;
  let errorCount = 0;

  const predeposits = new Map<number, Predeposit>

  for (const fiche of fiches) {
    try {
      // Then create the deposit linked to this contact
      const predeposit = await prisma.predeposit.create({
        data: {
          predepositIndex: fiche.predepositIndex,
          sellerLastName: fiche.lastName,
          sellerFirstName: fiche.firstName,
          sellerPhoneNumber: fiche.phoneNumber,
          sellerCity: fiche.city || '',
          depositId: preDepositToDeposit.get(fiche.predepositIndex) || null,
          createdAt: fiche.createdAt,
        },
      });
      predeposits.set(fiche.predepositIndex, predeposit)

      successCount++;
      console.log(`✅ Imported fiche for ${fiche.firstName} ${fiche.lastName}`);
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing fiche for ${fiche.firstName} ${fiche.lastName}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${fiches.length}`);
  console.log('='.repeat(50));
  return { predeposits };
}

async function importPredepositArticles(articlesFromImport: PredepositArticleData[], predeposits: Map<number, Predeposit>) {
  let successCount = 0;
  let errorCount = 0;
  for (const articleFromImport of articlesFromImport) {
    try {
      const predeposit = predeposits.get(articleFromImport.vendeurId)
      if (!predeposit) throw new Error(`Deposit ${articleFromImport.vendeurId} not found`)
        await prisma.predepositArticle.create({
        data: {
          predepositId: predeposit.id,
          price: articleFromImport.price,
          category: articleFromImport.category || 'AUTRE',
          discipline: articleFromImport.discipline || 'AUTRE',
          brand: articleFromImport.brand,
          model: articleFromImport.model || 'AUTRE',
          size: articleFromImport.size,
          color: articleFromImport.color,
          year: articleFromImport.year,
          identificationLetter: articleFromImport.identificationLetter,
          articleIndex: articleFromImport.articleIndex,
          createdAt: articleFromImport.createdAt,
        }
      })

      console.log(`✅ Imported predepositArticle for ${predeposit.id} ${articleFromImport.articleIndex}`);
      successCount++
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing predepositArticle for ${articleFromImport.articleIndex}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${articlesFromImport.length}`);
  console.log('='.repeat(50));
}

// Crée les pré-dépôts de extra-predeposits.ts avec leurs articles. Le numéro de
// fiche et l'indice d'article reprennent à la suite de ceux du fichier, pour ne
// pas empiéter sur les pré-dépôts importés.
async function importExtraPredeposits(nextPredepositIndex: number, nextArticleIndex: number) {
  let successCount = 0;
  let errorCount = 0;

  for (const [offset, fiche] of extraPredeposits.entries()) {
    const predepositIndex = nextPredepositIndex + offset;
    try {
      await prisma.predeposit.create({
        data: {
          predepositIndex: predepositIndex,
          sellerLastName: fiche.lastName,
          sellerFirstName: fiche.firstName,
          sellerPhoneNumber: fiche.phoneNumber,
          sellerCity: fiche.city,
          depositId: null,
          createdAt: new Date(),
          articles: {
            create: fiche.articles.map((article, index) => ({
              price: article.price,
              category: article.category,
              discipline: article.discipline,
              brand: article.brand,
              model: article.model,
              size: article.size,
              color: article.color,
              year: TARGET_YEAR,
              identificationLetter: article.identificationLetter,
              articleIndex: nextArticleIndex + index,
              createdAt: new Date(),
            })),
          },
        },
      });

      successCount++;
      console.log(
        `✅ Imported extra predeposit ${predepositIndex} for ${fiche.firstName} ${fiche.lastName} (${fiche.articles.length} articles)`
      );
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing extra predeposit for ${fiche.firstName} ${fiche.lastName}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${extraPredeposits.length}`);
  console.log('='.repeat(50));
}

async function importCashRegister(controls: CashRegisterDeposit[], type: 'DEPOSIT' | 'SALE') {
  let successCount = 0;
  let errorCount = 0;

  for (const control of controls) {
    try {
      // Then create the deposit linked to this contact
      await prisma.cashRegisterControl.create({
        data: {
          id: crypto.randomUUID(),
          cashRegisterId: control.cashRegisterId,
          type: type,
          initialAmount: control.initialAmount,
          theoreticalCashAmount: control.theoreticalAmount,
          realCashAmount: control.realCashAmount,
          totalAmount: control.totalAmount,
          difference: control.difference,
          cash200: control.cash200,
          cash100: control.cash100,
          cash50: control.cash50,
          cash20: control.cash20,
          cash10: control.cash10,
          cash5: control.cash5,
          cash2: control.cash2,
          cash1: control.cash1,
          cash05: control.cash050,
          cash02: control.cash020,
          cash01: control.cash010,
          cash005: control.cash005,
          cash002: control.cash002,
          cash001: control.cash001,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      successCount++;
      console.log(`✅ Imported cash register deposit for ${control.cashRegisterId}`);
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error importing fiche for ${control.cashRegisterId}:`,
        error
      );
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${controls.length}`);
  console.log('='.repeat(50));
}

async function importAll() {
  try {
    const fiches = extractDeposits()
    const { deposits, predeposits: preDepositToDeposit } = await importDeposits(fiches)

    const articlesFromImport = extractArticles()
    const { articles } = await importArticles(articlesFromImport, deposits)

    if (!depotState) {
      const buyersFromImport = await extractBuyers()
      const { sales } = await importSales(buyersFromImport)

      const soldArticles = await extractSoldArticles()
      await importSoldArticles(soldArticles, articles, sales)
    }

    const predepositFiches = extractPredeposits()
    const { predeposits } = await importPredeposits(predepositFiches, preDepositToDeposit)

    const predepositArticles = extractPredepositArticles()
    await importPredepositArticles(predepositArticles, predeposits)

    if (depotState) {
      const lastPredepositIndex = Math.max(...predepositFiches.map((fiche) => fiche.predepositIndex))
      const lastArticleIndex = Math.max(...predepositArticles.map((article) => article.articleIndex))
      await importExtraPredeposits(lastPredepositIndex + 1, lastArticleIndex + 1)
    }

    // Les contrôles de caisse - dépôt comme vente - décrivent une journée déjà
    // jouée. En mode état de dépôt on part caisses vides, pour pouvoir refaire
    // le contrôle de caisse du dépôt pendant la répétition.
    if (!depotState) {
      const cashRegisterDeposits = await extractCashRegisterDeposits()
      await importCashRegister(cashRegisterDeposits, 'DEPOSIT')

      const cashRegisterSales = await extractCashRegisterSales()
      await importCashRegister(cashRegisterSales, 'SALE')
    }
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
console.log('🚀 Starting Fiche import...\n');
if (depotState) {
  console.log(
    "📦 Mode état de dépôt : ni vente, ni article vendu, ni contrôle de caisse, ni chèque rendu."
  );
  console.log(
    `📦 ${PENDING_ARTICLES_PER_CATEGORY} articles non réceptionnés par catégorie (${PENDING_PRO_CATEGORIES.join(', ')}) réservés sur les fiches pro ${PENDING_PRO_DEPOSIT_INDEXES.join(', ')}.\n`
  );
  console.log(
    `📦 ${extraPredeposits.length} pré-dépôts non confirmés ajoutés (${extraPredeposits.map((fiche) => `${fiche.lastName} ${fiche.firstName}`).join(', ')}).\n`
  );
}
importAll();
