# Scripts Backend

Scripts utilitaires pour tester et peupler la base de données.

## 📝 Scripts disponibles

### 1. `create-user.ts` - Créer un utilisateur

Crée un utilisateur dans la base de données.

```bash
# Depuis le dossier backend
pnpm script:create-user --firstName=John --lastName=Doe --email=john@example.com --password=secret123

# Ou directement avec tsx
tsx src/scripts/create-user.ts --firstName=John --lastName=Doe
```

**Options:**
- `--firstName` (requis) - Prénom
- `--lastName` (requis) - Nom
- `--email` - Email
- `--phoneNumber` - Téléphone
- `--password` - Mot de passe (sera hashé avec bcrypt)
- `--city` - Ville
- `--postalCode` - Code postal

### 2. `create-sales.ts` - Créer des ventes en batch

Crée un nombre défini de ventes avec un délai entre chaque.

```bash
# Créer 5 ventes (défaut)
pnpm script:create-sales

# Créer 10 ventes avec 1 seconde entre chaque
pnpm script:create-sales -- --count=10 --delay=1000

# Créer 20 ventes avec des montants entre 50€ et 500€
pnpm script:create-sales -- --count=20 --min=50 --max=500
```

**Options:**
- `--count=<number>` - Nombre de ventes à créer (défaut: 5)
- `--delay=<ms>` - Délai entre chaque vente en millisecondes (défaut: 2000)
- `--min=<amount>` - Montant minimum (défaut: 10)
- `--max=<amount>` - Montant maximum (défaut: 200)
- `--help` - Afficher l'aide

### 3. `simulate-sales.ts` - Simuler des ventes en continu

Simule des ventes en temps réel de manière continue. **Parfait pour tester le dashboard live !**

```bash
# Simulation infinie (Ctrl+C pour arrêter)
pnpm script:simulate

# Simulation avec une vente toutes les 2 secondes
pnpm script:simulate -- --interval=2000

# Simulation pendant 60 secondes
pnpm script:simulate -- --interval=1000 --duration=60

# Simulation avec des montants élevés
pnpm script:simulate -- --min=100 --max=1000
```

**Options:**
- `--interval=<ms>` - Intervalle entre chaque vente en millisecondes (défaut: 3000)
- `--min=<amount>` - Montant minimum (défaut: 10)
- `--max=<amount>` - Montant maximum (défaut: 200)
- `--duration=<sec>` - Durée de la simulation en secondes (défaut: 0 = infini)
- `--help` - Afficher l'aide

**Appuyez sur Ctrl+C pour arrêter la simulation**

## 🧪 Tester le Dashboard en Temps Réel

Pour voir le dashboard se mettre à jour automatiquement :

1. **Connecte-toi au dashboard admin**
   ```bash
   # Frontend doit être lancé
   cd apps/frontend
   pnpm dev
   ```

   Ouvre http://localhost:5173/admin et connecte-toi

2. **Lance le backend**
   ```bash
   cd apps/backend
   pnpm dev
   ```

3. **Dans un autre terminal, lance la simulation**
   ```bash
   cd apps/backend

   # Simulation rapide (1 vente par seconde)
   pnpm script:simulate -- --interval=1000

   # Ou simulation normale (1 vente toutes les 3 secondes)
   pnpm script:simulate
   ```

4. **Observe le dashboard** 📊
   - Les statistiques se mettent à jour automatiquement toutes les 5 secondes
   - Le CA du jour augmente en temps réel
   - Le compteur de ventes s'incrémente
   - L'indicateur "Temps réel actif" (point vert) montre que le polling fonctionne

## 🎯 Scénarios de Test

### Scénario 1 : Test rapide
```bash
# Créer 10 ventes rapidement (1 vente par seconde)
pnpm script:create-sales -- --count=10 --delay=1000
```

### Scénario 2 : Simulation continue
```bash
# Laisser tourner pendant 2 minutes
pnpm script:simulate -- --interval=2000 --duration=120
```

### Scénario 3 : Grosses transactions
```bash
# Simuler des ventes de ski haut de gamme
pnpm script:simulate -- --min=200 --max=1500 --interval=5000
```

## ⚙️ Fonctionnement

Les scripts créent automatiquement les dépendances nécessaires si elles n'existent pas :
- ✅ Event (événement actif)
- ✅ Workstation (station de travail)
- ✅ Checkout (caisse)
- ✅ User (utilisateur)

Chaque vente générée contient :
- Un montant total aléatoire
- Une répartition aléatoire entre cash, carte et chèque
- La date/heure actuelle (pour les stats du jour)

## 🔍 Vérifier les Données

```bash
# Se connecter à la base de données
psql $DATABASE_URL

# Voir les ventes du jour
SELECT COUNT(*), SUM(total_amount) FROM sales WHERE sale_at >= CURRENT_DATE;

# Voir les dernières ventes
SELECT id, total_amount, sale_at FROM sales ORDER BY sale_at DESC LIMIT 10;
```
