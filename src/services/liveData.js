// ─────────────────────────────────────────────────────────────────────────────
// Live Data Service — Pyth Network (prices) + DeFiLlama (TVL/APY)
// Pyth Hermes API: https://hermes.pyth.network/v2
// DeFiLlama: https://api.llama.fi / https://yields.llama.fi
// ─────────────────────────────────────────────────────────────────────────────

const HERMES_URL = 'https://hermes.pyth.network/v2'
const DEFILLAMA_TVL_URL = 'https://api.llama.fi'
const DEFILLAMA_YIELDS_URL = 'https://yields.llama.fi'

// ── Pyth Price Feed IDs for xStock underlying assets ─────────────────────────
// Source: https://pyth.network/developers/price-feed-ids (Equity.US + Metals)
// All IDs without 0x prefix (as returned by Hermes API)
export const PYTH_FEED_IDS = {
  // Magnificent 7
  'AAPL':   '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  'MSFT':   'd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1',
  'GOOGL':  '5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6',
  'AMZN':   'b5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a',
  'META':   '78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe',
  'NVDA':   'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  'TSLA':   '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  // Tech
  'NFLX':   '8376cfd7ca8bcdf372ced05307b24dced1f15b1afafdeff715664598f15a3dd2',
  'AMD':    '3622e381dbca2efd1859253763b1adc63f7f9abb8e76da1aa8e638a57ccde93e',
  // Finance
  'JPM':    '7f4f157e57bfcccd934c566df536f34933e74338fe241a5425ce561acdab164e',
  'V':      'c719eb7bab9b2bc060167f1d1680eb34a29c490919072513b545b9785b73ee90',
  // ETFs
  'SPY':    '19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5',
  'QQQ':    '9695e2b96ea7b3859da9ed25b7a46a920a776e2fdae19a7bcfdf2b219230452d',
  // Commodities
  'GOLD':   '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2', // XAU/USD
  'SILVER': 'f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e', // XAG/USD
}

// xStock symbol → underlying (reverse map for non-standard names)
const XSTOCK_TO_UNDERLYING = {
  'xGOLD':   'GOLD',
  'xSILVER': 'SILVER',
}

// Cache for dynamically discovered feed IDs
const FEED_CACHE_KEY = 'pyth_feed_ids_v1'
const FEED_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function loadFeedCache() {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY)
    if (!raw) return {}
    const { data, time } = JSON.parse(raw)
    if (Date.now() - time > FEED_CACHE_TTL) return {}
    return data
  } catch { return {} }
}

function saveFeedCache(data) {
  try {
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ data, time: Date.now() }))
  } catch {}
}

/**
 * Discover Pyth feed ID for a single stock symbol via search API
 */
async function discoverFeedId(symbol) {
  try {
    const res = await fetch(`${HERMES_URL}/price_feeds?query=${symbol}&asset_type=equity&encoding=hex`)
    if (!res.ok) return null
    const feeds = await res.json()
    // Find exact US equity match
    const exact = feeds.find(f =>
      f.attributes?.base === symbol &&
      f.attributes?.quote_currency === 'USD' &&
      (f.attributes?.country === 'US' || !f.attributes?.country)
    )
    return exact?.id?.replace('0x', '') ?? null
  } catch { return null }
}

/**
 * Get feed IDs for a list of underlying symbols (hardcoded + dynamic discovery)
 */
export async function resolveFeedIds(underlyings) {
  const cached = loadFeedCache()
  const result = { ...PYTH_FEED_IDS }
  const toDiscover = underlyings.filter(sym => !result[sym] && !cached[sym])

  // Batch discover missing IDs (max 5 at a time to avoid rate limits)
  if (toDiscover.length > 0) {
    const chunks = []
    for (let i = 0; i < toDiscover.length; i += 5) chunks.push(toDiscover.slice(i, i + 5))
    for (const chunk of chunks) {
      const discovered = await Promise.allSettled(chunk.map(async sym => [sym, await discoverFeedId(sym)]))
      for (const res of discovered) {
        if (res.status === 'fulfilled' && res.value[1]) cached[res.value[0]] = res.value[1]
      }
    }
    saveFeedCache({ ...cached, ...PYTH_FEED_IDS })
  }

  return { ...result, ...cached }
}

/**
 * Parse Pyth price from raw format: price * 10^expo
 */
export function parsePythPrice({ price, expo }) {
  return parseFloat(price) * Math.pow(10, parseInt(expo))
}

/**
 * Check if a Pyth price is stale (>5 min old — market hours threshold)
 */
export function isPriceStale(publishTime) {
  const now = Math.floor(Date.now() / 1000)
  return (now - publishTime) > 300
}

/**
 * Is it currently US market hours? (9:30–16:00 ET, Mon–Fri)
 */
export function isMarketOpen() {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const h = et.getHours()
  const m = et.getMinutes()
  const mins = h * 60 + m
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960 // 9:30–16:00
}

/**
 * Fetch latest prices from Pyth Hermes for given feed IDs
 */
export async function fetchPythPrices(feedIds) {
  if (!feedIds?.length) return {}
  const ids = [...new Set(feedIds)] // dedupe
  const params = ids.map(id => `ids[]=${id}`).join('&')
  const res = await fetch(`${HERMES_URL}/updates/price/latest?${params}&parsed=true`)
  if (!res.ok) throw new Error(`Pyth API ${res.status}`)
  const json = await res.json()
  const result = {}
  for (const item of json.parsed ?? []) {
    result[item.id] = item.price
  }
  return result
}

/**
 * Main function: fetch live prices for all xStocks
 * Returns: { xSymbol: { price, change24h?, isLive, publishTime } }
 */
export async function fetchXStockLivePrices(xStocksSymbols) {
  // Build underlying → xSymbol map
  const underlyings = xStocksSymbols.map(sym => XSTOCK_TO_UNDERLYING[sym] ?? sym.slice(1))
  const feedIds = await resolveFeedIds([...new Set(underlyings)])

  // Collect all feed IDs we can resolve
  const entries = xStocksSymbols.map(xSym => {
    const underlying = XSTOCK_TO_UNDERLYING[xSym] ?? xSym.slice(1)
    const feedId = feedIds[underlying]
    return { xSym, underlying, feedId }
  }).filter(e => e.feedId)

  if (!entries.length) return {}

  const priceData = await fetchPythPrices(entries.map(e => e.feedId))
  const result = {}

  for (const { xSym, feedId } of entries) {
    const raw = priceData[feedId]
    if (!raw) continue
    const price = parsePythPrice(raw)
    const stale = isPriceStale(raw.publish_time)
    if (price > 0) {
      result[xSym] = { price: parseFloat(price.toFixed(2)), isLive: !stale, publishTime: raw.publish_time }
    }
  }
  return result
}

// ── DeFiLlama Integration ─────────────────────────────────────────────────────

// Map: protocolId → DeFiLlama slug
const DEFILLAMA_SLUGS = {
  kamino:      'kamino-lend',
  orca:        'orca',
  raydium:     'raydium',
  jupiter:     'jupiter',
  drift:       'drift',
  marginfi:    'marginfi',
  titan:       'titan-exchange',
  piggybank:   'piggybank-finance',
  hyperliquid: 'hyperliquid',
}

// Map: protocolId → DeFiLlama yields project name (for matching pools)
export const DEFILLAMA_YIELD_PROJECTS = {
  kamino:      'kamino-lend',
  orca:        'orca',
  raydium:     'raydium',
  jupiter:     'jupiter-perps',
  drift:       'drift',
  marginfi:    'marginfi',
  hyperliquid: 'hyperliquid',
}

/**
 * Fetch live TVL for a single protocol
 */
async function fetchProtocolTVL(slug) {
  const res = await fetch(`${DEFILLAMA_TVL_URL}/tvl/${slug}`)
  if (!res.ok) return null
  const tvl = await res.json()
  return typeof tvl === 'number' ? tvl : null
}

/**
 * Fetch live TVL for all known protocols in parallel
 * Returns: { protocolId: tvlUSD | null }
 */
export async function fetchLiveTVLs() {
  const results = {}
  await Promise.allSettled(
    Object.entries(DEFILLAMA_SLUGS).map(async ([id, slug]) => {
      results[id] = await fetchProtocolTVL(slug)
    })
  )
  return results
}

/**
 * Format TVL number to human-readable string
 */
export function formatTVL(tvl) {
  if (!tvl || tvl <= 0) return null
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(0)}M`
  return `$${tvl.toLocaleString()}`
}

// ── DeFiLlama Yields API ─────────────────────────────────────────────────────

const YIELDS_CACHE_KEY = 'defillama_yields_v1'
const YIELDS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Fetch all yield pools from DeFiLlama, filtered to Solana + our protocols
 * Returns: array of pool objects { pool, chain, project, symbol, tvlUsd, apy, apyBase, apyReward, ... }
 */
export async function fetchDeFiLlamaYields() {
  // Check cache
  try {
    const raw = localStorage.getItem(YIELDS_CACHE_KEY)
    if (raw) {
      const { data, time } = JSON.parse(raw)
      if (Date.now() - time < YIELDS_CACHE_TTL) return data
    }
  } catch {}

  const res = await fetch(`${DEFILLAMA_YIELDS_URL}/pools`)
  if (!res.ok) throw new Error(`DeFiLlama yields ${res.status}`)
  const json = await res.json()

  const projectNames = new Set(Object.values(DEFILLAMA_YIELD_PROJECTS))

  // Filter: Solana chain + our known projects, OR Hyperliquid L1
  const filtered = (json.data || []).filter(pool => {
    if (!projectNames.has(pool.project)) return false
    if (pool.project === 'hyperliquid') return true // HyperLiquid is on its own L1
    return pool.chain === 'Solana'
  })

  // Cache results
  try {
    localStorage.setItem(YIELDS_CACHE_KEY, JSON.stringify({ data: filtered, time: Date.now() }))
  } catch {}

  return filtered
}

/**
 * Fetch TVL history for a protocol (for sparklines)
 * Returns: array of { date, totalLiquidityUSD }
 */
export async function fetchProtocolTVLHistory(protocolId) {
  const slug = DEFILLAMA_SLUGS[protocolId]
  if (!slug) return []

  const cacheKey = `tvl_history_${slug}`
  try {
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const { data, time } = JSON.parse(raw)
      if (Date.now() - time < 15 * 60 * 1000) return data
    }
  } catch {}

  try {
    const res = await fetch(`${DEFILLAMA_TVL_URL}/protocol/${slug}`)
    if (!res.ok) return []
    const json = await res.json()
    const history = (json.tvl || []).slice(-90).map(p => ({
      date: new Date(p.date * 1000).toISOString().split('T')[0],
      tvl: p.totalLiquidityUSD,
    }))

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data: history, time: Date.now() }))
    } catch {}

    return history
  } catch {
    return []
  }
}
