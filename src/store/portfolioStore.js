import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePortfolioStore = create(
  persist(
    (set, get) => ({
      // ── Positions ─────────────────────────────────────
      positions: [],

      addPosition: (position) => {
        const id = Date.now().toString()
        set(state => ({
          positions: [...state.positions, { ...position, id, createdAt: new Date().toISOString() }]
        }))
      },

      updatePosition: (id, updates) => {
        set(state => ({
          positions: state.positions.map(p => p.id === id ? { ...p, ...updates } : p)
        }))
      },

      removePosition: (id) => {
        set(state => ({
          positions: state.positions.filter(p => p.id !== id)
        }))
      },

      // ── Watchlist ─────────────────────────────────────
      watchlist: [],

      addToWatchlist: (symbol) => {
        set(state => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist
            : [...state.watchlist, symbol]
        }))
      },

      removeFromWatchlist: (symbol) => {
        set(state => ({
          watchlist: state.watchlist.filter(s => s !== symbol)
        }))
      },

      // ── Alerts ────────────────────────────────────────
      alerts: [],

      addAlert: (alert) => {
        set(state => ({
          alerts: [...state.alerts, { ...alert, id: Date.now().toString(), triggered: false }]
        }))
      },

      removeAlert: (id) => {
        set(state => ({
          alerts: state.alerts.filter(a => a.id !== id)
        }))
      },

      // ── Computed ──────────────────────────────────────
      getTotalValue: (currentPrices) => {
        const { positions } = get()
        return positions.reduce((total, pos) => {
          const currentPrice = currentPrices[pos.symbol] || pos.entryPrice
          return total + (currentPrice * pos.quantity)
        }, 0)
      },

      getTotalPnL: (currentPrices) => {
        const { positions } = get()
        return positions.reduce((total, pos) => {
          const currentPrice = currentPrices[pos.symbol] || pos.entryPrice
          const pnl = (currentPrice - pos.entryPrice) * pos.quantity
          return total + pnl
        }, 0)
      },

      getPositionPnL: (position, currentPrice) => {
        const cp = currentPrice || position.entryPrice
        const pnl = (cp - position.entryPrice) * position.quantity
        const pnlPct = ((cp - position.entryPrice) / position.entryPrice) * 100
        return { pnl, pnlPct }
      },
    }),
    {
      name: 'xstocks-portfolio',
      version: 1,
    }
  )
)

export default usePortfolioStore
