// ─────────────────────────────────────────────────────────────────────────────
// React hooks — Live prices (Pyth) + Live TVL (DeFiLlama)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchXStockLivePrices, fetchLiveTVLs, isMarketOpen, formatTVL } from '../services/liveData'

const PRICE_REFRESH_MS = 30_000        // 30 s — Pyth rate limit safe
const TVL_REFRESH_MS   = 5 * 60_000   // 5 min — DeFiLlama polite polling

// ── useLivePrices ─────────────────────────────────────────────────────────────
/**
 * Fetch live Pyth prices for a list of xStock symbols.
 * Auto-refreshes every 30 s during market hours, every 2 min otherwise.
 *
 * @param {string[]} symbols  e.g. ['xAAPL','xNVDA','xSPY']
 * @returns {{ prices, loading, error, lastUpdate, marketOpen }}
 */
export function useLivePrices(symbols = []) {
  const [prices, setPrices]       = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const symbolKey = symbols.join(',') // stable dep

  const doFetch = useCallback(async () => {
    if (!symbols.length) { setLoading(false); return }
    try {
      const data = await fetchXStockLivePrices(symbols)
      setPrices(prev => ({ ...prev, ...data }))
      setLastUpdate(Date.now())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey])

  useEffect(() => {
    doFetch()
    const marketOpen = isMarketOpen()
    const interval = marketOpen ? PRICE_REFRESH_MS : PRICE_REFRESH_MS * 4
    const id = setInterval(doFetch, interval)
    return () => clearInterval(id)
  }, [doFetch])

  return { prices, loading, error, lastUpdate, marketOpen: isMarketOpen() }
}

// ── useLiveTVLs ───────────────────────────────────────────────────────────────
/**
 * Fetch live TVL from DeFiLlama for all known protocols.
 * Refreshes every 5 minutes.
 *
 * @returns {{ tvls, tvlsFormatted, loading }}
 *   tvls: { protocolId: number | null }
 *   tvlsFormatted: { protocolId: string | null }  (e.g. "$2.8B")
 */
export function useLiveTVLs() {
  const [tvls, setTvls]     = useState({})
  const [loading, setLoading] = useState(true)
  const fetchedOnce = useRef(false)

  const doFetch = useCallback(async () => {
    try {
      const data = await fetchLiveTVLs()
      setTvls(data)
      fetchedOnce.current = true
    } catch {
      // Silent — keep previous data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doFetch()
    const id = setInterval(doFetch, TVL_REFRESH_MS)
    return () => clearInterval(id)
  }, [doFetch])

  const tvlsFormatted = Object.fromEntries(
    Object.entries(tvls).map(([id, val]) => [id, formatTVL(val)])
  )

  return { tvls, tvlsFormatted, loading }
}
