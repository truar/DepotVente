import { EventEmitter } from "events";

/**
 * Event Emitter global pour les stats
 * Émet un événement quand les stats doivent être rafraîchies
 */
class StatsEventEmitter extends EventEmitter {
  private static instance: StatsEventEmitter;

  private constructor() {
    super();
  }

  static getInstance(): StatsEventEmitter {
    if (!StatsEventEmitter.instance) {
      StatsEventEmitter.instance = new StatsEventEmitter();
    }
    return StatsEventEmitter.instance;
  }

  /**
   * Notifier que les stats ont changé (après une vente, un dépôt, etc.)
   */
  notifyStatsChanged() {
    this.emit("stats:changed");
  }

  /**
   * S'abonner aux changements de stats
   */
  onStatsChanged(callback: () => void) {
    this.on("stats:changed", callback);
  }

  /**
   * Se désabonner
   */
  offStatsChanged(callback: () => void) {
    this.off("stats:changed", callback);
  }
}

export const statsEmitter = StatsEventEmitter.getInstance();
