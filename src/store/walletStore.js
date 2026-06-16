import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchWalletHoldings, isValidSolanaAddress } from '../services/walletData'

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

      setRpcUrl: (rpcUrl) => set({ rpcUrl: rpcUrl.trim() }),

      connect: async (rawAddress) => {
        const address = (rawAddress ?? '').trim()
        if (!isValidSolanaAddress(address)) {
          set({ error: 'Adresse Solana invalide', address })
          return false
        }
        set({ address, loading: true, error: null })
        try {
          const holdings = await fetchWalletHoldings(address, get().rpcUrl || undefined)
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
      partialize: (s) => ({ address: s.address, rpcUrl: s.rpcUrl }),
    }
  )
)

export default useWalletStore
