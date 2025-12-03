#!/usr/bin/env tsx
import { Article, Deposit, prisma, Sale } from 'database';
import 'dotenv/config';
import { DepositData, extractDeposits } from './extract-deposits';
import { ArticleData, extractArticles } from './extract-articles';
import { BuyerData, extractBuyers } from './extract-buyers';
import { extractSoldArticles, SoldArticleData } from './extract-sold-articles';

async function importDeposits(fiches: DepositData[]) {
  let successCount = 0;
  let errorCount = 0;

  const deposits = new Map<number, Deposit>

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
          contributionStatus: fiche.contributionStatus || 'A_PAYER',
          depositIndex: fiche.depositIndex,
          incrementStart: fiche.incrementStart,
          dropWorkstationId: fiche.dropWorkstationId,
          collectWorkstationId: fiche.collectWorkstationId,
          collectedAt: fiche.collectedAt,
          paymentAmount: fiche.paymentAmount,
          chequeNumber: fiche.chequeNumber,
          type: fiche.depositIndex < 10 ? 'PRO' : 'PARTICULIER',
          signature: fiche.signature,
          createdAt: fiche.createdAt,
          updatedAt: fiche.updatedAt,
        },
      });
      deposits.set(deposit.depositIndex, deposit)

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
  return { deposits };
}

async function importArticles(articlesFromImport: ArticleData[], deposits: Map<number, Deposit>) {
  let successCount = 0;
  let errorCount = 0;
  const articles = new Map<string, Article>()
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
          size: articleFromImport.size,
          color: articleFromImport.color,
          code: articleFromImport.code,
          year: articleFromImport.year,
          depositIndex: articleFromImport.depositIndex,
          articleIndex: articleFromImport.articleIndex,
          createdAt: articleFromImport.createdAt,
          updatedAt: articleFromImport.updatedAt,
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
  const sales = new Map<string, Sale>()
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

      const sale = await prisma.sale.create({
        data: {
          buyerId: contact.id,
          saleCode: buyer.idBuyer,
          cardAmount: buyer.paymentMethod === 'CB' ? buyer.paymentAmount : 0,
          checkAmount: buyer.paymentMethod === 'Chèque' ? buyer.paymentAmount : 0,
          cashAmount: buyer.paymentMethod === 'Liquide' ? buyer.paymentAmount : 0,
          updatedAt: buyer.updatedAt,
          createdAt: buyer.createdAt,
        }
      })
      sales.set(sale.saleCode, sale)

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

async function importSoldArticles(soldArticles: SoldArticleData[], articles: Map<string, Article>, sales: Map<string, Sale>) {
  let successCount = 0;
  let errorCount = 0;
  for (const soldArticle of soldArticles) {
    try {
      const sale = sales.get(soldArticle.idBuyer)
      if (!sale) throw new Error(`Sale ${soldArticle.idBuyer} not found`)

      const article = articles.get(soldArticle.code)
      if(!article) throw new Error(`Article ${soldArticle.code} not found`)
      await prisma.article.update({
        where: {
          code: article.code,
        }, data: {
          saleId: sale.id,
          updatedAt: sale.createdAt
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

async function importAll() {
  try {
    const fiches = extractDeposits();

    const { deposits } = await importDeposits(fiches);

    const articlesFromImport = extractArticles()
    const {articles} = await importArticles(articlesFromImport, deposits)

    const buyersFromImport = await extractBuyers()
    const {sales} = await importSales(buyersFromImport)

    const soldArticles = await extractSoldArticles()
    await importSoldArticles(soldArticles, articles, sales)

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
console.log('🚀 Starting Fiche import...\n');
importAll();
