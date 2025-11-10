import { Client } from "pg";
import { statsEmitter } from "./StatsEmitter";
import { salesEmitter } from "./SalesEmitter";

/**
 * Écoute les notifications PostgreSQL NOTIFY
 * et émet des événements pour les clients SSE
 */
class DatabaseListener {
  private client: Client | null = null;
  private isListening = false;

  async start() {
    if (this.isListening) {
      return;
    }

    try {
      // Créer un client PostgreSQL dédié pour LISTEN
      this.client = new Client({
        connectionString: process.env.DATABASE_URL,
      });

      await this.client.connect();

      // S'abonner aux channels
      await this.client.query("LISTEN stats_changed");
      await this.client.query("LISTEN sales_changed");

      // Écouter les notifications
      this.client.on("notification", (msg) => {
        if (msg.channel === "stats_changed") {
          // Émettre l'événement pour les clients SSE
          statsEmitter.notifyStatsChanged();
        } else if (msg.channel === "sales_changed") {
          // Émettre l'événement pour les ventes SSE
          salesEmitter.notifySalesChanged();
        }
      });

      this.isListening = true;
      console.log("✅ Database listener started (LISTEN stats_changed, sales_changed)");
    } catch (error) {
      console.error("❌ Failed to start database listener:", error);
      throw error;
    }
  }

  async stop() {
    if (this.client) {
      await this.client.query("UNLISTEN stats_changed");
      await this.client.query("UNLISTEN sales_changed");
      await this.client.end();
      this.isListening = false;
      console.log("🛑 Database listener stopped");
    }
  }
}

export const dbListener = new DatabaseListener();
