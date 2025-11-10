import { EventEmitter } from "events";

/**
 * EventEmitter pour les changements de ventes
 */
class SalesEmitter extends EventEmitter {
  private static SALES_CHANGED_EVENT = "sales_changed";

  /**
   * Émettre un événement de changement de ventes
   */
  notifySalesChanged() {
    this.emit(SalesEmitter.SALES_CHANGED_EVENT);
  }

  /**
   * S'abonner aux changements de ventes
   */
  onSalesChanged(callback: () => void) {
    this.on(SalesEmitter.SALES_CHANGED_EVENT, callback);
  }

  /**
   * Se désabonner des changements de ventes
   */
  offSalesChanged(callback: () => void) {
    this.off(SalesEmitter.SALES_CHANGED_EVENT, callback);
  }
}

export const salesEmitter = new SalesEmitter();
