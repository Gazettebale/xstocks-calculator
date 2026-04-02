import { useState, useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { XSTOCKS_LIST, SECTORS, generateHistoricalData } from '../data/xstocks'
import { PROTOCOLS, getProtocolsForStock } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'

function Sparkline({ stock }) {
  const data = useMemo(() => generateHistoricalData(stock, 14), [stock.symbol])
  const isUp = stock.change24h >= 0
  return (
    <ResponsiveContainer width={90} height={36}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`dir-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth={1.5} fill={`url(#dir-${stock.symbol})`} dot={false} />
        <Tooltip
          contentStyle={{ background: '#131929', border: '1px solid #1e2d45', borderRadius: 6, fontSize: 11 }}
          formatter={v => [`$${v.toFixed(2)}`]}
          labelFormatter={() => ''}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StockModal({ stock, onClose }) {
  const protocols = getProtocolsForStock(stock.symbol)
  const addToWatchlist = usePortfolioStore(s => s.addToWatchlist)
  const watchlist = usePortfolioStore(s => s.watchlist)
  const removeFromWatchlist = usePortfolioStore(s => s.removeFromWatchlist)
  const inWatchlist = watchlist.includes(stock.symbol)
  const histData = useMemo(() => generateHistoricalData(stock, 180), [stock.symbol])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 36 }}>{stock.logo}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stock.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stock.symbol} · {stock.sector}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>✕</button>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>${stock.price.toLocaleString()}</div>
          <span className={`badge ${stock.change24h >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 14 }}>
            {stock.change24h >= 0 ? '+' : ''}{stock.change24h}%
          </span>
          {stock.status === 'coming_soon' && <span className="badge badge-orange">À venir</span>}
        </div>

        {/* Chart */}
        <div style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={histData}>
              <defs>
                <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fill="url(#modalGrad)" dot={false} />
              <Tooltip
                contentStyle={{ background: '#131929', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                formatter={v => [`$${v.toFixed(2)}`, 'Prix']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Market Cap', value: stock.marketCap },
            { label: '52w High', value: `$${stock.high52w.toLocaleString()}` },
            { label: '52w Low', value: `$${stock.low52w.toLocaleString()}` },
            { label: 'P/E Ratio', value: stock.pe ? stock.pe : 'N/A' },
            { label: 'Dividend Yield', value: stock.dividendYield ? `${stock.dividendYield}%` : '0%' },
            { label: 'Beta', value: stock.beta },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Protocols */}
        {protocols.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Protocoles DeFi disponibles
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {protocols.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  background: p.color + '15', border: `1px solid ${p.color}30`,
                }}>
                  <span>{p.logo}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: p.color }}>{p.name}</span>
                  {p.airdrop?.active
                    ? <span style={{ fontSize: 11, background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, padding: '1px 7px' }}>🪂 Airdrop Points</span>
                    : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>up to {p.supplyApy.max + p.rewardApy}% APY</span>
                  }
                  {p.earlyStage && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '1px 7px' }}>Early</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={inWatchlist ? 'btn-danger' : 'btn-primary'}
            onClick={() => inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)}
          >
            {inWatchlist ? '★ Retirer Watchlist' : '☆ Ajouter Watchlist'}
          </button>
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

export default function XStocksDirectory() {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('marketCap')
  const [selectedStock, setSelectedStock] = useState(null)
  const watchlist = usePortfolioStore(s => s.watchlist)

  const filtered = useMemo(() => {
    let list = XSTOCKS_LIST
    if (search) list = list.filter(x =>
      x.symbol.toLowerCase().includes(search.toLowerCase()) ||
      x.name.toLowerCase().includes(search.toLowerCase()) ||
      x.underlying.toLowerCase().includes(search.toLowerCase())
    )
    if (sectorFilter !== 'all') list = list.filter(x => x.sector === sectorFilter)
    if (statusFilter !== 'all') list = list.filter(x => x.status === statusFilter)
    if (statusFilter === 'watchlist') list = XSTOCKS_LIST.filter(x => watchlist.includes(x.symbol))

    list = [...list].sort((a, b) => {
      if (sortBy === 'change24h') return Math.abs(b.change24h) - Math.abs(a.change24h)
      if (sortBy === 'price') return b.price - a.price
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
    return list
  }, [search, sectorFilter, statusFilter, sortBy, watchlist])

  const sectors = ['all', ...Object.values(SECTORS)]

  return (
    <div>
      {selectedStock && <StockModal stock={selectedStock} onClose={() => setSelectedStock(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          xStocks <span className="gradient-text">Directory</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          {XSTOCKS_LIST.filter(x => x.status === 'live').length} xStocks disponibles · {XSTOCKS_LIST.filter(x => x.status === 'coming_soon').length} à venir
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input-field"
          style={{ maxWidth: 240 }}
          placeholder="🔍  Rechercher AAPL, Apple..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select-field" style={{ maxWidth: 180 }} value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
          <option value="all">Tous secteurs</option>
          {Object.values(SECTORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select-field" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="live">Disponible</option>
          <option value="coming_soon">À venir</option>
          <option value="watchlist">Ma Watchlist ({watchlist.length})</option>
        </select>
        <select className="select-field" style={{ maxWidth: 160 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="marketCap">Tri: Market Cap</option>
          <option value="change24h">Tri: Variation 24h</option>
          <option value="price">Tri: Prix</option>
          <option value="name">Tri: Nom</option>
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
              <th>52W</th>
              <th>Protocoles</th>
              <th>Statut</th>
              <th>Tendance 14j</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(stock => {
              const protocols = getProtocolsForStock(stock.symbol)
              const rangePos = ((stock.price - stock.low52w) / (stock.high52w - stock.low52w)) * 100
              return (
                <tr
                  key={stock.symbol}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedStock(stock)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{stock.logo}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {stock.symbol}
                          {watchlist.includes(stock.symbol) && <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stock.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${stock.price.toLocaleString()}</td>
                  <td className={stock.change24h >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 600 }}>
                    {stock.change24h >= 0 ? '+' : ''}{stock.change24h}%
                  </td>
                  <td>
                    <div style={{ width: 80 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>${stock.low52w.toFixed(0)}</span>
                        <span>${stock.high52w.toFixed(0)}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: `${Math.min(rangePos, 98)}%`,
                          width: 4, height: 4, background: '#3b82f6',
                          borderRadius: '50%', top: 0, transform: 'translateX(-50%)'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {protocols.slice(0, 3).map(p => (
                        <span key={p.id} className="badge badge-blue" style={{ fontSize: 10, padding: '2px 6px' }}>{p.name.split(' ')[0]}</span>
                      ))}
                      {protocols.length > 3 && <span className="badge badge-blue" style={{ fontSize: 10, padding: '2px 6px' }}>+{protocols.length - 3}</span>}
                      {protocols.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${stock.status === 'live' ? 'badge-green' : 'badge-orange'}`}>
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
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Aucun xStock trouvé pour ces critères
          </div>
        )}
      </div>
    </div>
  )
}
