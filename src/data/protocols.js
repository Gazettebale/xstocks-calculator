// ─────────────────────────────────────────────────────────────────────────────
// DeFi Protocols — Real data, official links, live incentive programs
// Sources: official docs, airdrops.io, DeFiLlama, protocol announcements
// Updated Q1 2026
// ─────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_TYPES = {
  SWAP:    'Swap / Aggregateur',
  LENDING: 'Lending',
  LP:      'Liquidity Pool',
  PERP:    'Perpetuals / DEX',
  VAULT:   'Yield Vault',
}

// Display category for UI grouping (independent of protocol type)
// 'swap' | 'lp' | 'lending' | 'perp' | 'vault' | 'points'
export const CATEGORIES = {
  SWAP:    'swap',
  LP:      'lp',
  LENDING: 'lending',
  PERP:    'perp',
  VAULT:   'vault',
  POINTS:  'points',
}

export const CHAIN = {
  SOL: 'Solana',
  HYP: 'Hyperliquid L1',
}

export const PROTOCOLS = [
  // ── XSTOCKS XPOINTS — PROGRAMME OFFICIEL KRAKEN × BACKED FINANCE ─────────
  {
    id: 'xpoints',
    name: 'xStocks xPoints',
    type: 'Points Program',
    chain: CHAIN.SOL,
    logo: '⭐',
    color: '#00c896',
    tvl: 'N/A',
    tvlRaw: 0,
    url: 'https://defi.xstocks.fi/points?ref=GAZETTEBALE',
    twitterUrl: 'https://x.com/xStocksHQ',
    docsUrl: 'https://xstocks.fi/us/news/introducing-xpoints',
    description: 'Programme officiel xStocks par Kraken/Backed Finance. Gagnez des xPoints pour toute activité DeFi xStocks sur Solana. Lancé le 10 mars 2026 — connecte ton wallet tôt pour le bonus +20% permanent.',
    supplyApy: { min: 0, max: 0 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xMSFT','xGOOGL','xAMZN','xMETA','xNVDA','xTSLA','xNFLX','xAMD','xINTC','xCRM','xADBE','xPLTR','xCOIN','xHOOD','xUBER','xCRWD','xMSTR','xSNOW','xRBLX','xJPM','xBAC','xV','xMA','xGS','xBRK','xPYPL','xJNJ','xPFE','xLLY','xUNH','xMRNA','xABBV','xWMT','xCOST','xNKE','xMCD','xSBUX','xHD','xXOM','xCVX','xBA','xCAT','xSPY','xQQQ','xDIA','xIWM','xGOLD','xSILVER','xOIL'],
    rewards: ['xPOINTS'],
    rewardApy: 0,
    risk: 'low',
    audited: true,
    isOfficialProgram: true,
    isPointsProgram: true,
    category: 'points',
    solanaDefi: true,
    airdrop: {
      active: true,
      season: 1,
      title: '⭐ xPoints Season 1 — Programme Officiel Kraken × Backed Finance',
      description: 'Lancé le 10 mars 2026. xPoints récompensent les early adopters qui utilisent les xStocks dans la DeFi Solana. Aucun token confirmé officiellement mais le signal est fort: "at the end of the season, participation matters." Connecte ton wallet maintenant pour le bonus +20% permanent.',
      startDate: '2026-03-10',
      endDate: null,
      vestingInfo: 'Aucun token confirmé. Points accumulés onchain. Distribution en fin de saison — durée non annoncée.',
      multipliers: '🔴 Hold xStocks: 1× · 🟡 Lend sur Kamino: 5× · 🟢 LP sur Raydium/Orca/Byreal: 7× · ⚡ Connexion wallet tôt: +20% permanent · 👥 Referral: +20% pour ton filleul, +20% de leurs points pour toi · 📈 xBoost: multiplicateur qui augmente avec la constance',
      howTo: 'Aller sur defi.xstocks.fi/points?ref=GAZETTEBALE · Connecter ton wallet Solana pour le bonus +20% permanent · Acheter des xStocks sur Raydium ou Jupiter · Fournir liquidité sur Raydium ou Orca (7×) · Ou déposer en lending sur Kamino (5×) · Partager ton lien referral: ton filleul gagne +20% et tu reçois 20% de tous leurs points',
      urgency: 'medium',
    },
    stats: { users: 'Growing', age: '3 semaines', chains: 1 },
  },

  // ── KAMINO FINANCE ────────────────────────────────────────────────────────
  {
    id: 'kamino',
    name: 'Kamino Finance',
    type: PROTOCOL_TYPES.LENDING,
    chain: CHAIN.SOL,
    logo: '🌀',
    color: '#06b6d4',
    tvl: '$2.8B',
    tvlRaw: 2800,
    url: 'https://app.kamino.finance',
    twitterUrl: 'https://x.com/KaminoFinance',
    docsUrl: 'https://docs.kamino.finance',
    description: 'Premier Solana lending protocol. First to accept xStocks as collateral. Earn KMNO rewards.',
    category: 'lending',
    defillamaSlug: 'kamino-lend',
    supplyApy: { min: 3.2, max: 8.4 },
    borrowApr: { min: 5.8, max: 14.2 },
    ltv: 0.70,
    liquidationThreshold: 0.75,
    xstocksSupported: ['xAAPL','xMSFT','xGOOGL','xAMZN','xMETA','xNVDA','xTSLA','xNFLX','xAMD','xINTC','xCRM','xADBE','xPLTR','xCOIN','xHOOD','xUBER','xCRWD','xMSTR','xSNOW','xRBLX','xJPM','xBAC','xV','xMA','xGS','xBRK','xPYPL','xJNJ','xPFE','xLLY','xUNH','xMRNA','xABBV','xWMT','xCOST','xNKE','xMCD','xSBUX','xHD','xXOM','xCVX','xBA','xCAT','xSPY','xQQQ','xDIA','xIWM','xGOLD','xSILVER','xOIL'],
    rewards: ['KMNO'],
    rewardApy: 2.4,
    risk: 'low',
    audited: true,
    airdrop: {
      active: true,
      season: 5,
      title: 'Season 5 — Lenders & Borrowers',
      description: '100M KMNO distribués aux déposants ET emprunteurs sur 3 mois. Premier season à récompenser les deux côtés.',
      startDate: '2025-11-12',
      endDate: null,
      vestingInfo: '6 mois de vesting. 10% claimable immédiatement. Pénalité pour exit anticipé.',
      multipliers: 'Staker KMNO = jusqu\'à 2× de points',
      howTo: 'Déposer des xStocks ou USDC, emprunter contre, staker KMNO pour boost',
      tokenAddress: 'KMNo...', // simplified
    },
    stats: { users: '45K+', age: '2 ans', chains: 1 },
  },

  // ── ORCA ──────────────────────────────────────────────────────────────────
  {
    id: 'orca',
    name: 'Orca',
    type: PROTOCOL_TYPES.LP,
    chain: CHAIN.SOL,
    logo: '🐋',
    color: '#f472b6',
    tvl: '$650M',
    tvlRaw: 650,
    url: 'https://www.orca.so',
    twitterUrl: 'https://x.com/orca_so',
    docsUrl: 'https://docs.orca.so',
    description: 'AMM concentré (Whirlpools) sur Solana. xStocks/USDC pools. Fees collectées + ORCA incentives.',
    category: 'lp',
    defillamaSlug: 'orca',
    supplyApy: { min: 8.5, max: 32.4 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xNVDA','xMETA','xGOLD','xSPY','xQQQ','xTSLA'],
    rewards: ['ORCA'],
    rewardApy: 5.2,
    risk: 'medium',
    audited: true,
    airdrop: {
      active: false,
      season: null,
      title: 'Programme Buyback DAO — en cours',
      description: 'DAO a voté l\'utilisation de ~55K SOL du trésor pour racheter ORCA sur 24 mois. 30% des fees protocole dirigées vers le buyback. Wavebreak launchpad lancé juil 2025.',
      startDate: '2025-07-01',
      endDate: null,
      vestingInfo: 'Pas d\'airdrop direct — valeur accrued via buybacks',
      multipliers: 'LP dans pools ORCA incentivées = ORCA + fees de trading',
      howTo: 'Fournir liquidité dans les pools xStocks/USDC pour capter fees + rewards ORCA',
    },
    stats: { users: '55K+', age: '3.5 ans', chains: 1 },
  },

  // ── RAYDIUM ───────────────────────────────────────────────────────────────
  {
    id: 'raydium',
    name: 'Raydium',
    type: PROTOCOL_TYPES.LP,
    chain: CHAIN.SOL,
    logo: '⚡',
    color: '#8b5cf6',
    tvl: '$1.4B',
    tvlRaw: 1400,
    url: 'https://raydium.io',
    twitterUrl: 'https://x.com/RaydiumProtocol',
    docsUrl: 'https://docs.raydium.io',
    description: 'AMM + CLMM sur Solana. LaunchLab pour token launches. Pools xStocks/USDC avec rewards RAY.',
    category: 'lp',
    defillamaSlug: 'raydium',
    supplyApy: { min: 6.3, max: 24.7 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xNVDA','xGOLD','xSILVER','xSPY'],
    rewards: ['RAY'],
    rewardApy: 4.1,
    risk: 'medium',
    audited: true,
    airdrop: {
      active: true,
      season: null,
      title: 'LaunchLab Rewards — Ongoing',
      description: 'Distributions RAY quotidiennes aux top traders et créateurs de tokens selon volume 24h. Liquidity mining Q3 2025: ~450K RAY total. Staking RAY ~5% APR.',
      startDate: '2025-07-01',
      endDate: null,
      vestingInfo: 'Pas de vesting — rewards distribués quotidiennement',
      multipliers: 'Top volume = meilleure part du pool quotidien',
      howTo: 'Staker RAY, fournir liquidité dans CLMM pools, trader sur LaunchLab',
    },
    stats: { users: '120K+', age: '4 ans', chains: 1 },
  },

  // ── JUPITER ───────────────────────────────────────────────────────────────
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: PROTOCOL_TYPES.PERP,
    chain: CHAIN.SOL,
    logo: '🪐',
    color: '#10b981',
    tvl: '$420M',
    tvlRaw: 420,
    url: 'https://jup.ag',
    twitterUrl: 'https://x.com/JupiterExchange',
    docsUrl: 'https://station.jup.ag/docs',
    description: 'Aggregateur swap #1 sur Solana. Jupiter Perps, JLP vault, meilleure exécution xStocks.',
    category: 'swap',
    defillamaSlug: 'jupiter',
    supplyApy: { min: 9.2, max: 18.5 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xTSLA','xGOLD','xSPY','xQQQ'],
    rewards: ['JUP'],
    rewardApy: 4.4,
    risk: 'medium',
    audited: true,
    airdrop: {
      active: true,
      season: null,
      title: 'ASR — Active Staking Rewards (ongoing)',
      description: 'Jupuary 2026 a distribué ses tokens en janvier 2026. Les ASR (Active Staking Rewards) sont toujours actifs et distribués chaque quarter. Prochain Jupuary 2027 probable pour les users actifs.',
      startDate: '2026-01-22',
      endDate: null,
      vestingInfo: 'ASR distribués chaque quarter. 50+ JUP stakés requis pour qualifier.',
      multipliers: 'JUP staké + voting participation = boost ASR',
      howTo: 'Staker minimum 50 JUP sur jup.ag/gov · Utiliser swaps régulièrement · Participer aux votes DAO · Préparer Jupuary 2027',
    },
    stats: { users: '2M+', age: '2.5 ans', chains: 1 },
  },

  // ── TITAN EXCHANGE ────────────────────────────────────────────────────────
  {
    id: 'titan',
    name: 'Titan Exchange',
    type: PROTOCOL_TYPES.SWAP,
    category: 'swap',
    chain: CHAIN.SOL,
    logo: '⚔️',
    color: '#f97316',
    tvl: 'N/A',
    tvlRaw: 0,
    url: 'https://titan.exchange/@gazettebale',
    twitterUrl: 'https://x.com/TitanSolana',
    docsUrl: 'https://titan.exchange',
    description: 'Meta-DEX aggregateur Solana. Algorithme Argos route les swaps via Jupiter + autres sources pour la meilleure exécution. Airdrop actif pour les traders xStocks.',
    supplyApy: { min: 0, max: 0 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xMSFT','xGOOGL','xAMZN','xMETA','xNVDA','xTSLA','xNFLX','xAMD','xINTC','xCRM','xADBE','xPLTR','xCOIN','xHOOD','xUBER','xCRWD','xMSTR','xSNOW','xRBLX','xJPM','xBAC','xV','xMA','xGS','xBRK','xPYPL','xJNJ','xPFE','xLLY','xUNH','xMRNA','xABBV','xWMT','xCOST','xNKE','xMCD','xSBUX','xHD','xXOM','xCVX','xBA','xCAT','xSPY','xQQQ','xDIA','xIWM','xGOLD','xSILVER','xOIL'],
    rewards: ['TITAN'],
    rewardApy: 0,
    risk: 'low',
    audited: false,
    earlyStage: true,
    solanaDefi: true,
    airdrop: {
      active: true,
      season: 1,
      title: 'Titan Airdrop — Volume-based Points',
      description: 'Similaire au modèle Jupiter (Jupuary). Points distribués selon le volume de swap. Plus tu trades de xStocks via Titan, plus tu accumules de points. Token TITAN non confirmé officiellement — programme actif.',
      startDate: '2026-01-01',
      endDate: null,
      vestingInfo: 'Points accumulés onchain. Distribution lors du TGE — date non annoncée.',
      multipliers: '📊 Volume xStocks = points · 👥 Referral link actif · ⚡ Early adopter bonus',
      howTo: 'Aller sur titan.exchange/@gazettebale · Connecter ton wallet Solana · Swapper tes xStocks via Titan pour cumuler des points · Partager ton lien referral',
      urgency: 'medium',
    },
    stats: { users: 'Growing', age: '< 1 an', chains: 1 },
  },

  // ── HYPERLIQUID ───────────────────────────────────────────────────────────
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    type: PROTOCOL_TYPES.PERP,
    chain: CHAIN.HYP,
    logo: '⚡',
    color: '#f59e0b',
    tvl: '$3.2B',
    tvlRaw: 3200,
    url: 'https://app.hyperliquid.xyz',
    twitterUrl: 'https://x.com/HyperliquidX',
    docsUrl: 'https://hyperliquid.gitbook.io',
    description: 'Order book on-chain sur Hyperliquid L1 (≠ Solana). Trading de perps avec xStocks en tant qu\'actifs sous-jacents. Attention: blockchain différente des xStocks SPL sur Solana.',
    category: 'perp',
    solanaDefi: false, // Hyperliquid L1 — pas la même blockchain que les xStocks SPL Solana
    supplyApy: { min: 5.5, max: 20 },
    borrowApr: { min: 0, max: 0 },
    ltv: 0.95,
    liquidationThreshold: 0.97,
    xstocksSupported: ['xAAPL','xMSFT','xGOOGL','xAMZN','xMETA','xNVDA','xTSLA','xNFLX','xAMD','xPLTR','xCOIN','xJPM','xV','xGOLD','xSILVER','xSPY','xQQQ'],
    rewards: ['HYPE'],
    rewardApy: 6.8,
    risk: 'low',
    audited: true,
    airdrop: {
      active: false,
      season: null,
      title: 'HLP Vault — ~20% APY historique',
      description: 'Airdrop HYPE complété au launch. Valeur accrual ongoing via HLP vault (~1.75%/mois historique) et maker rebates. 97% des fees → buyback HYPE (deflationary).',
      startDate: null,
      endDate: null,
      vestingInfo: 'HLP vault: dépôts/retraits instantanés',
      multipliers: 'Aligned quote assets: 20% réduction taker fees + 50% meilleurs maker rebates',
      howTo: 'Déposer dans HLP vault, utiliser comme market maker pour rebates, staker HYPE pour fee discounts',
    },
    stats: { users: '180K+', age: '2 ans', chains: 1 },
  },

  // ── PIGGYBANK ─────────────────────────────────────────────────────────────
  {
    id: 'piggybank',
    name: 'PiggyBank Finance',
    type: PROTOCOL_TYPES.VAULT,
    chain: CHAIN.SOL,
    logo: '🐷',
    color: '#ec4899',
    tvl: 'Early',
    tvlRaw: 0,
    url: 'https://app.piggybank.fi/oinks',
    twitterUrl: 'https://x.com/PiggyBankFi',
    docsUrl: 'https://app.piggybank.fi/oinks',
    description: 'Protocole dédié aux xStocks sur Solana. Stratégies delta-neutral sur actions tokenisées. Campagne Oink Points terminée le 31 mars 2026 — vault xSPYx était à 3× multiplicateur.',
    category: 'lending',
    defillamaSlug: 'piggybank-finance',
    supplyApy: { min: 0, max: 0 },
    borrowApr: { min: 0, max: 0 },
    ltv: null,
    liquidationThreshold: null,
    xstocksSupported: ['xAAPL','xMSFT','xGOOGL','xAMZN','xMETA','xNVDA','xTSLA','xNFLX','xAMD','xINTC','xCRM','xADBE','xPLTR','xCOIN','xHOOD','xUBER','xCRWD','xMSTR','xSNOW','xRBLX','xJPM','xBAC','xV','xMA','xGS','xBRK','xPYPL','xJNJ','xPFE','xLLY','xUNH','xMRNA','xABBV','xWMT','xCOST','xNKE','xMCD','xSBUX','xHD','xXOM','xCVX','xBA','xCAT','xSPY','xQQQ','xDIA','xIWM','xGOLD','xSILVER','xOIL'],
    rewards: ['PIGGY'],
    rewardApy: 0,
    risk: 'high',
    audited: false,
    earlyStage: true,
    airdrop: {
      active: false,
      season: 1,
      title: 'Oink Points Campaign — Terminée le 31 mars 2026',
      description: 'Campagne de points terminée. Les depositors qui avaient mis du xSPY (3× multiplicateur) avant le 31 mars sont dans le leaderboard. Les récompenses seront distribuées aux participants selon leur rang. PIGGY token non confirmé officiellement.',
      startDate: '2025-10-30',
      endDate: '2026-03-31',
      vestingInfo: 'Campagne terminée. Distribution des récompenses en attente d\'annonce officielle.',
      multipliers: 'xSPYx vault était à 3× · USDC 1× · Referral: 10% des oinks des filleuls',
      howTo: 'Campagne terminée. Surveiller les annonces PiggyBank sur X pour la distribution des récompenses.',
      urgency: 'low',
    },
    stats: { users: 'Early', age: '5 mois', chains: 1 },
  },

]

// Helper: Get protocols supporting a specific xStock
export function getProtocolsForStock(symbol) {
  return PROTOCOLS.filter(p => p.xstocksSupported.includes(symbol))
}

// Calculate net APY for a strategy
export function calcLendingNetApy(protocol, amount, leverage = 1) {
  if (protocol.airdrop?.active && protocol.supplyApy.max === 0) return 0 // points-only protocol
  const baseSupply = (protocol.supplyApy.min + protocol.supplyApy.max) / 2
  const rewards = protocol.rewardApy || 0
  const net = baseSupply + rewards
  if (leverage > 1 && protocol.borrowApr.max > 0) {
    const borrowCost = (protocol.borrowApr.min + protocol.borrowApr.max) / 2
    return net * leverage - borrowCost * (leverage - 1)
  }
  return net
}

export const RISK_LABELS = {
  low: { label: 'Faible risque', class: 'badge-green', color: '#10b981' },
  medium: { label: 'Risque moyen', class: 'badge-orange', color: '#f59e0b' },
  high: { label: 'Risque élevé', class: 'badge-red', color: '#ef4444' },
}

// Solana xStocks DeFi protocols only (excludes Hyperliquid L1)
export const SOLANA_PROTOCOLS = PROTOCOLS.filter(p => p.solanaDefi !== false)

// Total TVL across Solana protocols
export const TOTAL_TVL = SOLANA_PROTOCOLS.reduce((s, p) => s + (p.tvlRaw || 0), 0)
