// ─────────────────────────────────────────────────────────────────────────────
// Wallet Data — read-only on-chain xStock holdings for a Solana address
// No wallet connection / no signing: the user pastes a public address, we read.
// xStocks are SPL Token-2022 mints (vanity prefix "Xs"); we also check the classic
// Token program as a safety net. Prices overlay via Pyth in the UI layer.
// ─────────────────────────────────────────────────────────────────────────────

import { STOCKS_BY_MINT } from '../data/xstocks'

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

/**
 * Read all xStock holdings for a public Solana address.
 * @returns {Promise<Array<{ mint, qty, stock }>>} sorted by descending quantity
 */
export async function fetchWalletHoldings(address, rpcUrl = DEFAULT_RPC) {
  const addr = (address || '').trim()
  if (!isValidSolanaAddress(addr)) throw new Error('Adresse Solana invalide')

  // Query both token programs (xStocks are Token-2022; classic is a safety net)
  const settled = await Promise.allSettled([
    tokenAccountsFor(rpcUrl, addr, TOKEN_2022_PROGRAM),
    tokenAccountsFor(rpcUrl, addr, TOKEN_PROGRAM),
  ])
  if (settled.every(s => s.status === 'rejected')) {
    throw new Error(settled[0].reason?.message || 'Lecture RPC impossible')
  }
  const accounts = settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []))

  const holdings = []
  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info
    if (!info) continue
    const stock = STOCKS_BY_MINT[info.mint]
    if (!stock) continue
    const qty = info.tokenAmount?.uiAmount ?? 0
    if (qty > 0) holdings.push({ mint: info.mint, qty, stock })
  }
  // Merge any split across multiple token accounts of the same mint
  const byMint = {}
  for (const h of holdings) {
    if (byMint[h.mint]) byMint[h.mint].qty += h.qty
    else byMint[h.mint] = { ...h }
  }
  return Object.values(byMint).sort((a, b) => b.qty - a.qty)
}
