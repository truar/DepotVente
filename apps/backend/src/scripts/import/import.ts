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
          collectWorkstationId: fiche.collectWorkstationId,
          collectedAt: fiche.collectedAt,
          clubAmount: fiche.paymentAmount,
          checkId: fiche.chequeNumber,
          type: fiche.depositIndex < 10 ? 'PRO' : 'PARTICULIER',
          signatory: fiche.signature,
          createdAt: fiche.createdAt,
          updatedAt: fiche.updatedAt,
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
          status: 'RECEPTION_PENDING',
          depositIndex: articleFromImport.depositIndex,
          identificationLetter: articleFromImport.identificationLetter,
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
          updatedAt: buyer.updatedAt,
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
          updatedAt: fiche.updatedAt,
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
          updatedAt: articleFromImport.updatedAt,
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
    let fiches = extractDeposits()
    fiches = fiches.filter(f => f.depositIndex < 10)
    let { deposits, predeposits: preDepositToDeposit } = await importDeposits(fiches)
    const articlesFromImport = extractArticles()
    const { articles } = await importArticles(articlesFromImport, deposits)
    //
    // const buyersFromImport = await extractBuyers()
    // const { sales } = await importSales(buyersFromImport)
    //
    // const soldArticles = await extractSoldArticles()
    // await importSoldArticles(soldArticles, articles, sales)

    // const preDepositToDeposit = new Map<number, string>()
    const predepositFiches = extractPredeposits()
    const { predeposits } = await importPredeposits(predepositFiches, preDepositToDeposit)

    const predepositArticles = extractPredepositArticles()
    await importPredepositArticles(predepositArticles, predeposits)
    //
    // const cashRegisterDeposits = await extractCashRegisterDeposits()
    // await importCashRegister(cashRegisterDeposits, 'DEPOSIT')
    //
    // const cashRegisterSales = await extractCashRegisterSales()
    // await importCashRegister(cashRegisterSales, 'SALE')
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
