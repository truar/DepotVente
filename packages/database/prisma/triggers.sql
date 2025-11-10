-- ============================================
-- Extension moddatetime pour updated_at automatique
-- ============================================
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================
-- Fonctions de notification
-- ============================================

-- Fonction pour notifier les changements de statistiques générales
CREATE OR REPLACE FUNCTION notify_stats_changed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('stats_changed', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', NOW()
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier les changements de ventes spécifiques
CREATE OR REPLACE FUNCTION notify_sales_changed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('sales_changed', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', NOW()
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur sales pour stats_changed (statistiques générales)
DROP TRIGGER IF EXISTS sales_stats_notify_trigger ON sales;
CREATE TRIGGER sales_stats_notify_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION notify_stats_changed();

-- Trigger sur sales pour sales_changed (mises à jour temps réel des ventes)
DROP TRIGGER IF EXISTS sales_notify_trigger ON sales;
CREATE TRIGGER sales_notify_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION notify_sales_changed();

-- Trigger sur deposits pour stats_changed
DROP TRIGGER IF EXISTS deposits_notify_trigger ON deposits;
CREATE TRIGGER deposits_notify_trigger
AFTER INSERT OR UPDATE ON deposits
FOR EACH ROW
EXECUTE FUNCTION notify_stats_changed();

-- Trigger sur users pour stats_changed
DROP TRIGGER IF EXISTS users_notify_trigger ON users;
CREATE TRIGGER users_notify_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION notify_stats_changed();

-- ============================================
-- Triggers moddatetime pour updated_at automatique
-- ============================================

-- Events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Checkouts
DROP TRIGGER IF EXISTS update_checkouts_updated_at ON checkouts;
CREATE TRIGGER update_checkouts_updated_at
BEFORE UPDATE ON checkouts
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Workstations
DROP TRIGGER IF EXISTS update_workstations_updated_at ON workstations;
CREATE TRIGGER update_workstations_updated_at
BEFORE UPDATE ON workstations
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Deposits
DROP TRIGGER IF EXISTS update_deposits_updated_at ON deposits;
CREATE TRIGGER update_deposits_updated_at
BEFORE UPDATE ON deposits
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Sales
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Cash Transactions
DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
BEFORE UPDATE ON cash_transactions
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- Articles
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');
