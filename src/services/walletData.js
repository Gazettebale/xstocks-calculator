// ─────────────────────────────────────────────────────────────────────────────
// Wallet Data — read-only on-chain xStock holdings for a Solana address
// No wallet connection / no signing: the user pastes a public address, we read.
// xStocks are SPL Token-2022 mints (vanity prefix "Xs"); we also check the classic
// Token program as a safety net. Prices overlay via Pyth in the UI layer.
// ─────────────────────────────────────────────────────────────────────────────

import { STOCKS_BY_MINT } from '../data/xstocks'
import { fetchLpHoldings } from './lpPositions'

// Public CORS-enabled RPC by default. Override with VITE_SOLANA_RPC (e.g. a Helius
// URL) for reliability, or let the user paste their own RPC in the UI.
export const DEFAULT_RPC =
  import.meta.env.VITE_SOLANA_RPC || 'https://solana-rpc.publicnode.com'

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

// base58, 32–44 chars — good-enough Solana address shape check
export function isValidSolanaAddress(addr) {
  return typeof addr === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim())
}

export function shortAddress(addr, n = 4) {
  if (!addr) return ''
  return `${addr.slice(0, n)}…${addr.slice(-n)}`
}

async function rpc(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!res.ok) throw new Error(`RPC ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message || 'RPC error')
  return json.result
}

async function tokenAccountsFor(rpcUrl, address, programId) {
  const result = await rpc(rpcUrl, 'getTokenAccountsByOwner', [
    address,
    { programId },
    { encoding: 'jsonParsed' },
  ])
  return result?.value ?? []
}

// Fetch all token accounts (both token programs) once.
async function fetchRawTokenAccounts(addr, rpcUrl) {
  const settled = await Promise.allSettled([
    tokenAccountsFor(rpcUrl, addr, TOKEN_2022_PROGRAM),
    tokenAccountsFor(rpcUrl, addr, TOKEN_PROGRAM),
  ])
  if (settled.every(s => s.status === 'rejected')) {
    throw new Error(settled[0].reason?.message || 'Lecture RPC impossible')
  }
  return settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []))
}

// From raw token accounts: spot xStock holdings + candidate LP-position NFT mints.
function extractSpotAndNfts(accounts) {
  const spotByMint = {}
  const nftMints = []
  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info
    if (!info) continue
    const amt = info.tokenAmount
    // Candidate position NFT: exactly 1 token, 0 decimals
    if (amt?.decimals === 0 && amt?.amount === '1') nftMints.push(info.mint)
    const stock = STOCKS_BY_MINT[info.mint]
    if (!stock) continue
    const qty = amt?.uiAmount ?? 0
    if (qty > 0) spotByMint[info.mint] = { mint: info.mint, qty: (spotByMint[info.mint]?.qty || 0) + qty, stock }
  }
  return { spot: Object.values(spotByMint), nftMints }
}

/**
 * Read all xStock holdings for a public Solana address.
 * @returns {Promise<Array<{ mint, qty, stock }>>} sorted by descending quantity
 */
export async function fetchWalletHoldings(address, rpcUrl = DEFAULT_RPC) {
  const addr = (address || '').trim()
  if (!isValidSolanaAddress(addr)) throw new Error('Adresse Solana invalide')
  const accounts = await fetchRawTokenAccounts(addr, rpcUrl)
  return extractSpotAndNfts(accounts).spot.sort((a, b) => b.qty - a.qty)
}

// ── Kamino lending positions ────────────────────────────────────────────────
// xStocks deposited on Kamino leave the wallet, so getTokenAccountsByOwner can't
// see them. Kamino's public API (CORS-open, no key) exposes per-wallet obligations.
const KAMINO_API = 'https://api.kamino.finance'
const ZERO_PUBKEY = '11111111111111111111111111111111'
const SF_SCALE = 2 ** 60 // marketValueSf is a scaled fraction: USD = value / 2^60

async function kFetch(path) {
  const r = await fetch(`${KAMINO_API}${path}`)
  if (!r.ok) throw new Error(`Kamino ${r.status}`)
  return r.json()
}

export async function fetchKaminoHoldings(address) {
  let markets
  try { markets = await kFetch('/v2/kamino-market') } catch { return [] }
  const marketAddrs = markets.map(m => m.lendingMarket).filter(Boolean)

  // Per-market obligations for this wallet (parallel, tolerate per-market failure)
  const perMarket = await Promise.allSettled(
    marketAddrs.map(async (m) => ({
      market: m,
      obligations: await kFetch(`/kamino-market/${m}/users/${address}/obligations`).catch(() => []),
    }))
  )

  // Collect non-zero collateral deposits (reserve + USD scaled-fraction)
  const hits = []
  for (const res of perMarket) {
    if (res.status !== 'fulfilled') continue
    const { market, obligations } = res.value
    if (!Array.isArray(obligations)) continue
    for (const ob of obligations) {
      for (const d of ob?.state?.deposits || []) {
        if (!d?.depositReserve || d.depositReserve === ZERO_PUBKEY) continue
        if (!d.marketValueSf || d.marketValueSf === '0') continue
        hits.push({ market, reserve: d.depositReserve, mvSf: d.marketValueSf })
      }
    }
  }
  if (!hits.length) return []

  // reserve → underlying mint (only fetch metrics for markets that have hits)
  const reserveToMint = {}
  await Promise.allSettled([...new Set(hits.map(h => h.market))].map(async (m) => {
    const reserves = await kFetch(`/kamino-market/${m}/reserves/metrics`).catch(() => [])
    for (const r of reserves) reserveToMint[r.reserve] = r.liquidityTokenMint
  }))

  // mint → USD price (to convert USD value back to an underlying token quantity)
  const priceByMint = {}
  try {
    for (const p of await kFetch('/prices?source=scope')) priceByMint[p.mint] = parseFloat(p.usdPrice)
  } catch { /* fall back to static price below */ }

  const out = []
  for (const h of hits) {
    const mint = reserveToMint[h.reserve]
    const stock = mint && STOCKS_BY_MINT[mint]
    if (!stock) continue
    let usd = 0
    try { usd = Number(BigInt(h.mvSf)) / SF_SCALE } catch { usd = 0 }
    const price = priceByMint[mint] || stock.price || 0
    const qty = price > 0 ? usd / price : 0
    if (qty > 0) out.push({ mint, qty, stock, source: 'kamino', usd })
  }
  return out
}

// ── Combined: spot wallet + Kamino lending + Raydium/Orca LP ─────────────────
// Merged per mint with a per-source quantity split. One token-account fetch feeds
// both the spot holdings and the LP-position-NFT discovery.
export async function fetchAllHoldings(address, rpcUrl = DEFAULT_RPC) {
  const addr = (address || '').trim()
  if (!isValidSolanaAddress(addr)) throw new Error('Adresse Solana invalide')

  // Spot + NFT candidates (one fetch). If this fails entirely, we still try Kamino.
  let spot = [], nftMints = []
  let spotFailed = false
  try {
    const { spot: s, nftMints: n } = extractSpotAndNfts(await fetchRawTokenAccounts(addr, rpcUrl))
    spot = s; nftMints = n
  } catch { spotFailed = true }

  const [kaminoRes, lpRes] = await Promise.allSettled([
    fetchKaminoHoldings(addr),
    fetchLpHoldings(nftMints, rpcUrl),
  ])
  const kamino = kaminoRes.status === 'fulfilled' ? kaminoRes.value : []
  const lp = lpRes.status === 'fulfilled' ? lpRes.value : []

  if (spotFailed && !kamino.length && !lp.length) {
    throw new Error('Lecture wallet impossible (RPC ou réseau)')
  }

  const byMint = {}
  const add = (mint, qty, stock, source) => {
    if (!byMint[mint]) byMint[mint] = { mint, qty: 0, stock, sources: {} }
    byMint[mint].qty += qty
    byMint[mint].sources[source] = (byMint[mint].sources[source] || 0) + qty
  }
  spot.forEach(h => add(h.mint, h.qty, h.stock, 'wallet'))
  kamino.forEach(h => add(h.mint, h.qty, h.stock, 'kamino'))
  lp.forEach(h => add(h.mint, h.qty, h.stock, 'lp'))
  return Object.values(byMint).sort((a, b) => b.qty - a.qty)
}
