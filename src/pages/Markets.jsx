import { useState, useMemo } from 'react'
import { XSTOCKS_LIST, SECTORS, LIVE_COUNT, COMING_SOON_COUNT, generateHistoricalData, range52w } from '../data/xstocks'
import { getProtocolsForStock } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'
import { useLivePrices } from '../hooks/useLiveData'
import StockLogo from '../components/StockLogo'
import StockDetailModal, { CopyCA } from '../components/StockDetailModal'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

// Symbols to fetch live prices for (only live xStocks)
const LIVE_SYMBOLS = XSTOCKS_LIST.filter(x => x.status === 'live').map(x => x.symbol)

function Sparkline({ stock }) {
  const data = useMemo(() => generateHistoricalData(stock, 14), [stock.symbol])
  const color = stock.change24h >= 0 ? '#22c55e' : '#ef4444'
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`sp-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill={`url(#sp-${stock.symbol})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function Markets() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('sector')
  const [selected, setSelected] = useState(null)
  const { watchlist } = usePortfolioStore()

  // Live prices from Pyth Network (auto-refresh 30s)
  const { prices, marketOpen, lastUpdate } = useLivePrices(LIVE_SYMBOLS)

  const filtered = useMemo(() => {
    let list = XSTOCKS_LIST
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(x => x.symbol.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || x.underlying.toLowerCase().includes(q))
    }
    if (sector !== 'all') list = list.filter(x => x.sector === sector)
    if (status === 'live') list = list.filter(x => x.status === 'live')
    if (status === 'coming_soon') list = list.filter(x => x.status === 'coming_soon')
    if (status === 'watchlist') list = XSTOCKS_LIST.filter(x => watchlist.includes(x.symbol))

    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'price') return b.price - a.price
      if (sort === 'change') return Math.abs(b.change24h) - Math.abs(a.change24h)
      if (sort === 'change_asc') return a.change24h - b.change24h
      if (sort === 'change_desc') return b.change24h - a.change24h
      // Default: group by status then sector
      if (a.status !== b.status) return a.status === 'live' ? -1 : 1
      return a.sector.localeCompare(b.sector)
    })
  }, [search, sector, status, sort, watchlist])

  return (
    <div className="page-wrapper">
      {selected && <StockDetailModal stock={selected} liveData={prices[selected.symbol]} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 className="page-title">xStocks <span className="gradient-text">Markets</span></h1>
              <span className="badge badge-green" style={{ fontSize: 10.5 }}>● 24/7 on-chain</span>
            </div>
            <p className="page-subtitle">
              <strong style={{ color: 'var(--text)' }}>{LIVE_COUNT}</strong> xStocks disponibles · <strong style={{ color: 'var(--text)' }}>{COMING_SOON_COUNT}</strong> à venir · Backed Finance AG · backed.fi
            </p>
          </div>
          {lastUpdate && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>
              <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 2 }}>⚡ Pyth Network</div>
              <div>Mis à jour {new Date(lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', maxWidth: 260, flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 14 }}>🔍</span>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="AAPL, Apple, Tesla..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ maxWidth: 180 }} value={sector} onChange={e => setSector(e.target.value)}>
          <option value="all">Tous secteurs</option>
          {Object.values(SECTORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="pill-tabs">
          {[
            { v: 'all', label: `Tous (${XSTOCKS_LIST.length})` },
            { v: 'live', label: `✅ Live (${LIVE_COUNT})` },
            { v: 'coming_soon', label: `⏳ À venir (${COMING_SOON_COUNT})` },
            { v: 'watchlist', label: `★ Watchlist (${watchlist.length})` },
          ].map(t => (
            <button key={t.v} className={`pill-tab ${status === t.v ? 'active' : ''}`} onClick={() => setStatus(t.v)}>
              {t.label}
            </button>
          ))}
        </div>
        <select className="select" style={{ maxWidth: 170, marginLeft: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="sector">Trier: Secteur</option>
          <option value="name">Trier: Nom A-Z</option>
          <option value="price">Trier: Prix ↓</option>
          <option value="change_desc">Trier: Hausse 24h</option>
          <option value="change_asc">Trier: Baisse 24h</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Prix</th>
              <th>24h</th>
              <th>52 Semaines</th>
              <th>Market Cap</th>
              <th>Beta</th>
              <th>Protocoles</th>
              <th>Statut</th>
              <th>7 jours</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(stock => {
              const protos = getProtocolsForStock(stock.symbol)
              const liveEntry = prices[stock.symbol]
              const displayPrice = liveEntry?.price ?? stock.price
              const r = range52w(stock)
              const rangePos = Math.min(Math.max(((displayPrice - r.low) / (r.high - r.low)) * 100, 2), 98)
              const chg = liveEntry?.change24h ?? (stock.change24h || null)
              const isUp = (chg ?? 0) >= 0
              const hasLive = Boolean(liveEntry?.isLive)
              return (
                <tr key={stock.symbol} style={{ cursor: 'pointer' }} onClick={() => setSelected(stock)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StockLogo stock={stock} size={26} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {stock.symbol}
                          {watchlist.includes(stock.symbol) && <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>}
                          <CopyCA mint={stock.mint} compact />
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      ${displayPrice >= 1000 ? displayPrice.toLocaleString() : displayPrice.toFixed(2)}
                      {hasLive && <span style={{ fontSize: 8, color: '#10b981', fontWeight: 800 }}>●</span>}
                    </div>
                  </td>
                  <td>
                    {chg != null ? (
                      <span className={isUp ? 'positive' : 'negative'} style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {isUp ? '+' : ''}{chg}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontSize: 13.5 }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ width: 90 }}>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, position: 'relative', marginBottom: 4 }}>
                        <div style={{ position: 'absolute', left: `${rangePos}%`, top: -2, width: 8, height: 8, borderRadius: '50%', background: isUp ? '#22c55e' : '#ef4444', transform: 'translateX(-50%)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                        <span>${r.low >= 1000 ? (r.low/1000).toFixed(0)+'K' : r.low.toFixed(0)}</span>
                        <span>${r.high >= 1000 ? (r.high/1000).toFixed(0)+'K' : r.high.toFixed(0)}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{stock.marketCap}</td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: stock.beta > 2 ? '#ef4444' : stock.beta > 1.2 ? '#f59e0b' : '#22c55e' }}>
                      {stock.beta}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                      {protos.slice(0, 3).map(p => (
                        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, background: p.color + '15', border: `1px solid ${p.color}25`, textDecoration: 'none', fontSize: 11, color: p.color, fontWeight: 600, transition: 'all 0.15s' }}>
                          {p.logo} {p.name.split(' ')[0]}
                        </a>
                      ))}
                      {protos.length > 3 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{protos.length - 3}</span>}
                      {protos.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${stock.status === 'live' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 11 }}>
                      {stock.status === 'live' ? '● Live' : '◌ Bientôt'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <Sparkline stock={stock} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-3)' }}>
            Aucun xStock trouvé pour ces critères.
          </div>
        )}
      </div>

      {/* Source note */}
      <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Source:</span>
        <a href="https://xstocks.fi" target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc' }}>xstocks.fi</a>
        <span>·</span>
        <a href="https://backed.fi" target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc' }}>backed.fi</a>
        <span>· Données indicatives Q1 2026</span>
      </div>
    </div>
  )
}
