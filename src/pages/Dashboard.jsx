import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { XSTOCKS_LIST, LIVE_COUNT, COMING_SOON_COUNT } from '../data/xstocks'
import { PROTOCOLS, SOLANA_PROTOCOLS, TOTAL_TVL } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'
import { useLivePrices } from '../hooks/useLiveData'
import TradingViewChart from '../components/TradingViewChart'

const SECTOR_COLORS = ['#00c896','#14f195','#f59e0b','#ec4899','#06b6d4','#a855f7','#f43f5e','#10b981']

// ETF holdings info
const ETF_INFO = {
  xSPY:  { tracks: 'S&P 500',      desc: '500 plus grandes capitalisations US', topHoldings: ['AAPL','MSFT','NVDA','AMZN','META','GOOGL','BRK.B','LLY','JPM','V'] },
  xQQQ:  { tracks: 'Nasdaq 100',   desc: 'Top 100 entreprises non-financières Nasdaq', topHoldings: ['AAPL','MSFT','NVDA','AMZN','META','TSLA','GOOGL','COST','NFLX','AMD'] },
  xDIA:  { tracks: 'Dow Jones 30', desc: '30 blue chips industriels US', topHoldings: ['UNH','GS','MSFT','HD','CAT','MCD','V','AAPL','BA','SBUX'] },
  xIWM:  { tracks: 'Russell 2000', desc: '2000 petites capitalisations US diversifiées', topHoldings: ['Diversifié','Small Caps','1800+ titres'] },
}

// Simple CSS trend bar for table cells (lightweight alternative to chart widgets)
function MiniTrend({ isUp }) {
  return (
    <div style={{
      width: 60, height: 24, display: 'flex', alignItems: 'flex-end', gap: 2,
    }}>
      {[0.4, 0.6, 0.3, 0.7, 0.5, 0.8, isUp ? 0.9 : 0.25].map((h, i) => (
        <div key={i} style={{
          flex: 1, height: `${h * 100}%`, borderRadius: 2,
          background: isUp ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
        }} />
      ))}
    </div>
  )
}

export default function Dashboard({ setPage }) {
  const positions = usePortfolioStore(s => s.positions)

  const currentPrices = useMemo(() => {
    const m = {}
    XSTOCKS_LIST.forEach(x => { m[x.symbol] = x.price })
    return m
  }, [])

  const totalPortfolioValue = useMemo(() =>
    positions.reduce((s, p) => s + (currentPrices[p.symbol] || p.entryPrice) * p.quantity, 0),
    [positions, currentPrices]
  )

  const totalPnL = useMemo(() =>
    positions.reduce((s, p) => {
      const cp = currentPrices[p.symbol] || p.entryPrice
      return s + (cp - p.entryPrice) * p.quantity
    }, 0),
    [positions, currentPrices]
  )

  const liveStocks = XSTOCKS_LIST.filter(x => x.status === 'live')
  const topGainers = [...liveStocks].sort((a, b) => b.change24h - a.change24h).slice(0, 4)
  const topLosers = [...liveStocks].sort((a, b) => a.change24h - b.change24h).slice(0, 3)
  const topVolume = [...liveStocks].sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h)).slice(0, 3)
  const activeAirdrops = PROTOCOLS.filter(p => p.airdrop?.active)
  const [expandedSector, setExpandedSector] = useState(null)

  const sectorData = useMemo(() => {
    const map = {}
    liveStocks.forEach(s => { map[s.sector] = (map[s.sector] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({
      name: name.split(' ')[0],
      fullName: name,
      value,
      stocks: liveStocks.filter(x => x.sector === name),
    }))
  }, [])

  const spy = XSTOCKS_LIST.find(x => x.symbol === 'xSPY')
  const marketTrend = spy.change24h >= 0

  // Live xSPY price from Pyth Network
  const { prices: livePrices, marketOpen, lastUpdate: liveTs } = useLivePrices(['xSPY'])
  const liveSpyEntry = livePrices['xSPY']
  const liveSpyPrice = liveSpyEntry?.price
  const spyIsLive    = liveSpyEntry?.isLive ?? false

  return (
    <div className="page-wrapper">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 className="page-title">Dashboard <span className="gradient-text">xStocks</span></h1>
              <span className="badge badge-green" style={{ fontSize: 11 }}>● Live</span>
            </div>
            <p className="page-subtitle">
              Backed Finance · $3B+ volume cumulé · 57K+ holders · Solana #1 tokenized stocks
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setPage('markets')}>Explorer les xStocks →</button>
            <button className="btn-primary" onClick={() => setPage('portfolio')}>+ Ajouter position</button>
          </div>
        </div>
      </div>

      {/* ── Hero Stats ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'xStocks Live', value: LIVE_COUNT, sub: `+${COMING_SOON_COUNT} coming soon`, color: '#4ade80', icon: '📈' },
          { label: 'TVL Protocoles', value: `$${(TOTAL_TVL / 1000).toFixed(1)}B`, sub: `${SOLANA_PROTOCOLS.filter(p=>!p.isPointsProgram).length} protocoles Solana`, color: '#00e4b5', icon: '🏦' },
          { label: 'Airdrops Actifs', value: activeAirdrops.length, sub: 'Opportunités en cours', color: '#f9a8d4', icon: '🪂' },
          { label: 'Mon Portfolio', value: totalPortfolioValue > 0 ? `$${totalPortfolioValue.toLocaleString('en',{maximumFractionDigits:0})}` : '—', sub: positions.length > 0 ? `${positions.length} position(s)` : 'Aucune position', color: '#60a5fa', icon: '💼' },
          { label: 'PnL Total', value: positions.length > 0 ? `${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toLocaleString('en',{maximumFractionDigits:0})}` : '—', sub: positions.length > 0 ? (totalPnL >= 0 ? '📈 En profit' : '📉 En perte') : 'Commencer à tracker', color: positions.length > 0 ? (totalPnL >= 0 ? '#4ade80' : '#f87171') : undefined, icon: totalPnL >= 0 ? '🟢' : '🔴' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <div className="stat-value" style={{ color: s.color || 'var(--text)', marginTop: 10 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── xPoints Official Banner ─────────────────────────────────────── */}
      <div className="xpoints-banner" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(0,200,150,0.15)', border: '1.5px solid rgba(0,200,150,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>⭐</div>
          <div>
            <div style={{ fontWeight: 800, color: '#00e4b5', fontSize: 14, marginBottom: 3 }}>
              xStocks xPoints — Programme Officiel Kraken × Backed Finance
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Lancé le 10 mars 2026 · LP Raydium/Orca <strong style={{ color: '#14f195' }}>7×</strong> · Kamino Lend <strong style={{ color: '#14f195' }}>5×</strong> · Hold <strong style={{ color: 'var(--text)' }}>1×</strong> · Connexion tôt <strong style={{ color: '#14f195' }}>+20%</strong> permanent
            </div>
          </div>
        </div>
        <a
          href="https://defi.xstocks.fi/points?ref=GAZETTEBALE"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 22px', borderRadius: 9, textDecoration: 'none',
            background: 'linear-gradient(135deg, #00c896, #00a8d4)',
            color: '#05090f', fontSize: 13, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 4px 18px rgba(0,200,150,0.35)',
          }}
        >
          Rejoindre xPoints →
        </a>
      </div>

      {/* ── Market + Sectors ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* S&P Chart — TradingView */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>xSPY — S&P 500</div>
                <span style={{ fontSize: 10, color: spyIsLive ? '#10b981' : '#94a3b8', fontWeight: 800 }}>
                  {spyIsLive ? '⚡ Pyth Live' : '◌ Indicatif'}
                </span>
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 20 }}>
                  ${(liveSpyPrice ?? spy.price).toLocaleString()}
                </span>
                <span style={{ marginLeft: 10, fontWeight: 600, color: marketTrend ? '#4ade80' : '#f87171' }}>
                  {marketTrend ? '+' : ''}{spy.change24h}% 24h
                </span>
              </div>
            </div>
            <span className={`badge ${marketTrend ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
              {marketTrend ? '▲ Bullish' : '▼ Bearish'}
            </span>
          </div>
          <TradingViewChart
            symbol="AMEX:SPY"
            height={300}
            interval="D"
            showToolbar={true}
            showDrawingTools={false}
          />
        </div>

        {/* Sectors — avec détail des actions */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Par Secteur</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Clique pour détailler</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={26} outerRadius={46} paddingAngle={3} dataKey="value">
                {sectorData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0a1019', border: '1px solid #152030', borderRadius: 8, fontSize: 11 }}
                formatter={(v, n) => [`${v} stocks`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
            {sectorData.map((s, i) => {
              const isExpanded = expandedSector === s.fullName
              const isETF = s.fullName === 'ETFs & Indices'
              const color = SECTOR_COLORS[i % SECTOR_COLORS.length]
              return (
                <div key={s.name}>
                  <div
                    onClick={() => setExpandedSector(isExpanded ? null : s.fullName)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 5px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11.5, color: 'var(--text-2)' }}>{s.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{s.value}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>{isExpanded ? '▴' : '▾'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ paddingLeft: 14, paddingBottom: 6, paddingTop: 2 }}>
                      {isETF ? (
                        // ETF: show what each ETF tracks
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {s.stocks.map(etf => {
                            const info = ETF_INFO[etf.symbol]
                            return (
                              <div key={etf.symbol} style={{ background: color + '10', border: `1px solid ${color}20`, borderRadius: 6, padding: '6px 8px' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: color, marginBottom: 2 }}>{etf.symbol} — {info?.tracks}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>{info?.desc}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                  {info?.topHoldings?.map(h => (
                                    <span key={h} style={{ fontSize: 9, background: color + '15', color: color, borderRadius: 3, padding: '1px 4px', fontWeight: 600 }}>{h}</span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        // Regular sector: show stock tickers
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {s.stocks.map(x => (
                            <span key={x.symbol} style={{ fontSize: 9.5, background: color + '18', color: color, borderRadius: 4, padding: '2px 5px', fontWeight: 600 }}>
                              {x.underlying}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Gainers + Losers + Volume ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Gainers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>🚀 Top Gainers</span>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage('markets')}>Voir tout</button>
          </div>
          <table>
            <tbody>
              {topGainers.map(s => (
                <tr key={s.symbol}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{s.logo}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.underlying}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>${s.price >= 1000 ? s.price.toLocaleString() : s.price.toFixed(2)}</td>
                  <td><MiniTrend isUp={s.change24h >= 0} /></td>
                  <td className="positive" style={{ fontWeight: 700 }}>+{s.change24h}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Losers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>📉 Plus Grandes Baisses</span>
          </div>
          <table>
            <tbody>
              {topLosers.map(s => (
                <tr key={s.symbol}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{s.logo}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.underlying}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>${s.price >= 1000 ? s.price.toLocaleString() : s.price.toFixed(2)}</td>
                  <td><MiniTrend isUp={s.change24h >= 0} /></td>
                  <td className="negative" style={{ fontWeight: 700 }}>{s.change24h}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Best Protocols */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>⚡ Meilleurs APY</span>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage('defi')}>DeFi Hub</button>
          </div>
          <div style={{ padding: '0 16px 12px' }}>
            {[...SOLANA_PROTOCOLS].filter(p => !p.isPointsProgram).sort((a, b) => (b.supplyApy.max + b.rewardApy) - (a.supplyApy.max + a.rewardApy)).slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: p.color + '20', border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{p.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.type}</div>
                </div>
                {p.airdrop?.active && p.supplyApy.max === 0
                  ? <span className="badge badge-pink" style={{ fontSize: 10 }}>🪂 Points</span>
                  : <span style={{ fontWeight: 800, color: '#4ade80', fontSize: 15 }}>{(p.supplyApy.max + p.rewardApy).toFixed(1)}%</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 14, marginRight: 4 }}>⚡ Accès rapide</span>
        {[
          { label: '📈 Tous les marchés', p: 'markets' },
          { label: '⚡ DeFi Hub', p: 'defi' },
          { label: '🔭 Projections', p: 'projections' },
          { label: '💼 Mon Portfolio', p: 'portfolio' },
        ].map(a => (
          <button key={a.p} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setPage(a.p)}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
