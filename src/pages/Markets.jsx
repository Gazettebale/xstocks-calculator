import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { XSTOCKS_LIST, SECTORS, generateHistoricalData, LIVE_COUNT, COMING_SOON_COUNT } from '../data/xstocks'
import { getProtocolsForStock } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'
import { useLivePrices } from '../hooks/useLiveData'

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
        <Tooltip contentStyle={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 6, fontSize: 11 }}
          formatter={v => [`$${v.toFixed(2)}`]} labelFormatter={() => ''} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const MODAL_TIMEFRAMES = [
  { label: '1M',  days: 30 },
  { label: '3M',  days: 90 },
  { label: '6M',  days: 180 },
  { label: '1A',  days: 365 },
  { label: '2A',  days: 730 },
]

function StockModal({ stock, liveData, onClose }) {
  const protocols = getProtocolsForStock(stock.symbol)
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolioStore()
  const inWatchlist = watchlist.includes(stock.symbol)
  const [chartDays, setChartDays] = useState(180)
  const histData = useMemo(() => generateHistoricalData(stock, chartDays), [stock.symbol, chartDays])

  // Merge live price if available
  const displayPrice = liveData?.price ?? stock.price
  const isLive = liveData?.isLive ?? false

  const isUp = stock.change24h >= 0
  const color = isUp ? '#22c55e' : '#ef4444'
  const rangePos = Math.min(Math.max(((displayPrice - stock.low52w) / (stock.high52w - stock.low52w)) * 100, 2), 98)

  // Price performance over period (use live price if available)
  const firstPrice = histData[0]?.price ?? displayPrice
  const perfPct = (((displayPrice - firstPrice) / firstPrice) * 100).toFixed(1)
  const perfUp = parseFloat(perfPct) >= 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40 }}>{stock.logo}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>{stock.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
                {stock.symbol} · {stock.underlying} · {stock.sector}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 18, padding: '2px 8px' }}>✕</button>
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>
            ${displayPrice >= 1000 ? displayPrice.toLocaleString() : displayPrice.toFixed(2)}
          </div>
          <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>
            {isUp ? '+' : ''}{stock.change24h}% 24h
          </span>
          <span className={`badge ${perfUp ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
            {perfUp ? '+' : ''}{perfPct}% {MODAL_TIMEFRAMES.find(t => t.days === chartDays)?.label || ''}
          </span>
          <span className={`badge ${stock.status === 'live' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 11 }}>
            {stock.status === 'live' ? '● Live' : '◌ Bientôt'}
          </span>
          {stock.status === 'live' && (
            <span style={{ fontSize: 10.5, color: isLive ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
              {isLive ? '⚡ Pyth Live' : '◌ Indicatif'}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {MODAL_TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => setChartDays(tf.days)} style={{
                padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${chartDays === tf.days ? 'rgba(0,200,150,0.5)' : 'var(--border)'}`,
                background: chartDays === tf.days ? 'rgba(0,200,150,0.12)' : 'transparent',
                color: chartDays === tf.days ? '#00c896' : 'var(--text-3)',
              }}>{tf.label}</button>
            ))}
          </div>
        </div>

        {/* Chart with timeframe */}
        <div style={{ marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={histData} margin={{ left: 0, right: 0 }}>
              <defs>
                <linearGradient id={`modalG-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#4a5568' }} tickLine={false} axisLine={false}
                tickFormatter={v => v.slice(5)} interval={Math.max(1, Math.floor(histData.length / 6))} />
              <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`} width={46}
                domain={[d => Math.floor(d * 0.92), d => Math.ceil(d * 1.06)]} />
              <Tooltip contentStyle={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 8, fontSize: 11 }}
                formatter={v => [`$${v.toFixed(2)}`, stock.symbol]} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#modalG-${stock.symbol})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 52W Range */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
            <span>52W Low: ${stock.low52w.toLocaleString()}</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Actuel: ${displayPrice >= 1000 ? displayPrice.toLocaleString() : displayPrice.toFixed(2)}</span>
            <span>52W High: ${stock.high52w.toLocaleString()}</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, height: '100%', width: `${rangePos}%`,
              background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`, borderRadius: 3,
            }} />
            <div style={{
              position: 'absolute', left: `${rangePos}%`, top: -3, width: 12, height: 12,
              borderRadius: '50%', background: 'white', border: '2px solid var(--bg)',
              transform: 'translateX(-50%)', boxShadow: '0 0 0 2px rgba(255,255,255,0.3)',
            }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 6 }}>
            À {rangePos.toFixed(0)}% du range 52 semaines
          </div>
        </div>

        {/* Key Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Market Cap', value: stock.marketCap },
            { label: 'P/E Ratio', value: stock.pe ? stock.pe.toFixed(1) : 'N/A' },
            { label: 'Dividend', value: stock.dividendYield ? `${stock.dividendYield}%` : '—' },
            { label: '52W High', value: `$${stock.high52w.toLocaleString()}` },
            { label: '52W Low', value: `$${stock.low52w.toLocaleString()}` },
            { label: 'Beta', value: stock.beta },
            { label: 'Vol 24h', value: stock.volume24h ? `${stock.volume24h}` : '—' },
            { label: 'EPS', value: stock.eps ? `$${stock.eps}` : 'N/A' },
            { label: 'Protocoles', value: getProtocolsForStock(stock.symbol).length },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20, padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {stock.description}
        </div>

        {/* Protocols */}
        {protocols.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Protocoles DeFi disponibles
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {protocols.map(p => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 8,
                  background: p.color + '12', border: `1px solid ${p.color}25`,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 15 }}>{p.logo}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: p.color }}>{p.name.split(' ')[0]}</span>
                  {p.airdrop?.active && p.supplyApy.max === 0
                    ? <span className="badge badge-pink" style={{ fontSize: 9, padding: '1px 5px' }}>🪂</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>↑{(p.supplyApy.max + p.rewardApy).toFixed(1)}%</span>
                  }
                </a>
              ))}
            </div>
          </div>
        )}
        {stock.status === 'live' && protocols.length === 0 && (
          <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)' }}>
            Aucun protocole DeFi confirmé pour cet asset pour l'instant.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className={inWatchlist ? 'btn-danger' : 'btn-primary'}
            onClick={() => inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)}>
            {inWatchlist ? '★ Retirer Watchlist' : '☆ Ajouter Watchlist'}
          </button>
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
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
      {selected && <StockModal stock={selected} liveData={prices[selected.symbol]} onClose={() => setSelected(null)} />}

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
              const rangePos = Math.min(Math.max(((displayPrice - stock.low52w) / (stock.high52w - stock.low52w)) * 100, 2), 98)
              const isUp = stock.change24h >= 0
              const hasLive = Boolean(liveEntry?.isLive)
              return (
                <tr key={stock.symbol} style={{ cursor: 'pointer' }} onClick={() => setSelected(stock)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{stock.logo}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {stock.symbol}
                          {watchlist.includes(stock.symbol) && <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>}
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
                    <span className={isUp ? 'positive' : 'negative'} style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {isUp ? '+' : ''}{stock.change24h}%
                    </span>
                  </td>
                  <td>
                    <div style={{ width: 90 }}>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, position: 'relative', marginBottom: 4 }}>
                        <div style={{ position: 'absolute', left: `${rangePos}%`, top: -2, width: 8, height: 8, borderRadius: '50%', background: isUp ? '#22c55e' : '#ef4444', transform: 'translateX(-50%)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                        <span>${stock.low52w >= 1000 ? (stock.low52w/1000).toFixed(0)+'K' : stock.low52w.toFixed(0)}</span>
                        <span>${stock.high52w >= 1000 ? (stock.high52w/1000).toFixed(0)+'K' : stock.high52w.toFixed(0)}</span>
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
