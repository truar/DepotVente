import { EventEmitter } from "events";

/**
 * EventEmitter pour les changements de dépôts
 */
class DepositsEmitter extends EventEmitter {
  private static DEPOSITS_CHANGED_EVENT = "deposits_changed";

  /**
   * Émettre un événement de changement de dépôts
   */
  notifyDepositsChanged() {
    this.emit(DepositsEmitter.DEPOSITS_CHANGED_EVENT);
  }

  /**
   * S'abonner aux changements de dépôts
   */
  onDepositsChanged(callback: () => void) {
    this.on(DepositsEmitter.DEPOSITS_CHANGED_EVENT, callback);
  }

  /**
   * Se désabonner des changements de dépôts
   */
  offDepositsChanged(callback: () => void) {
    this.off(DepositsEmitter.DEPOSITS_CHANGED_EVENT, callback);
  }
}

export const depositsEmitter = new DepositsEmitter();
