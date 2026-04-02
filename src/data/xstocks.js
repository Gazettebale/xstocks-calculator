// ─────────────────────────────────────────────────────────────────────────────
// xStocks Complete Database — Tokenized US Equities & ETFs on Solana
// Backed Finance AG (acquired by Kraken Dec 2025) · xstocks.fi
// Prices indicative as of Q1 2026
// ─────────────────────────────────────────────────────────────────────────────

export const SECTORS = {
  TECH: 'Technology',
  FINANCE: 'Finance & Banking',
  HEALTH: 'Healthcare & Pharma',
  CONSUMER: 'Consumer',
  ENERGY: 'Energy',
  INDUSTRIAL: 'Industrial',
  COMMODITIES: 'Commodities',
  INDICES: 'ETFs & Indices',
  CRYPTO: 'Crypto-Adjacent',
}

// Real xStocks from xstocks.fi — 60+ tokenized equities live on Solana
export const XSTOCKS_LIST = [
  // ── MAGNIFICENT 7 (all confirmed live) ────────────────────────────────────
  {
    symbol: 'xAAPL', underlying: 'AAPL', name: 'Apple Inc.', sector: SECTORS.TECH,
    price: 228.52, change24h: 1.23, marketCap: '3.42T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank', 'orca', 'raydium'],
    logo: '🍎', description: 'Consumer electronics, software, services. iPhone, Mac, iPad, Apple Watch.',
    high52w: 260.09, low52w: 165.67, pe: 31.2, dividendYield: 0.44, beta: 1.19,
    volume24h: '82.1M', avgVolume: '71.4M', eps: 7.32,
  },
  {
    symbol: 'xMSFT', underlying: 'MSFT', name: 'Microsoft Corp.', sector: SECTORS.TECH,
    price: 418.72, change24h: 0.87, marketCap: '3.11T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🪟', description: 'Cloud computing (Azure), productivity software, Teams, GitHub, gaming.',
    high52w: 468.35, low52w: 385.58, pe: 35.6, dividendYield: 0.72, beta: 0.89,
    volume24h: '22.1M', avgVolume: '20.8M', eps: 11.75,
  },
  {
    symbol: 'xGOOGL', underlying: 'GOOGL', name: 'Alphabet Inc.', sector: SECTORS.TECH,
    price: 191.45, change24h: 1.54, marketCap: '2.35T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🔵', description: 'Google Search, YouTube, Google Cloud, Android, DeepMind AI.',
    high52w: 207.05, low52w: 155.63, pe: 23.7, dividendYield: 0.47, beta: 1.05,
    volume24h: '18.4M', avgVolume: '16.9M', eps: 8.04,
  },
  {
    symbol: 'xAMZN', underlying: 'AMZN', name: 'Amazon.com Inc.', sector: SECTORS.TECH,
    price: 224.36, change24h: -0.92, marketCap: '2.37T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '📦', description: 'E-commerce, AWS cloud computing, Prime Video, Alexa, advertising.',
    high52w: 242.52, low52w: 178.25, pe: 44.2, dividendYield: 0, beta: 1.14,
    volume24h: '41.2M', avgVolume: '38.7M', eps: 5.08,
  },
  {
    symbol: 'xMETA', underlying: 'META', name: 'Meta Platforms', sector: SECTORS.TECH,
    price: 605.18, change24h: 2.23, marketCap: '1.52T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank', 'orca'],
    logo: '♾️', description: 'Facebook, Instagram, WhatsApp, Threads, VR/AR (Quest), Llama AI.',
    high52w: 740.91, low52w: 441.38, pe: 29.1, dividendYield: 0.33, beta: 1.28,
    volume24h: '14.8M', avgVolume: '13.2M', eps: 20.82,
  },
  {
    symbol: 'xNVDA', underlying: 'NVDA', name: 'NVIDIA Corp.', sector: SECTORS.TECH,
    price: 136.28, change24h: 3.15, marketCap: '3.33T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank', 'orca', 'raydium'],
    logo: '🟢', description: 'GPUs, AI training chips (H100/H200), data centers, CUDA ecosystem.',
    high52w: 153.13, low52w: 75.61, pe: 42.8, dividendYield: 0.03, beta: 1.97,
    volume24h: '248.3M', avgVolume: '221.5M', eps: 2.98,
  },
  {
    symbol: 'xTSLA', underlying: 'TSLA', name: 'Tesla Inc.', sector: SECTORS.TECH,
    price: 248.35, change24h: -2.41, marketCap: '791B', status: 'live',
    protocols: ['kamino', 'drift', 'marginfi', 'piggybank', 'orca'],
    logo: '🚗', description: 'EVs, energy storage (Powerwall/Megapack), Solar, Full Self-Driving AI, Robotaxi.',
    high52w: 488.54, low52w: 138.80, pe: 74.1, dividendYield: 0, beta: 2.34,
    volume24h: '95.2M', avgVolume: '88.4M', eps: 3.65,
  },
  // ── TECH ──────────────────────────────────────────────────────────────────
  {
    symbol: 'xNFLX', underlying: 'NFLX', name: 'Netflix Inc.', sector: SECTORS.TECH,
    price: 1025.33, change24h: 1.87, marketCap: '435B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🎬', description: 'Global streaming platform, 260M+ subscribers, original content.',
    high52w: 1064.50, low52w: 538.01, pe: 52.3, dividendYield: 0, beta: 1.45,
    volume24h: '4.1M', avgVolume: '3.8M', eps: 19.61,
  },
  {
    symbol: 'xAMD', underlying: 'AMD', name: 'Advanced Micro Devices', sector: SECTORS.TECH,
    price: 118.45, change24h: -1.24, marketCap: '191B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '💻', description: 'CPUs (Ryzen), GPUs (Radeon), AI chips (MI300X), data center.',
    high52w: 227.30, low52w: 94.52, pe: 28.4, dividendYield: 0, beta: 1.81,
    volume24h: '44.8M', avgVolume: '41.2M', eps: 4.17,
  },
  {
    symbol: 'xINTC', underlying: 'INTC', name: 'Intel Corp.', sector: SECTORS.TECH,
    price: 22.14, change24h: -0.45, marketCap: '94.5B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🔷', description: 'PC CPUs, data center, foundry services (Intel 18A), FPGA.',
    high52w: 37.80, low52w: 18.51, pe: null, dividendYield: 2.26, beta: 0.98,
    volume24h: '48.2M', avgVolume: '45.1M', eps: -4.38,
  },
  {
    symbol: 'xCRM', underlying: 'CRM', name: 'Salesforce Inc.', sector: SECTORS.TECH,
    price: 315.44, change24h: 0.62, marketCap: '304B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '☁️', description: 'CRM software, Slack, Tableau, MuleSoft, Einstein AI.',
    high52w: 348.86, low52w: 234.47, pe: 46.2, dividendYield: 0.57, beta: 1.24,
    volume24h: '6.2M', avgVolume: '5.8M', eps: 6.82,
  },
  {
    symbol: 'xADBE', underlying: 'ADBE', name: 'Adobe Inc.', sector: SECTORS.TECH,
    price: 428.52, change24h: -0.31, marketCap: '187B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🎨', description: 'Creative Cloud (Photoshop, Premiere), Document Cloud, Firefly AI.',
    high52w: 587.75, low52w: 394.59, pe: 27.4, dividendYield: 0, beta: 1.32,
    volume24h: '3.4M', avgVolume: '3.1M', eps: 15.63,
  },
  {
    symbol: 'xPLTR', underlying: 'PLTR', name: 'Palantir Technologies', sector: SECTORS.TECH,
    price: 115.42, change24h: 3.71, marketCap: '249B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🔮', description: 'AI/data analytics platforms (AIP, GOTHAM, FOUNDRY) for government & enterprise.',
    high52w: 125.41, low52w: 20.33, pe: 218.4, dividendYield: 0, beta: 2.87,
    volume24h: '95.1M', avgVolume: '88.4M', eps: 0.53,
  },
  {
    symbol: 'xCOIN', underlying: 'COIN', name: 'Coinbase Global', sector: SECTORS.CRYPTO,
    price: 276.84, change24h: 5.32, marketCap: '66.4B', status: 'live',
    protocols: ['kamino', 'drift', 'marginfi', 'piggybank'],
    logo: '🔵', description: 'Largest US crypto exchange, Base L2, institutional custody.',
    high52w: 394.78, low52w: 167.52, pe: 38.4, dividendYield: 0, beta: 3.21,
    volume24h: '8.4M', avgVolume: '7.8M', eps: 7.21,
  },
  {
    symbol: 'xHOOD', underlying: 'HOOD', name: 'Robinhood Markets', sector: SECTORS.CRYPTO,
    price: 54.32, change24h: 2.14, marketCap: '48.2B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🏹', description: 'Commission-free trading app, crypto, prediction markets, credit card.',
    high52w: 66.11, low52w: 18.47, pe: 48.6, dividendYield: 0, beta: 2.94,
    volume24h: '24.4M', avgVolume: '22.1M', eps: 1.12,
  },
  {
    symbol: 'xUBER', underlying: 'UBER', name: 'Uber Technologies', sector: SECTORS.TECH,
    price: 84.32, change24h: -0.54, marketCap: '177B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🚕', description: 'Ridesharing, food delivery (Uber Eats), freight, autonomous vehicle partnership.',
    high52w: 87.22, low52w: 60.01, pe: 22.1, dividendYield: 0, beta: 1.42,
    volume24h: '12.4M', avgVolume: '11.2M', eps: 3.82,
  },
  {
    symbol: 'xCRWD', underlying: 'CRWD', name: 'CrowdStrike Holdings', sector: SECTORS.TECH,
    price: 398.54, change24h: 1.84, marketCap: '96.4B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🛡️', description: 'AI-native cybersecurity platform, Falcon, endpoint protection.',
    high52w: 427.06, low52w: 200.81, pe: 94.2, dividendYield: 0, beta: 1.68,
    volume24h: '3.2M', avgVolume: '3.0M', eps: 4.23,
  },
  {
    symbol: 'xMSTR', underlying: 'MSTR', name: 'Strategy (MicroStrategy)', sector: SECTORS.CRYPTO,
    price: 312.45, change24h: 6.24, marketCap: '107B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🟠', description: 'Bitcoin treasury company. Holds 450K+ BTC. Premium Bitcoin proxy.',
    high52w: 543.00, low52w: 161.56, pe: null, dividendYield: 0, beta: 3.42,
    volume24h: '14.8M', avgVolume: '13.2M', eps: -32.1,
  },
  {
    symbol: 'xSNOW', underlying: 'SNOW', name: 'Snowflake Inc.', sector: SECTORS.TECH,
    price: 178.42, change24h: -1.24, marketCap: '59.4B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '❄️', description: 'Cloud data platform, AI/ML data warehouse, Cortex AI.',
    high52w: 228.64, low52w: 107.13, pe: null, dividendYield: 0, beta: 1.54,
    volume24h: '4.2M', avgVolume: '3.9M', eps: -2.40,
  },
  {
    symbol: 'xRBLX', underlying: 'RBLX', name: 'Roblox Corp.', sector: SECTORS.TECH,
    price: 55.41, change24h: -0.84, marketCap: '36.8B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🎮', description: 'Gaming metaverse platform, 80M+ daily active users, UGC economy.',
    high52w: 62.45, low52w: 32.65, pe: null, dividendYield: 0, beta: 1.88,
    volume24h: '5.4M', avgVolume: '5.0M', eps: -0.95,
  },
  // ── FINANCE ───────────────────────────────────────────────────────────────
  {
    symbol: 'xJPM', underlying: 'JPM', name: 'JPMorgan Chase', sector: SECTORS.FINANCE,
    price: 257.94, change24h: 0.31, marketCap: '739B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🏦', description: 'Largest US bank. Investment banking, commercial banking, asset management.',
    high52w: 280.25, low52w: 196.50, pe: 13.8, dividendYield: 2.08, beta: 1.12,
    volume24h: '9.8M', avgVolume: '9.1M', eps: 18.69,
  },
  {
    symbol: 'xBAC', underlying: 'BAC', name: 'Bank of America', sector: SECTORS.FINANCE,
    price: 48.12, change24h: -0.21, marketCap: '382B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🏛️', description: 'US commercial & retail banking, Merrill Lynch, investment banking.',
    high52w: 51.35, low52w: 35.05, pe: 13.2, dividendYield: 2.65, beta: 1.34,
    volume24h: '42.1M', avgVolume: '39.4M', eps: 3.65,
  },
  {
    symbol: 'xV', underlying: 'V', name: 'Visa Inc.', sector: SECTORS.FINANCE,
    price: 352.14, change24h: 0.82, marketCap: '719B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '💳', description: 'Global payments network, VisaNet, 150+ currencies, 4B+ cards.',
    high52w: 375.45, low52w: 263.14, pe: 33.8, dividendYield: 0.70, beta: 0.94,
    volume24h: '7.2M', avgVolume: '6.8M', eps: 10.41,
  },
  {
    symbol: 'xMA', underlying: 'MA', name: 'Mastercard Inc.', sector: SECTORS.FINANCE,
    price: 556.32, change24h: 1.14, marketCap: '521B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🔴', description: 'Payment technology network, Open Banking, cross-border settlements.',
    high52w: 575.20, low52w: 432.61, pe: 38.4, dividendYield: 0.57, beta: 0.95,
    volume24h: '3.4M', avgVolume: '3.2M', eps: 14.49,
  },
  {
    symbol: 'xGS', underlying: 'GS', name: 'Goldman Sachs', sector: SECTORS.FINANCE,
    price: 595.48, change24h: 0.44, marketCap: '199B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '📊', description: 'Investment banking, global markets, asset & wealth management.',
    high52w: 622.46, low52w: 437.64, pe: 15.8, dividendYield: 2.22, beta: 1.45,
    volume24h: '1.8M', avgVolume: '1.7M', eps: 37.68,
  },
  {
    symbol: 'xBRK', underlying: 'BRK.B', name: 'Berkshire Hathaway B', sector: SECTORS.FINANCE,
    price: 528.61, change24h: -0.14, marketCap: '1.14T', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🏢', description: 'Warren Buffett\'s holding company. BNSF, Geico, BHEM, Apple stake.',
    high52w: 552.34, low52w: 411.72, pe: 22.4, dividendYield: 0, beta: 0.88,
    volume24h: '3.8M', avgVolume: '3.6M', eps: 23.58,
  },
  {
    symbol: 'xPYPL', underlying: 'PYPL', name: 'PayPal Holdings', sector: SECTORS.FINANCE,
    price: 84.56, change24h: 1.24, marketCap: '79.4B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '💰', description: 'Digital payments, Venmo, Braintree, stablecoin PYUSD, Buy Now Pay Later.',
    high52w: 94.24, low52w: 59.40, pe: 18.4, dividendYield: 0, beta: 1.22,
    volume24h: '9.8M', avgVolume: '9.1M', eps: 4.60,
  },
  // ── HEALTHCARE ────────────────────────────────────────────────────────────
  {
    symbol: 'xJNJ', underlying: 'JNJ', name: 'Johnson & Johnson', sector: SECTORS.HEALTH,
    price: 162.34, change24h: -0.31, marketCap: '390B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🏥', description: 'Pharmaceuticals (oncology, immunology), medical devices (DePuy, J&J MedTech).',
    high52w: 175.00, low52w: 143.13, pe: 16.8, dividendYield: 3.12, beta: 0.61,
    volume24h: '7.4M', avgVolume: '6.9M', eps: 9.66,
  },
  {
    symbol: 'xPFE', underlying: 'PFE', name: 'Pfizer Inc.', sector: SECTORS.HEALTH,
    price: 28.45, change24h: -0.42, marketCap: '161B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '💊', description: 'Global pharma giant. Paxlovid, Eliquis, Prevnar, oncology pipeline.',
    high52w: 31.74, low52w: 22.84, pe: 27.2, dividendYield: 6.77, beta: 0.63,
    volume24h: '28.4M', avgVolume: '26.5M', eps: 1.05,
  },
  {
    symbol: 'xLLY', underlying: 'LLY', name: 'Eli Lilly & Co.', sector: SECTORS.HEALTH,
    price: 832.45, change24h: 0.84, marketCap: '789B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '💉', description: 'GLP-1 leader. Mounjaro/Zepbound (obesity/diabetes), Verzenio, Kisunla.',
    high52w: 972.04, low52w: 705.00, pe: 54.2, dividendYield: 0.71, beta: 0.48,
    volume24h: '2.8M', avgVolume: '2.6M', eps: 15.36,
  },
  {
    symbol: 'xUNH', underlying: 'UNH', name: 'UnitedHealth Group', sector: SECTORS.HEALTH,
    price: 492.11, change24h: 0.55, marketCap: '454B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🩺', description: 'Largest US health insurer. UnitedHealthcare + Optum (pharmacy, data).',
    high52w: 630.73, low52w: 423.44, pe: 23.7, dividendYield: 1.75, beta: 0.72,
    volume24h: '4.2M', avgVolume: '3.9M', eps: 20.77,
  },
  {
    symbol: 'xMRNA', underlying: 'MRNA', name: 'Moderna Inc.', sector: SECTORS.HEALTH,
    price: 54.78, change24h: -1.84, marketCap: '21.8B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🧬', description: 'mRNA therapeutics platform. RSV vaccine, flu/COVID combo, cancer vaccines.',
    high52w: 175.08, low52w: 38.32, pe: null, dividendYield: 0, beta: 1.44,
    volume24h: '14.2M', avgVolume: '13.1M', eps: -8.80,
  },
  {
    symbol: 'xABBV', underlying: 'ABBV', name: 'AbbVie Inc.', sector: SECTORS.HEALTH,
    price: 185.62, change24h: 0.24, marketCap: '328B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🔬', description: 'Skyrizi, Rinvoq (Humira successors), Botox, aesthetics pipeline.',
    high52w: 211.38, low52w: 150.48, pe: 62.3, dividendYield: 3.63, beta: 0.64,
    volume24h: '5.4M', avgVolume: '5.0M', eps: 2.98,
  },
  // ── CONSUMER ──────────────────────────────────────────────────────────────
  {
    symbol: 'xWMT', underlying: 'WMT', name: 'Walmart Inc.', sector: SECTORS.CONSUMER,
    price: 98.76, change24h: 0.34, marketCap: '795B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🛒', description: 'Largest global retailer. Walmart+, Sam\'s Club, Flipkart, digital ads.',
    high52w: 105.30, low52w: 73.62, pe: 39.5, dividendYield: 0.93, beta: 0.55,
    volume24h: '18.4M', avgVolume: '17.1M', eps: 2.50,
  },
  {
    symbol: 'xCOST', underlying: 'COST', name: 'Costco Wholesale', sector: SECTORS.CONSUMER,
    price: 985.44, change24h: 0.64, marketCap: '436B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🏪', description: 'Membership warehouse club. Gold & silver bars, high-end electronics, food.',
    high52w: 1079.79, low52w: 718.76, pe: 56.4, dividendYield: 0.56, beta: 0.73,
    volume24h: '2.2M', avgVolume: '2.1M', eps: 17.47,
  },
  {
    symbol: 'xNKE', underlying: 'NKE', name: 'Nike Inc.', sector: SECTORS.CONSUMER,
    price: 78.32, change24h: -0.74, marketCap: '119B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '👟', description: 'Athletic footwear, apparel. Jordan, Air Max, Nike Direct e-commerce.',
    high52w: 108.35, low52w: 70.25, pe: 25.8, dividendYield: 2.46, beta: 0.84,
    volume24h: '8.4M', avgVolume: '7.8M', eps: 3.04,
  },
  {
    symbol: 'xMCD', underlying: 'MCD', name: 'McDonald\'s Corp.', sector: SECTORS.CONSUMER,
    price: 295.44, change24h: 0.14, marketCap: '215B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🍔', description: '45,000+ locations globally, franchise model, McCafe, digital ordering.',
    high52w: 318.48, low52w: 243.48, pe: 23.6, dividendYield: 2.50, beta: 0.72,
    volume24h: '3.8M', avgVolume: '3.6M', eps: 12.52,
  },
  {
    symbol: 'xSBUX', underlying: 'SBUX', name: 'Starbucks Corp.', sector: SECTORS.CONSUMER,
    price: 82.15, change24h: -0.44, marketCap: '92.8B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '☕', description: '36,000+ stores globally. Loyalty program (35M+ members), Cold Brew.',
    high52w: 112.72, low52w: 71.59, pe: 26.8, dividendYield: 2.72, beta: 0.84,
    volume24h: '7.8M', avgVolume: '7.2M', eps: 3.06,
  },
  {
    symbol: 'xHD', underlying: 'HD', name: 'Home Depot Inc.', sector: SECTORS.CONSUMER,
    price: 388.64, change24h: 0.24, marketCap: '388B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🔨', description: 'Home improvement retail, 2,300+ stores, Pro segment, SRS Distribution.',
    high52w: 425.46, low52w: 317.26, pe: 24.8, dividendYield: 2.39, beta: 1.08,
    volume24h: '3.8M', avgVolume: '3.6M', eps: 15.68,
  },
  // ── ENERGY ────────────────────────────────────────────────────────────────
  {
    symbol: 'xXOM', underlying: 'XOM', name: 'ExxonMobil Corp.', sector: SECTORS.ENERGY,
    price: 118.45, change24h: -0.74, marketCap: '472B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '⛽', description: 'Integrated oil & gas. Pioneer acquisition, Permian Basin, LNG, chemicals.',
    high52w: 132.73, low52w: 99.55, pe: 13.2, dividendYield: 3.48, beta: 0.95,
    volume24h: '18.4M', avgVolume: '17.1M', eps: 8.97,
  },
  {
    symbol: 'xCVX', underlying: 'CVX', name: 'Chevron Corp.', sector: SECTORS.ENERGY,
    price: 158.44, change24h: -0.54, marketCap: '286B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🛢️', description: 'Integrated energy. Hess acquisition, Permian Basin, Kazakhstan, LNG.',
    high52w: 176.93, low52w: 140.65, pe: 13.8, dividendYield: 4.64, beta: 0.89,
    volume24h: '9.8M', avgVolume: '9.2M', eps: 11.48,
  },
  // ── INDUSTRIAL ────────────────────────────────────────────────────────────
  {
    symbol: 'xBA', underlying: 'BA', name: 'Boeing Co.', sector: SECTORS.INDUSTRIAL,
    price: 178.32, change24h: 1.14, marketCap: '136B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '✈️', description: 'Commercial aircraft (737 MAX, 787), defense, space. Turnaround in progress.',
    high52w: 213.93, low52w: 137.01, pe: null, dividendYield: 0, beta: 1.42,
    volume24h: '6.4M', avgVolume: '6.0M', eps: -12.14,
  },
  {
    symbol: 'xCAT', underlying: 'CAT', name: 'Caterpillar Inc.', sector: SECTORS.INDUSTRIAL,
    price: 385.44, change24h: 0.44, marketCap: '192B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🚧', description: 'Construction & mining equipment, Caterpillar Financial Services.',
    high52w: 418.93, low52w: 314.55, pe: 17.8, dividendYield: 1.59, beta: 1.18,
    volume24h: '2.4M', avgVolume: '2.2M', eps: 21.65,
  },
  // ── ETFs & INDICES ────────────────────────────────────────────────────────
  {
    symbol: 'xSPY', underlying: 'SPY', name: 'SPDR S&P 500 ETF', sector: SECTORS.INDICES,
    price: 578.23, change24h: 0.45, marketCap: '611B', status: 'live',
    protocols: ['kamino', 'drift', 'marginfi', 'piggybank', 'orca'],
    logo: '📊', description: 'Tracks S&P 500. 500 largest US companies. Most liquid ETF in the world.',
    high52w: 614.35, low52w: 491.77, pe: 24.1, dividendYield: 1.24, beta: 1.0,
    volume24h: '82.4M', avgVolume: '78.2M', eps: 23.98,
  },
  {
    symbol: 'xQQQ', underlying: 'QQQ', name: 'Invesco Nasdaq-100 ETF', sector: SECTORS.INDICES,
    price: 494.18, change24h: 0.93, marketCap: '309B', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank', 'orca'],
    logo: '📈', description: 'Tracks Nasdaq-100. Top 100 non-financial tech companies.',
    high52w: 540.10, low52w: 410.43, pe: 33.2, dividendYield: 0.56, beta: 1.22,
    volume24h: '42.1M', avgVolume: '39.4M', eps: 14.88,
  },
  {
    symbol: 'xDIA', underlying: 'DIA', name: 'SPDR Dow Jones ETF', sector: SECTORS.INDICES,
    price: 441.76, change24h: 0.12, marketCap: '35.6B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🔷', description: 'Tracks Dow Jones Industrial Average. 30 blue-chip companies.',
    high52w: 459.11, low52w: 391.25, pe: 21.5, dividendYield: 1.58, beta: 0.92,
    volume24h: '4.2M', avgVolume: '4.0M', eps: 20.54,
  },
  {
    symbol: 'xIWM', underlying: 'IWM', name: 'iShares Russell 2000 ETF', sector: SECTORS.INDICES,
    price: 210.45, change24h: -0.34, marketCap: '67.4B', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '📉', description: 'Tracks Russell 2000. 2000 small-cap US stocks. Risk-on indicator.',
    high52w: 244.95, low52w: 185.74, pe: 19.4, dividendYield: 1.12, beta: 1.28,
    volume24h: '28.4M', avgVolume: '26.5M', eps: 10.85,
  },
  // ── COMMODITIES ───────────────────────────────────────────────────────────
  {
    symbol: 'xGOLD', underlying: 'GOLD', name: 'Gold Spot', sector: SECTORS.COMMODITIES,
    price: 3125.40, change24h: 0.68, marketCap: '~18.6T', status: 'live',
    protocols: ['kamino', 'drift', 'marginfi', 'piggybank', 'orca', 'raydium'],
    logo: '🥇', description: 'Tokenized spot gold. Safe haven asset. ATH territory in Q1 2026.',
    high52w: 3200.00, low52w: 2000.15, pe: null, dividendYield: 0, beta: -0.12,
    volume24h: '14.2M', avgVolume: '13.1M', eps: null,
  },
  {
    symbol: 'xSILVER', underlying: 'SILVER', name: 'Silver Spot', sector: SECTORS.COMMODITIES,
    price: 34.82, change24h: 1.24, marketCap: '~1.7T', status: 'live',
    protocols: ['kamino', 'drift', 'piggybank'],
    logo: '🥈', description: 'Tokenized spot silver. Industrial demand + monetary hedge.',
    high52w: 37.45, low52w: 22.10, pe: null, dividendYield: 0, beta: 0.08,
    volume24h: '8.4M', avgVolume: '7.8M', eps: null,
  },
  {
    symbol: 'xOIL', underlying: 'WTI', name: 'Crude Oil WTI', sector: SECTORS.COMMODITIES,
    price: 72.45, change24h: -1.15, marketCap: '—', status: 'live',
    protocols: ['kamino', 'piggybank'],
    logo: '🛢️', description: 'West Texas Intermediate crude oil benchmark. OPEC+ sensitive.',
    high52w: 95.03, low52w: 65.27, pe: null, dividendYield: 0, beta: 0.42,
    volume24h: '18.4M', avgVolume: '17.1M', eps: null,
  },
  // ── COMING SOON ───────────────────────────────────────────────────────────
  {
    symbol: 'xSOFI', underlying: 'SOFI', name: 'SoFi Technologies', sector: SECTORS.FINANCE,
    price: 14.32, change24h: 1.84, marketCap: '14.8B', status: 'coming_soon',
    protocols: [], logo: '💸',
    description: 'Digital personal finance app. Banking, investing, crypto, lending.',
    high52w: 17.52, low52w: 6.90, pe: 28.4, dividendYield: 0, beta: 1.92,
    volume24h: '28.4M', avgVolume: '26.5M', eps: 0.50,
  },
  {
    symbol: 'xSPOT', underlying: 'SPOT', name: 'Spotify Technology', sector: SECTORS.TECH,
    price: 632.45, change24h: 0.84, marketCap: '128B', status: 'coming_soon',
    protocols: [], logo: '🎵',
    description: 'Music & podcast streaming. 650M+ users, 240M+ premium subscribers.',
    high52w: 678.25, low52w: 264.93, pe: 112.4, dividendYield: 0, beta: 1.38,
    volume24h: '1.4M', avgVolume: '1.3M', eps: 5.63,
  },
  {
    symbol: 'xSNAP', underlying: 'SNAP', name: 'Snap Inc.', sector: SECTORS.TECH,
    price: 12.45, change24h: -1.24, marketCap: '20.2B', status: 'coming_soon',
    protocols: [], logo: '👻',
    description: 'Snapchat, AR glasses (Spectacles), Snap Map, advertising.',
    high52w: 17.34, low52w: 8.15, pe: null, dividendYield: 0, beta: 1.88,
    volume24h: '28.4M', avgVolume: '26.5M', eps: -0.77,
  },
  {
    symbol: 'xAXP', underlying: 'AXP', name: 'American Express', sector: SECTORS.FINANCE,
    price: 285.44, change24h: 0.34, marketCap: '205B', status: 'coming_soon',
    protocols: [], logo: '💎',
    description: 'Premium charge/credit cards, travel services, corporate expense management.',
    high52w: 319.40, low52w: 212.62, pe: 19.8, dividendYield: 1.05, beta: 1.18,
    volume24h: '2.4M', avgVolume: '2.2M', eps: 14.42,
  },
  {
    symbol: 'xISRG', underlying: 'ISRG', name: 'Intuitive Surgical', sector: SECTORS.HEALTH,
    price: 528.34, change24h: 0.64, marketCap: '188B', status: 'coming_soon',
    protocols: [], logo: '🤖',
    description: 'da Vinci robotic surgical systems, Ion bronchoscopy, 10,000+ installed worldwide.',
    high52w: 575.45, low52w: 350.72, pe: 72.4, dividendYield: 0, beta: 0.84,
    volume24h: '1.2M', avgVolume: '1.1M', eps: 7.30,
  },
  {
    symbol: 'xTSM', underlying: 'TSM', name: 'Taiwan Semiconductor', sector: SECTORS.TECH,
    price: 195.42, change24h: 1.24, marketCap: '1.01T', status: 'coming_soon',
    protocols: [], logo: '⚙️',
    description: 'World\'s largest semiconductor foundry. NVIDIA, Apple, AMD customer. 2nm chips.',
    high52w: 226.40, low52w: 127.43, pe: 24.8, dividendYield: 1.74, beta: 1.24,
    volume24h: '18.4M', avgVolume: '17.1M', eps: 7.88,
  },
  {
    symbol: 'xBRKA', underlying: 'BRK.A', name: 'Berkshire Hathaway A', sector: SECTORS.FINANCE,
    price: 724500, change24h: -0.14, marketCap: '1.14T', status: 'coming_soon',
    protocols: [], logo: '🏛️',
    description: 'Class A shares. Same as BRK.B × 1500. Fractionalized access via xStock.',
    high52w: 758000, low52w: 582000, pe: 22.4, dividendYield: 0, beta: 0.88,
    volume24h: 0.8, avgVolume: 0.7, eps: 32355,
  },
]

export const LIVE_COUNT = XSTOCKS_LIST.filter(x => x.status === 'live').length
export const COMING_SOON_COUNT = XSTOCKS_LIST.filter(x => x.status === 'coming_soon').length

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED PRNG — Deterministic random: same inputs = same outputs, always
// ─────────────────────────────────────────────────────────────────────────────

function cyrb128(str) {
  let h = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h = h2 ^ Math.imul(h ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h ^ Math.imul(h4 ^ k, 2716044179)
  }
  h = Math.imul(h3 ^ (h >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  return (h ^ h2) >>> 0
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CAGR DATA — Real long-term average annual returns
// Sources: S&P sector indices, Morningstar, CRSP (50-year averages)
// ─────────────────────────────────────────────────────────────────────────────

const SECTOR_CAGR = {
  'Technology':          0.145,  // ~14.5% (NASDAQ-heavy, 1975-2025 avg)
  'Finance & Banking':   0.098,  // ~9.8% (S&P Financials long-term)
  'Healthcare & Pharma': 0.104,  // ~10.4% (healthcare outperforms slightly)
  'Consumer':            0.092,  // ~9.2% (consumer staples + discretionary blend)
  'Energy':              0.072,  // ~7.2% (volatile, includes oil cycles)
  'Industrial':          0.094,  // ~9.4% (Dow Jones Industrial avg)
  'Commodities':         0.058,  // ~5.8% (gold ~7%, broad commodities lower)
  'ETFs & Indices':      0.105,  // ~10.5% (S&P 500 50-year CAGR)
  'Crypto-Adjacent':     0.18,   // ~18% (shorter history, high variance)
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE HISTORY — Deterministic simulation anchored to 52W data
// Uses seeded PRNG: same stock + same days = identical chart every time
// ─────────────────────────────────────────────────────────────────────────────

export function generateHistoricalData(stock, days = 365) {
  const rand = mulberry32(cyrb128(stock.symbol + ':hist:' + days))
  const data = []
  const today = new Date()

  // Start price consistent with 52W range
  const rangePosition = 0.35
  let price = stock.low52w + (stock.high52w - stock.low52w) * rangePosition

  const annualVol = Math.max(stock.beta * 0.18, 0.05)
  const dailyVol = annualVol / Math.sqrt(252)

  let currentVol = dailyVol
  const omegaGarch = dailyVol * 0.05
  const alphaGarch = 0.12
  const betaGarch = 0.83

  const avg52w = (stock.high52w + stock.low52w) / 2
  const impliedAnnualReturn = ((stock.price / price) - 1)
  const dailyDrift = impliedAnnualReturn / days

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const epsilon = (rand() * 2 - 1)
    const indicator = epsilon < 0 ? 1 : 0
    const gammaGarch = 0.08 * indicator
    const shock = epsilon * currentVol * price

    const meanRevForce = 0.01 * (avg52w - price) / price
    price = price * (1 + dailyDrift + meanRevForce) + shock
    price = Math.max(price, stock.low52w * 0.7)
    price = Math.min(price, stock.high52w * 1.15)

    currentVol = Math.sqrt(
      omegaGarch * omegaGarch +
      (alphaGarch + gammaGarch) * (epsilon * currentVol) * (epsilon * currentVol) +
      betaGarch * currentVol * currentVol
    )
    currentVol = Math.max(Math.min(currentVol, dailyVol * 3), dailyVol * 0.3)

    const avgVol = parseFloat(stock.avgVolume || '5') * 1e6
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(rand() * avgVol * 0.5 + avgVol * 0.75),
    })
  }

  data[data.length - 1].price = stock.price
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE PROJECTION — Pure compound growth based on real historical CAGR
// No random noise: projection = prix × (1 + CAGR)^(jours/365)
// Fan chart uses volatility for confidence bands (deterministic)
// ─────────────────────────────────────────────────────────────────────────────

export function generateProjectionFan(stock, days = 180) {
  const annualVol = Math.max(stock.beta * 0.18, 0.05)
  const annualDrift = SECTOR_CAGR[stock.sector] ?? 0.105
  const calYears = days / 365

  const expectedReturn = Math.pow(1 + annualDrift, calYears)
  const totalVol = annualVol * Math.sqrt(calYears)

  const terminalTargets = {
    p10: stock.price * Math.max(expectedReturn * (1 - 1.28 * totalVol), 0.1),
    p25: stock.price * Math.max(expectedReturn * (1 - 0.67 * totalVol), 0.15),
    p50: stock.price * expectedReturn,
    p75: stock.price * expectedReturn * (1 + 0.67 * totalVol),
    p90: stock.price * expectedReturn * (1 + 1.28 * totalVol),
  }

  const results = {}
  const today = new Date()
  const scenarioKeys = Object.keys(terminalTargets)

  for (const [key, terminal] of Object.entries(terminalTargets)) {
    const path = []
    const logStart = Math.log(stock.price)
    const logEnd = Math.log(Math.max(terminal, stock.price * 0.05))

    for (let i = 1; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const progress = i / days
      const basePx = Math.exp(logStart + (logEnd - logStart) * progress)
      const ripple = Math.sin(i * 0.05 + scenarioKeys.indexOf(key) * 1.2) * basePx * 0.008 * Math.sqrt(progress)
      const price = Math.max(basePx + ripple, stock.low52w * 0.3)
      path.push({ date: date.toISOString().split('T')[0], price: parseFloat(price.toFixed(2)) })
    }
    results[key] = path
  }

  return results
}

// ─── Scenario projection — Pure compound growth, NO random ──────────────────
// growthBias = % annuel (ex: 15 = +15%/an)
// Courbe = prix actuel × (1 + bias%)^(jour/365), lisse et déterministe
export function generateProjection(stock, days = 180, growthBias = 0) {
  const data = []
  const today = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    // Pure compound growth — no noise, no random
    const price = stock.price * Math.pow(1 + growthBias / 100, i / 365)
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      type: 'projection',
    })
  }
  return data
}

// ─── Dividend projection — Cumulative dividends along a price path ──────────
// Uses stock.dividendYield (e.g. 0.44 = 0.44%/an for Apple)
export function computeDividendProjection(stock, scenarioData) {
  const annualYield = (stock.dividendYield || 0) / 100
  const dailyYield = annualYield / 365
  let cumulativeDividends = 0

  return scenarioData.map(point => {
    const dailyDiv = point.price * dailyYield
    cumulativeDividends += dailyDiv
    return {
      ...point,
      cumulativeDividends: parseFloat(cumulativeDividends.toFixed(2)),
      totalReturn: parseFloat((point.price + cumulativeDividends).toFixed(2)),
    }
  })
}
