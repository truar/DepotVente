#!/usr/bin/env tsx
import { prisma } from "database";
import "dotenv/config";

/**
 * Script qui simule des ventes en continu
 * Parfait pour tester le dashboard en temps réel
 *
 * Note: Les notifications SSE sont gérées automatiquement par les triggers PostgreSQL
 * (voir packages/database/prisma/triggers.sql)
 */

interface SimulateOptions {
  interval?: number; // Intervalle entre chaque vente en ms
  minAmount?: number;
  maxAmount?: number;
  duration?: number; // Durée de la simulation en secondes (0 = infini)
}

async function simulateSales(options: SimulateOptions = {}) {
  const {
    interval = 3000,
    minAmount = 10,
    maxAmount = 200,
    duration = 0,
  } = options;

  console.log("🎬 Démarrage de la simulation de ventes...");
  console.log(`⏱️  Intervalle: ${interval}ms`);
  console.log(`💰 Montants: ${minAmount}€ - ${maxAmount}€`);
  console.log(
    `⏳ Durée: ${duration > 0 ? `${duration}s` : "∞ (Ctrl+C pour arrêter)"}\n`
  );

  // Récupérer ou créer les dépendances
  const { event, workstation, checkout, user } = await setupDependencies();

  let saleCount = 0;
  let totalRevenue = 0;
  const startTime = Date.now();

  const createSale = async () => {
    // Récupérer des articles disponibles (non vendus)
    const availableArticles = await prisma.article.findMany({
      where: {
        saleId: null,
        deletedAt: null,
      },
      take: Math.floor(Math.random() * 5) + 1, // 1 à 5 articles
    });

    if (availableArticles.length === 0) {
      console.log("⚠️  Aucun article disponible, création annulée");
      return;
    }

    // Calculer le montant total
    let totalAmount = 0;
    for (const article of availableArticles) {
      totalAmount += Number(article.price);
    }

    // Répartir aléatoirement entre cash, card, check
    const cashAmount = Math.floor(Math.random() * totalAmount);
    const cardAmount = Math.floor(Math.random() * (totalAmount - cashAmount));
    const checkAmount = totalAmount - cashAmount - cardAmount;

    try {
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

      // Associer les articles à la vente
      await prisma.article.updateMany({
        where: {
          id: { in: availableArticles.map(a => a.id) },
        },
        data: {
          saleId: sale.id,
        },
      });

      await prisma.checkout.update({
        where: { id: checkout.id },
        data: {
          currentCash: {
            increment: cashAmount,
          },
        },
      });

      saleCount++;
      totalRevenue += totalAmount;

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(
        `✅ Vente #${saleCount} - ${totalAmount.toFixed(2)}€ | Total: ${totalRevenue.toFixed(2)}€ | Temps écoulé: ${elapsed}s`
      );
    } catch (error) {
      console.error("❌ Erreur lors de la création de la vente:", error);
    }

    // Vérifier si on doit continuer
    if (duration > 0 && Date.now() - startTime >= duration * 1000) {
      clearInterval(intervalId);
      console.log(`\n🏁 Simulation terminée!`);
      console.log(`   - ${saleCount} ventes créées`);
      console.log(`   - Revenu total: ${totalRevenue.toFixed(2)}€`);
      await prisma.$disconnect();
      process.exit(0);
    }
  };

  // Créer la première vente immédiatement
  await createSale();

  // Puis continuer à intervalles réguliers
  const intervalId = setInterval(createSale, interval);

  // Gérer Ctrl+C
  process.on("SIGINT", async () => {
    clearInterval(intervalId);
    console.log(`\n\n⏹️  Simulation arrêtée par l'utilisateur`);
    console.log(`   - ${saleCount} ventes créées`);
    console.log(`   - Revenu total: ${totalRevenue.toFixed(2)}€`);
    await prisma.$disconnect();
    process.exit(0);
  });
}

async function setupDependencies() {
  // Event
  let event = await prisma.event.findFirst({
    where: { isActive: true },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        name: "Simulation Event",
        year: new Date().getFullYear(),
        isActive: true,
      },
    });
    console.log(`✅ Événement créé: ${event.name}`);
  }

  // Workstation
  let workstation = await prisma.workstation.findFirst({
    where: { eventId: event.id },
  });

  if (!workstation) {
    workstation = await prisma.workstation.create({
      data: {
        name: "Station Simulation",
        eventId: event.id,
      },
    });
    console.log(`✅ Station créée: ${workstation.name}`);
  }

  // Checkout
  let checkout = await prisma.checkout.findFirst({
    where: { eventId: event.id },
  });

  if (!checkout) {
    checkout = await prisma.checkout.create({
      data: {
        name: "Caisse Simulation",
        eventId: event.id,
        initialCash: 200,
        currentCash: 200,
      },
    });
    console.log(`✅ Caisse créée: ${checkout.name}`);
  }

  // User
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: "Client",
        lastName: "Simulation",
        email: "simulation@example.com",
      },
    });
    console.log(`✅ Utilisateur créé: ${user.firstName} ${user.lastName}`);
  }

  // Vérifier s'il y a des articles disponibles pour les ventes
  const availableArticlesCount = await prisma.article.count({
    where: {
      saleId: null,
      deletedAt: null,
    },
  });

  if (availableArticlesCount === 0) {
    console.log(`📦 Création de dépôts et articles de test...`);
    const disciplines = ["Ski", "Snowboard", "Raquettes", "Luge"];
    const categories = ["Adulte", "Enfant", "Junior"];
    const brands = ["Rossignol", "Salomon", "Atomic", "Head", "K2"];
    const colors = ["Rouge", "Bleu", "Noir", "Blanc", "Vert"];

    // Créer 10 dépôts avec 5 articles chacun
    for (let d = 0; d < 10; d++) {
      const deposit = await prisma.deposit.create({
        data: {
          eventId: event.id,
          userId: user.id,
          workstationId: workstation.id,
          status: "VALIDE",
        },
      });

      // Créer 5 articles pour ce dépôt
      const articlesToCreate = [];
      for (let i = 0; i < 5; i++) {
        articlesToCreate.push({
          depositId: deposit.id,
          discipline: disciplines[Math.floor(Math.random() * disciplines.length)],
          categorie: categories[Math.floor(Math.random() * categories.length)],
          brand: brands[Math.floor(Math.random() * brands.length)],
          description: `Article ${d + 1}-${i + 1}`,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: `${36 + Math.floor(Math.random() * 10)}`,
          price: Math.floor(Math.random() * 100) + 10,
          code: `ART-${d}-${i}-${Date.now()}`,
        });
      }

      await prisma.article.createMany({
        data: articlesToCreate,
      });
    }

    console.log(`✅ 10 dépôts avec 50 articles créés`);
  } else {
    console.log(`✅ ${availableArticlesCount} articles disponibles`);
  }

  console.log();
  return { event, workstation, checkout, user };
}

// Parser les arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: SimulateOptions = {};

  for (const arg of args) {
    const [key, value] = arg.split("=");
    switch (key) {
      case "--interval":
        options.interval = parseInt(value);
        break;
      case "--min":
        options.minAmount = parseFloat(value);
        break;
      case "--max":
        options.maxAmount = parseFloat(value);
        break;
      case "--duration":
        options.duration = parseInt(value);
        break;
      case "--help":
        console.log(`
Usage: tsx simulate-sales.ts [options]

Options:
  --interval=<ms>    Intervalle entre chaque vente en ms (défaut: 3000)
  --min=<amount>     Montant minimum (défaut: 10)
  --max=<amount>     Montant maximum (défaut: 200)
  --duration=<sec>   Durée de la simulation en secondes (défaut: 0 = infini)
  --help             Afficher cette aide

Exemples:
  tsx simulate-sales.ts
  tsx simulate-sales.ts --interval=2000
  tsx simulate-sales.ts --interval=1000 --duration=60
  tsx simulate-sales.ts --min=50 --max=500

Appuyez sur Ctrl+C pour arrêter la simulation
        `);
        process.exit(0);
    }
  }

  return options;
}

// Exécuter le script
const options = parseArgs();

simulateSales(options).catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
