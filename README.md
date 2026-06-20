# xStocks — DeFi Intelligence

Dashboard pour les **xStocks** (actions/ETF/matières premières tokenisés par Backed Finance sur Solana) : marchés live, analytics DeFi, projections de prix et suivi de portefeuille on-chain (lecture seule).

🔗 Live : [xstocks-calculator.vercel.app](https://xstocks-calculator.vercel.app)

## Fonctionnalités

- **Markets** — 165 xStocks, prix + variation 24h **réels on-chain** (Jupiter), beta / 52 semaines / market cap **réels** (Yahoo), tri, recherche, watchlist.
- **DeFi Hub** — TVL & APY live (DeFiLlama), protocoles (Kamino, Orca, Raydium, Jupiter…), programme xPoints.
- **Projections** — fan chart probabiliste (GBM) basé sur le **rendement & la volatilité réels** de chaque action (historique Yahoo jusqu'à ~50 ans), scénarios Bear/Base/Bull, simulateur de position, dividendes.
- **Portfolio & DCA** — colle une adresse Solana (lecture seule) → holdings xStocks on-chain (spot + Kamino + LP Raydium/Orca), valorisés au prix on-chain (= ce que montre ton wallet).

## Stack

React 19 · Vite · Recharts · TradingView widgets · Zustand · déployé sur **Vercel**.

Lecture wallet via une **fonction serverless `/api/rpc`** qui proxy vers un RPC Solana (clé Helius côté serveur, jamais exposée dans le bundle).

## Données (toutes réelles)

| Source | Usage |
|---|---|
| **Jupiter** (`lite-api.jup.ag`) | prix on-chain + variation 24h des tokens xStocks |
| **Pyth** (Hermes) | prix de référence des actions sous-jacentes |
| **Yahoo Finance** | historique (CAGR, volatilité, beta), 52 semaines, market cap |
| **DeFiLlama** | TVL & APY des protocoles |
| **RPC Solana** (Helius via `/api/rpc`) | lecture des holdings on-chain |

## Setup

```bash
npm install
npm run dev          # http://localhost:5173
```

### Variables d'environnement (voir `.env.example`)

- `SOLANA_RPC_URL` — **côté serveur** (Vercel env), URL Helius pour le proxy `/api/rpc`. Le wallet ne fonctionne en prod que si elle est définie.
- `VITE_SOLANA_RPC` — **dev local uniquement** (`vite` ne lance pas les fonctions serverless) : pointe directement vers un RPC.

## Scripts utiles

- `node scripts/fetch_history.mjs` — recalcule les stats réelles (rendement, volatilité, beta, 52 semaines, market cap) → `src/data/history.js`.
- `bash scripts/sync-check.sh` — vérifie l'alignement Mac ↔ GitHub + audit sécurité (secrets, .env).

> ⚠️ Not financial advice. Prix indicatifs.
