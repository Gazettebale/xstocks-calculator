import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchAllHoldings, isValidSolanaAddress } from '../services/walletData'

// Read-only wallet store: holds the pasted address + optional custom RPC, and the
// last-fetched xStock holdings. Only address + rpcUrl are persisted; holdings are
// re-fetched on demand so values stay fresh.
const useWalletStore = create(
  persist(
    (set, get) => ({
      address: '',
      rpcUrl: '',          // '' → use DEFAULT_RPC
      holdings: [],        // [{ mint, qty, stock }]
      loading: false,
      error: null,
      lastSync: null,
      // Cost basis snapshotted from first tracking → enables a PnL that grows over
      // time without a 3rd-party API. { mint: { avgEntry, qty, since } }
      costBasis: {},

      setRpcUrl: (rpcUrl) => set({ rpcUrl: rpcUrl.trim() }),

      // Update the average entry price from current holdings + live prices.
      // New holding → snapshot at current price. Bought more → weighted average.
      // Sold → keep avg, lower qty. Call after holdings load (idempotent on price).
      reconcileCostBasis: (priceOf) => set(state => {
        const cb = { ...state.costBasis }
        for (const h of state.holdings) {
          const px = (priceOf && priceOf(h.stock.symbol)) || h.stock.price || 0
          if (!px) continue
          const prev = cb[h.mint]
          if (!prev) {
            cb[h.mint] = { avgEntry: px, qty: h.qty, since: Date.now() }
          } else if (h.qty > prev.qty + 1e-9) {
            const added = h.qty - prev.qty
            cb[h.mint] = { avgEntry: (prev.avgEntry * prev.qty + px * added) / h.qty, qty: h.qty, since: prev.since }
          } else if (h.qty < prev.qty - 1e-9) {
            cb[h.mint] = { ...prev, qty: h.qty }
          }
        }
        return { costBasis: cb }
      }),

      resetCostBasis: () => set({ costBasis: {} }),

      connect: async (rawAddress) => {
        const address = (rawAddress ?? '').trim()
        if (!isValidSolanaAddress(address)) {
          set({ error: 'Adresse Solana invalide', address })
          return false
        }
        set({ address, loading: true, error: null })
        try {
          const holdings = await fetchAllHoldings(address, get().rpcUrl || undefined)
          set({ holdings, loading: false, lastSync: Date.now() })
          return true
        } catch (e) {
          set({ error: e?.message || 'Erreur de lecture du wallet', loading: false })
          return false
        }
      },

      refresh: async () => {
        const { address } = get()
        if (address) return get().connect(address)
      },

      disconnect: () => set({ address: '', holdings: [], error: null, lastSync: null }),
    }),
    {
      name: 'xstocks-wallet',
      version: 1,
      partialize: (s) => ({ address: s.address, rpcUrl: s.rpcUrl, costBasis: s.costBasis }),
    }
  )
)

export default useWalletStore
