// ─────────────────────────────────────────────────────────────────────────────
// LP Positions — read a wallet's Raydium CLMM + Orca Whirlpool xStock liquidity
// on-chain (no SDK, just RPC getMultipleAccounts). xStocks are CLMM/Whirlpool only.
// Layouts + math verified live (see scripts/test_lp_math via the AAPLx/USDC example).
// ─────────────────────────────────────────────────────────────────────────────

import { PublicKey } from '@solana/web3.js'
import { STOCKS_BY_MINT } from '../data/xstocks'

const RAYDIUM_CLMM = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')
const ORCA_WHIRLPOOL = new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc')
const POS_SEED = new TextEncoder().encode('position')

// Account discriminators (first 8 bytes, hex)
const RAY_POS_DISC = '466f967ee60f1975'
const RAY_POOL_DISC = 'f7ede3f5d7c3de46'
const ORCA_POS_DISC = 'aabc8fe47a40f7d0'
const ORCA_POOL_DISC = '3f95d10ce1806309'

const Q64 = 1n << 64n
const XSTOCK_DECIMALS = 8 // Backed xStocks (Token-2022) are 8-decimals

// ── byte helpers ────────────────────────────────────────────────────────────
function b64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const hex8 = (b) => [...b.slice(0, 8)].map(x => x.toString(16).padStart(2, '0')).join('')
function u128LE(b, o) { let r = 0n; for (let i = 15; i >= 0; i--) r = (r << 8n) | BigInt(b[o + i]); return r }
function i32LE(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) | 0 }
const u8 = (b, o) => b[o]
const pk = (b, o) => new PublicKey(b.slice(o, o + 32)).toBase58()

// ── concentrated-liquidity math (Uniswap-v3, Q64.64) ────────────────────────
const sqrtAtTick = (tick) => BigInt(Math.floor(Math.pow(1.0001, tick / 2) * Math.pow(2, 64)))
function getAmounts(L, tickLower, tickUpper, sp) {
  let sa = sqrtAtTick(tickLower), sb = sqrtAtTick(tickUpper)
  if (sa > sb) { const t = sa; sa = sb; sb = t }
  let a0 = 0n, a1 = 0n
  if (sp <= sa) { a0 = (L * (sb - sa) * Q64) / (sb * sa) }
  else if (sp < sb) { a0 = (L * (sb - sp) * Q64) / (sb * sp); a1 = (L * (sp - sa)) / Q64 }
  else { a1 = (L * (sb - sa)) / Q64 }
  return [a0, a1]
}

// ── RPC (with light retry — public RPCs rate-limit getMultipleAccounts) ───────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function rpc(rpcUrl, method, params, attempt = 0) {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    // 403/429/5xx from public RPCs are throttling — back off and retry
    if (!res.ok) throw new Error(`RPC ${res.status}`)
    const j = await res.json()
    if (j.error) throw new Error(j.error.message || 'RPC error')
    return j.result
  } catch (e) {
    if (attempt < 5) { await sleep(Math.min(800 * 2 ** attempt, 6000)); return rpc(rpcUrl, method, params, attempt + 1) }
    throw e
  }
}

// Public RPCs (e.g. publicnode) cap getMultipleAccounts at ~10 keys per call, so
// chunk small. Chunks run sequentially to stay gentle on free-tier rate limits.
const GMA_CHUNK = 10
async function getMultipleAccounts(rpcUrl, pubkeys) {
  const out = {}
  for (let i = 0; i < pubkeys.length; i += GMA_CHUNK) {
    const chunk = pubkeys.slice(i, i + GMA_CHUNK)
    const r = await rpc(rpcUrl, 'getMultipleAccounts', [chunk, { encoding: 'base64' }])
    ;(r?.value || []).forEach((acc, j) => { out[chunk[j]] = acc })
  }
  return out
}

const positionPDA = (nftMint, program) =>
  PublicKey.findProgramAddressSync([POS_SEED, new PublicKey(nftMint).toBytes()], program)[0].toBase58()

/**
 * Given the wallet's candidate position-NFT mints, return xStock LP holdings.
 * @returns {Promise<Array<{ mint, qty, stock, source:'lp', venue }>>}
 */
export async function fetchLpHoldings(nftMints, rpcUrl) {
  if (!nftMints?.length || !rpcUrl) return []

  // Each NFT could be a Raydium or an Orca position — derive both PDAs.
  const cand = []
  for (const nft of nftMints) {
    try { cand.push({ pda: positionPDA(nft, RAYDIUM_CLMM), venue: 'raydium' }) } catch { /* bad mint */ }
    try { cand.push({ pda: positionPDA(nft, ORCA_WHIRLPOOL), venue: 'orca' }) } catch { /* bad mint */ }
  }

  let accs
  try { accs = await getMultipleAccounts(rpcUrl, cand.map(c => c.pda)) }
  catch (e) { console.warn('[LP] lecture positions impossible (RPC):', e?.message, '— un RPC Helius est recommandé pour les LP'); return [] }

  const positions = []
  const poolIds = new Set()
  for (const c of cand) {
    const acc = accs[c.pda]
    if (!acc?.data?.[0]) continue
    const b = b64ToBytes(acc.data[0])
    const disc = hex8(b)
    if (c.venue === 'raydium' && disc === RAY_POS_DISC) {
      const poolId = pk(b, 41)
      positions.push({ venue: 'raydium', poolId, tl: i32LE(b, 73), tu: i32LE(b, 77), L: u128LE(b, 81) })
      poolIds.add(poolId)
    } else if (c.venue === 'orca' && disc === ORCA_POS_DISC) {
      const poolId = pk(b, 8)
      positions.push({ venue: 'orca', poolId, L: u128LE(b, 72), tl: i32LE(b, 88), tu: i32LE(b, 92) })
      poolIds.add(poolId)
    }
  }
  if (!positions.length) return []

  let poolAccs
  try { poolAccs = await getMultipleAccounts(rpcUrl, [...poolIds]) } catch { return [] }

  const pools = {}
  for (const id of poolIds) {
    const acc = poolAccs[id]
    if (!acc?.data?.[0]) continue
    const b = b64ToBytes(acc.data[0])
    const disc = hex8(b)
    if (disc === RAY_POOL_DISC) {
      pools[id] = { mint0: pk(b, 73), mint1: pk(b, 105), sqrt: u128LE(b, 253) }
    } else if (disc === ORCA_POOL_DISC) {
      pools[id] = { mint0: pk(b, 101), mint1: pk(b, 181), sqrt: u128LE(b, 65) }
    }
  }

  const out = []
  for (const p of positions) {
    const pool = pools[p.poolId]
    if (!pool) continue
    const [a0, a1] = getAmounts(p.L, p.tl, p.tu, pool.sqrt)
    for (const [mint, raw] of [[pool.mint0, a0], [pool.mint1, a1]]) {
      const stock = STOCKS_BY_MINT[mint]
      if (!stock) continue
      const qty = Number(raw) / 10 ** XSTOCK_DECIMALS
      if (qty > 0) out.push({ mint, qty, stock, source: 'lp', venue: p.venue })
    }
  }
  return out
}
