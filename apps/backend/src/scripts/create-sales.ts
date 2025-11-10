#!/usr/bin/env tsx
import { prisma } from "database";
import "dotenv/config";

/**
 * Script pour créer des ventes aléatoires
 * Utile pour tester le dashboard en temps réel
 */

interface CreateSaleOptions {
  count?: number;
  delay?: number; // Délai entre chaque vente en ms
  minAmount?: number;
  maxAmount?: number;
}

async function createRandomSales(options: CreateSaleOptions = {}) {
  const {
    count = 5,
    delay = 2000,
    minAmount = 10,
    maxAmount = 200,
  } = options;

  console.log(`🚀 Création de ${count} ventes aléatoires...`);
  console.log(`⏱️  Délai entre chaque vente: ${delay}ms\n`);

  // Récupérer ou créer les dépendances nécessaires
  let event = await prisma.event.findFirst({
    where: { isActive: true },
  });

  if (!event) {
    console.log("📅 Aucun événement actif trouvé, création d'un événement...");
    event = await prisma.event.create({
      data: {
        name: "Test Event",
        year: new Date().getFullYear(),
        isActive: true,
      },
    });
    console.log(`✅ Événement créé: ${event.name}\n`);
  }

  // Récupérer ou créer un workstation
  let workstation = await prisma.workstation.findFirst({
    where: { eventId: event.id },
  });

  if (!workstation) {
    console.log("🖥️  Aucune station trouvée, création d'une station...");
    workstation = await prisma.workstation.create({
      data: {
        name: "Station Test",
        eventId: event.id,
      },
    });
    console.log(`✅ Station créée: ${workstation.name}\n`);
  }

  // Récupérer ou créer un checkout
  let checkout = await prisma.checkout.findFirst({
    where: { eventId: event.id },
  });

  if (!checkout) {
    console.log("💰 Aucune caisse trouvée, création d'une caisse...");
    checkout = await prisma.checkout.create({
      data: {
        name: "Caisse Test",
        eventId: event.id,
        initialCash: 100,
        currentCash: 100,
      },
    });
    console.log(`✅ Caisse créée: ${checkout.name}\n`);
  }

  // Récupérer ou créer un utilisateur
  let user = await prisma.user.findFirst();

  if (!user) {
    console.log("👤 Aucun utilisateur trouvé, création d'un utilisateur...");
    user = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      },
    });
    console.log(`✅ Utilisateur créé: ${user.firstName} ${user.lastName}\n`);
  }

  // Créer les ventes
  for (let i = 1; i <= count; i++) {
    const totalAmount = Math.floor(
      Math.random() * (maxAmount - minAmount) + minAmount
    );

    // Répartir aléatoirement entre cash, card, check
    const cashAmount = Math.floor(Math.random() * totalAmount);
    const cardAmount = Math.floor(Math.random() * (totalAmount - cashAmount));
    const checkAmount = totalAmount - cashAmount - cardAmount;

    const sale = await prisma.sale.create({
      data: {
        eventId: event.id,
        userId: user.id,
        workstationId: workstation.id,
        checkoutId: checkout.id,
        totalAmount,
        cashAmount,
        cardAmount,
        checkAmount,
        saleAt: new Date(),
      },
    });

    console.log(
      `✅ Vente ${i}/${count} créée: ${totalAmount.toFixed(2)}€ (Cash: ${cashAmount}€, Card: ${cardAmount}€, Check: ${checkAmount}€)`
    );

    // Mettre à jour la caisse
    await prisma.checkout.update({
      where: { id: checkout.id },
      data: {
        currentCash: {
          increment: cashAmount,
        },
      },
    });

    // Attendre avant la prochaine vente
    if (i < count) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(`\n🎉 ${count} ventes créées avec succès!`);

  // Afficher les stats actuelles
  const stats = await getStats();
  console.log("\n📊 Statistiques actuelles:");
  console.log(`   - Total utilisateurs: ${stats.totalUsers}`);
  console.log(`   - Dépôts validés: ${stats.activeDepots}`);
  console.log(`   - Ventes du jour: ${stats.todaySales}`);
  console.log(`   - CA du jour: ${stats.todayRevenue.toFixed(2)}€`);
}

async function getStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalUsers, activeDepots, todaySales, todayRevenueResult] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.deposit.count({
        where: { status: "VALIDE", deletedAt: null },
      }),
      prisma.sale.count({
        where: { saleAt: { gte: startOfDay }, deletedAt: null },
      }),
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { saleAt: { gte: startOfDay }, deletedAt: null },
      }),
    ]);

  return {
    totalUsers,
    activeDepots,
    todaySales,
    todayRevenue: Number(todayRevenueResult._sum.totalAmount || 0),
  };
}

// Parser les arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: CreateSaleOptions = {};

  for (const arg of args) {
    const [key, value] = arg.split("=");
    switch (key) {
      case "--count":
        options.count = parseInt(value);
        break;
      case "--delay":
        options.delay = parseInt(value);
        break;
      case "--min":
        options.minAmount = parseFloat(value);
        break;
      case "--max":
        options.maxAmount = parseFloat(value);
        break;
      case "--help":
        console.log(`
Usage: tsx create-sales.ts [options]

Options:
  --count=<number>   Nombre de ventes à créer (défaut: 5)
  --delay=<ms>       Délai entre chaque vente en ms (défaut: 2000)
  --min=<amount>     Montant minimum (défaut: 10)
  --max=<amount>     Montant maximum (défaut: 200)
  --help             Afficher cette aide

Exemples:
  tsx create-sales.ts
  tsx create-sales.ts --count=10 --delay=1000
  tsx create-sales.ts --count=20 --min=50 --max=500
        `);
        process.exit(0);
    }
  }

  return options;
}

// Exécuter le script
const options = parseArgs();

createRandomSales(options)
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
