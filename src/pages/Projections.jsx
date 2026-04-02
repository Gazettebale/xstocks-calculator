import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { XSTOCKS_LIST, generateHistoricalData, generateProjectionFan, generateProjection, computeDividendProjection } from '../data/xstocks'
import { useLivePrices } from '../hooks/useLiveData'

// ─── constants ───────────────────────────────────────────────────────────────

const TIMEFRAMES = [
  { label: '1M',  histDays: 30,  projDays: 30 },
  { label: '3M',  histDays: 90,  projDays: 90 },
  { label: '6M',  histDays: 180, projDays: 180 },
  { label: '1A',  histDays: 365, projDays: 365 },
  { label: '2A',  histDays: 365, projDays: 730 },
  { label: '3A',  histDays: 365, projDays: 1095 },
  { label: '5A',  histDays: 365, projDays: 1825 },
  { label: '10A', histDays: 365, projDays: 3650 },
]

// Real historical CAGR by sector (50-year averages, S&P sector indices)
const SECTOR_EXPECTED_RETURN = {
  'Technology':         14.5, // NASDAQ-heavy, 1975-2025 avg
  'Finance & Banking':   9.8, // S&P Financials long-term
  'Healthcare & Pharma':10.4, // Healthcare outperforms slightly
  'Consumer':            9.2, // Staples + discretionary blend
  'Energy':              7.2, // Volatile, includes oil cycles
  'Industrial':          9.4, // Dow Jones Industrial avg
  'Commodities':         5.8, // Gold ~7%, broad commodities lower
  'ETFs & Indices':     10.5, // S&P 500 50-year CAGR
  'Crypto-Adjacent':    18,   // Shorter history, high variance
}

function getSectorBase(stock) {
  return SECTOR_EXPECTED_RETURN[stock.sector] ?? 10
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

function FanTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const entries = payload.filter(p => p.value != null)
  return (
    <div style={{
      background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10,
      padding: '12px 16px', fontSize: 12, minWidth: 190,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ color: '#64748b', marginBottom: 8, fontSize: 11 }}>{label}</div>
      {entries.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: p.color || p.stroke || '#94a3b8' }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: 'white' }}>${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── stat mini box ────────────────────────────────────────────────────────────

function StatMini({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Projections() {
  const [selectedSymbol, setSelectedSymbol] = useState('xAAPL')
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2])
  const [showFan, setShowFan] = useState(true)
  const [activeScenarios, setActiveScenarios] = useState(new Set(['bear', 'base', 'bull']))
  const [entryPrice, setEntryPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [customReturn, setCustomReturn] = useState('')
  const [showDividends, setShowDividends] = useState(false)

  const staticStock = useMemo(() => XSTOCKS_LIST.find(x => x.symbol === selectedSymbol), [selectedSymbol])

  // Fetch live price from Pyth
  const liveSymbols = useMemo(() => [selectedSymbol], [selectedSymbol])
  const { prices: livePrices, loading: priceLoading } = useLivePrices(liveSymbols)
  const livePrice = livePrices[selectedSymbol]?.price

  // Merge live price into stock object
  const stock = useMemo(() => {
    if (!livePrice) return staticStock
    return { ...staticStock, price: livePrice }
  }, [staticStock, livePrice])

  const historicalData = useMemo(() => generateHistoricalData(stock, timeframe.histDays), [selectedSymbol, timeframe.histDays])

  const fanData = useMemo(() => generateProjectionFan(stock, timeframe.projDays), [selectedSymbol, timeframe.projDays])

  const sectorBase = getSectorBase(stock)
  const customVal = parseFloat(customReturn)
  const baseReturn = !isNaN(customVal) && customReturn !== '' ? customVal : sectorBase

  // Beta-calibrated spread: tighter for indices/low-beta, wider for high-beta
  // Caps spread at 1.5× sector base to avoid unrealistic outliers
  const betaSpread = Math.min(stock.beta * sectorBase * 0.7, sectorBase * 1.5)
  const SCENARIOS = [
    { id: 'bear', label: '🐻 Bear', bias: baseReturn - betaSpread, color: '#ef4444' },
    { id: 'base', label: '📊 Base', bias: baseReturn, color: '#60a5fa' },
    { id: 'bull', label: '🐂 Bull', bias: baseReturn + betaSpread, color: '#10b981' },
  ]

  const scenarioData = useMemo(() => {
    return Object.fromEntries(
      SCENARIOS.map(s => [s.id, generateProjection(stock, timeframe.projDays, s.bias)])
    )
  }, [selectedSymbol, timeframe.projDays, baseReturn, stock.price])

  // Dividend-augmented scenario data
  const scenarioDataWithDiv = useMemo(() => {
    if (!stock.dividendYield) return null
    return Object.fromEntries(
      SCENARIOS.map(s => [s.id, computeDividendProjection(stock, scenarioData[s.id])])
    )
  }, [scenarioData, stock.dividendYield])

  // Build merged chart dataset
  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(historicalData.length / 60))
    const hist = historicalData
      .filter((_, i) => i % step === 0 || i === historicalData.length - 1)
      .map(d => ({ date: d.date, hist: d.price }))

    const lastPrice = hist[hist.length - 1]?.hist ?? stock.price
    const projLen = Math.min(fanData.p50?.length ?? 0, timeframe.projDays)

    const projRows = Array.from({ length: projLen }, (_, i) => {
      const row = { date: fanData.p50[i].date }
      if (showFan) {
        row.band_90 = [fanData.p10[i]?.price, fanData.p90[i]?.price]
        row.band_50 = [fanData.p25[i]?.price, fanData.p75[i]?.price]
        row.p50 = fanData.p50[i]?.price
      }
      SCENARIOS.forEach(s => {
        if (activeScenarios.has(s.id)) row[s.id] = scenarioData[s.id][i]?.price
        if (showDividends && scenarioDataWithDiv && activeScenarios.has(s.id)) {
          row[s.id + '_total'] = scenarioDataWithDiv[s.id]?.[i]?.totalReturn
        }
      })
      return row
    })

    // Bridge connector
    const bridge = { date: lastPrice ? hist[hist.length - 1].date : '' }
    bridge.hist = lastPrice
    if (showFan) {
      bridge.p50 = lastPrice
      bridge.band_90 = [lastPrice, lastPrice]
      bridge.band_50 = [lastPrice, lastPrice]
    }
    SCENARIOS.forEach(s => {
      if (activeScenarios.has(s.id)) bridge[s.id] = lastPrice
      if (showDividends && scenarioDataWithDiv && activeScenarios.has(s.id)) bridge[s.id + '_total'] = lastPrice
    })

    return [...hist, bridge, ...projRows]
  }, [historicalData, fanData, scenarioData, scenarioDataWithDiv, showFan, showDividends, activeScenarios, timeframe])

  // Technical stats
  const hist52w = useMemo(() => generateHistoricalData(stock, 365), [selectedSymbol])
  const avgPrice = hist52w.reduce((s, d) => s + d.price, 0) / hist52w.length
  const posInRange = ((stock.price - stock.low52w) / (stock.high52w - stock.low52w)) * 100
  const volatilityAnnual = Math.max(stock.beta * 0.18, 0.05) * 100

  // Scenario end prices
  const ends = useMemo(() => Object.fromEntries(
    SCENARIOS.map(s => [s.id, scenarioData[s.id]?.[scenarioData[s.id].length - 1]?.price || stock.price])
  ), [scenarioData])

  // Dividend end values
  const divEnds = useMemo(() => {
    if (!scenarioDataWithDiv) return null
    return Object.fromEntries(
      SCENARIOS.map(s => {
        const last = scenarioDataWithDiv[s.id]?.[scenarioDataWithDiv[s.id].length - 1]
        return [s.id, { totalReturn: last?.totalReturn || 0, cumulDiv: last?.cumulativeDividends || 0 }]
      })
    )
  }, [scenarioDataWithDiv])

  // Simulator
  const simEntry = parseFloat(entryPrice) || stock.price
  const simQty = parseFloat(quantity) || 0
  const simCost = simEntry * simQty

  const toggleScenario = (id) => {
    setActiveScenarios(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const liveStocks = useMemo(() => XSTOCKS_LIST.filter(x => x.status === 'live'), [])

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          Price <span className="gradient-text">Projections</span>
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: 5, fontSize: 14 }}>
          Analyse GJR-GARCH + mean reversion · Fan chart probabiliste · Simulateur de position
        </p>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      {/* Stock description micro-card */}
      {stock.description && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '10px 16px', marginBottom: 14, fontSize: 13, color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{stock.logo}</span>
          <div>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{stock.name}</span>
            <span style={{ margin: '0 8px', color: 'var(--text-3)' }}>·</span>
            <span style={{ color: '#00e4b5', fontWeight: 600 }}>{stock.sector}</span>
            <span style={{ margin: '0 8px', color: 'var(--text-3)' }}>·</span>
            <span>Retour hist. estimé: <strong style={{ color: sectorBase > 12 ? '#14f195' : '#fbbf24' }}>{sectorBase}%/an</strong></span>
            {customReturn !== '' && <span style={{ marginLeft: 8, color: '#00e4b5', fontWeight: 700 }}>→ Scénario perso: {customReturn}%/an</span>}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', maxWidth: 380 }}>
            {stock.description}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="select-field"
          style={{ maxWidth: 280 }}
          value={selectedSymbol}
          onChange={e => setSelectedSymbol(e.target.value)}
        >
          {liveStocks.map(s => (
            <option key={s.symbol} value={s.symbol}>{s.logo} {s.symbol} — {s.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              className={`tab-btn ${timeframe.label === tf.label ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Custom annual return input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: customReturn !== '' ? 'rgba(0,200,150,0.08)' : 'var(--card)',
          border: `1.5px solid ${customReturn !== '' ? 'rgba(0,200,150,0.5)' : 'var(--border)'}`,
          borderRadius: 10, padding: '7px 14px',
          transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: 12, color: customReturn !== '' ? '#00e4b5' : 'var(--text-2)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            📈 Retour ann.
          </span>
          <input
            type="number"
            step={1}
            placeholder={`${sectorBase}%`}
            value={customReturn}
            onChange={e => setCustomReturn(e.target.value)}
            style={{
              width: 70, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 8px', outline: 'none',
              fontSize: 14, fontWeight: 800, textAlign: 'center',
              color: customReturn !== '' ? '#00e4b5' : 'var(--text-2)', fontFamily: 'inherit',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>%/an</span>
          {customReturn !== '' && (
            <button onClick={() => setCustomReturn('')} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
              borderRadius: 6, cursor: 'pointer', color: 'var(--text-2)', fontSize: 12,
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFan(v => !v)}
            style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${showFan ? 'rgba(0,200,150,0.5)' : 'var(--border)'}`,
              background: showFan ? 'rgba(0,200,150,0.12)' : 'transparent',
              color: showFan ? '#00e4b5' : 'var(--text-3)',
            }}
          >
            📊 Fan Chart {showFan ? 'ON' : 'OFF'}
          </button>
          {stock.dividendYield > 0 && (
            <button
              onClick={() => setShowDividends(v => !v)}
              style={{
                padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: `1px solid ${showDividends ? 'rgba(251,191,36,0.5)' : 'var(--border)'}`,
                background: showDividends ? 'rgba(251,191,36,0.12)' : 'transparent',
                color: showDividends ? '#fbbf24' : 'var(--text-3)',
              }}
            >
              💰 Dividendes {showDividends ? 'ON' : 'OFF'}
            </button>
          )}
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => toggleScenario(s.id)}
              style={{
                padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: `1px solid ${activeScenarios.has(s.id) ? s.color : 'var(--border)'}`,
                background: activeScenarios.has(s.id) ? s.color + '22' : 'transparent',
                color: activeScenarios.has(s.id) ? s.color : 'var(--text-3)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main chart ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{stock.logo}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{stock.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{stock.symbol} · {stock.sector}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>${stock.price.toLocaleString()}</div>
              {livePrice ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  LIVE
                </span>
              ) : priceLoading ? (
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>chargement...</span>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                }}>
                  INDICATIF
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: stock.change24h >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
              {stock.change24h >= 0 ? '▲' : '▼'} {Math.abs(stock.change24h)}% 24h
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ left: 10, right: 16, top: 4 }}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#475569' }}
              tickLine={false} axisLine={false}
              tickFormatter={v => v?.slice(5) ?? ''}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#475569' }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)}`}
              width={58}
              domain={[
                dataMin => Math.floor(dataMin * 0.88),
                dataMax => Math.ceil(dataMax * 1.06),
              ]}
            />
            <Tooltip content={<FanTooltip />} />

            {/* Current price reference */}
            <ReferenceLine
              y={stock.price}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: 'Actuel', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
            />

            {/* Fan chart bands */}
            {showFan && (
              <>
                <Area
                  type="monotone" dataKey="band_90"
                  stroke="none" fill="rgba(99,102,241,0.06)"
                  dot={false} connectNulls activeDot={false}
                  name="p10–p90" legendType="none"
                />
                <Area
                  type="monotone" dataKey="band_50"
                  stroke="none" fill="rgba(99,102,241,0.12)"
                  dot={false} connectNulls activeDot={false}
                  name="p25–p75" legendType="none"
                />
                <Line
                  type="monotone" dataKey="p50"
                  stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="5 3"
                  connectNulls name="Médiane"
                />
              </>
            )}

            {/* Historical line */}
            <Area
              type="monotone" dataKey="hist"
              stroke="#6366f1" strokeWidth={2.5} fill="url(#histGrad)"
              dot={false} connectNulls name="Historique"
            />

            {/* Scenario lines */}
            {SCENARIOS.filter(s => activeScenarios.has(s.id)).map(s => (
              <Line
                key={s.id}
                type="monotone" dataKey={s.id}
                stroke={s.color} strokeWidth={2} dot={false} strokeDasharray="7 4"
                connectNulls name={s.label}
              />
            ))}

            {/* Total return lines (prix + dividendes) */}
            {showDividends && scenarioDataWithDiv && SCENARIOS.filter(s => activeScenarios.has(s.id)).map(s => (
              <Line
                key={s.id + '_total'}
                type="monotone" dataKey={s.id + '_total'}
                stroke={s.color} strokeWidth={2.5} dot={false}
                connectNulls name={s.label + ' + div.'}
                opacity={0.7}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 3, background: '#6366f1', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-3)' }}>Historique</span>
          </div>
          {showFan && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 10, background: 'rgba(99,102,241,0.2)', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-3)' }}>p10–p90</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 10, background: 'rgba(99,102,241,0.35)', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-3)' }}>p25–p75</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, borderTop: '2px dashed #8b5cf6' }} />
                <span style={{ color: 'var(--text-3)' }}>Médiane</span>
              </div>
            </>
          )}
          {SCENARIOS.filter(s => activeScenarios.has(s.id)).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, borderTop: `2px dashed ${s.color}` }} />
              <span style={{ color: 'var(--text-3)' }}>{s.label} (prix)</span>
            </div>
          ))}
          {showDividends && scenarioDataWithDiv && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, borderTop: '2.5px solid #fbbf24' }} />
              <span style={{ color: 'var(--text-3)' }}>+ dividendes</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Scenario result cards ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {SCENARIOS.map(s => {
          const end = ends[s.id]
          const pct = (((end - stock.price) / stock.price) * 100).toFixed(1)
          return (
            <div
              key={s.id}
              className="card"
              style={{
                borderColor: s.color + '44',
                background: `${s.color}08`,
                opacity: activeScenarios.has(s.id) ? 1 : 0.4,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>${end.toFixed(2)}</div>
              <div style={{
                fontSize: 15, fontWeight: 700, marginBottom: 12,
                color: parseFloat(pct) >= 0 ? '#4ade80' : '#f87171',
              }}>
                {parseFloat(pct) >= 0 ? '+' : ''}{pct}% sur {timeframe.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Δ ${Math.abs(end - stock.price).toFixed(2)} / token
              </div>
              {showDividends && divEnds && stock.dividendYield > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
                    💰 Avec dividendes: ${divEnds[s.id].totalReturn.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    +${divEnds[s.id].cumulDiv.toFixed(2)} de div. cumulés
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Technical analysis + Simulator ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        {/* Technical */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Analyse Technique</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatMini label="52W High" value={`$${stock.high52w.toLocaleString()}`} color="#4ade80" />
            <StatMini label="52W Low" value={`$${stock.low52w.toLocaleString()}`} color="#f87171" />
            <StatMini label="Moy. 1 an" value={`$${avgPrice.toFixed(2)}`} />
            <StatMini label="Vol. annuelle" value={`${volatilityAnnual.toFixed(1)}%`} color="#fbbf24" />
            <StatMini label="P/E" value={stock.pe || 'N/A'} />
            <StatMini
              label="Beta"
              value={stock.beta}
              color={stock.beta > 1.8 ? '#f87171' : stock.beta > 1.2 ? '#fbbf24' : '#4ade80'}
            />
            <StatMini
              label="Div. Yield"
              value={stock.dividendYield ? `${stock.dividendYield}%` : 'N/A'}
              color="#fbbf24"
            />
            <StatMini
              label="CAGR Secteur"
              value={`${sectorBase}%/an`}
              color="#a5b4fc"
            />
          </div>

          {/* 52W range */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600 }}>
              <span>52W Low: ${stock.low52w}</span>
              <span style={{ color: '#a5b4fc' }}>Actuel: ${stock.price}</span>
              <span>52W High: ${stock.high52w}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${posInRange}%`,
                background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #22c55e 100%)`,
                borderRadius: 4,
              }} />
              <div style={{
                position: 'absolute', top: -1, height: 10, width: 3, borderRadius: 2,
                left: `calc(${posInRange}% - 1.5px)`, background: 'white',
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              Prix à <strong style={{ color: 'var(--text-2)' }}>{posInRange.toFixed(0)}%</strong> du range 52 semaines
            </div>
          </div>
        </div>

        {/* Position Simulator */}
        <div className="card" style={{ border: '1.5px solid rgba(99,102,241,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>📐</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Simulateur de Position</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Calcule ton PnL potentiel selon les 3 scénarios</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', fontWeight: 700, marginBottom: 6 }}>
                💰 Prix d'entrée ($)
              </label>
              <input
                className="input-field"
                type="number"
                placeholder={String(stock.price)}
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                style={{
                  fontSize: 15, fontWeight: 700, padding: '10px 14px',
                  border: '1.5px solid var(--border)', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Prix actuel: <strong style={{ color: '#a5b4fc' }}>${stock.price.toLocaleString()}</strong>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', fontWeight: 700, marginBottom: 6 }}>
                📊 Quantité (tokens)
              </label>
              <input
                className="input-field"
                type="number"
                placeholder="10"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={{
                  fontSize: 15, fontWeight: 700, padding: '10px 14px',
                  border: '1.5px solid var(--border)', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Ex: 10 tokens = <strong style={{ color: '#a5b4fc' }}>${(stock.price * 10).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {simQty > 0 ? (
            <>
              <div style={{
                padding: '10px 14px', background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
                fontSize: 13, marginBottom: 14,
              }}>
                Coût total: <strong style={{ color: '#a5b4fc' }}>${simCost.toLocaleString('en', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCENARIOS.map(s => {
                  const end = ends[s.id]
                  const value = end * simQty
                  const pnl = value - simCost
                  const pct = (pnl / simCost) * 100
                  const divIncome = divEnds && showDividends ? divEnds[s.id].cumulDiv * simQty : 0
                  const totalPnl = pnl + divIncome
                  const totalPct = simCost > 0 ? (totalPnl / simCost) * 100 : 0
                  return (
                    <div key={s.id} style={{
                      padding: '11px 14px', borderRadius: 9,
                      background: s.color + '0d', border: `1px solid ${s.color}30`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>${end.toFixed(2)}/token</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>${value.toFixed(2)}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: pnl >= 0 ? '#4ade80' : '#f87171' }}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pct.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      {showDividends && divEnds && stock.dividendYield > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: '#fbbf24' }}>💰 +${divIncome.toFixed(2)} div.</span>
                          <span style={{ color: totalPnl >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                            Total: {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPct.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center', padding: '28px 20px',
              color: 'var(--text-3)', fontSize: 14,
              background: 'rgba(99,102,241,0.05)', borderRadius: 10,
              border: '1px dashed rgba(99,102,241,0.25)',
            }}>
              <div style={{ fontSize: 14, marginBottom: 6, color: 'var(--text-2)' }}>
                <strong>Saisis une quantité ci-dessus</strong> pour voir tes gains/pertes potentiels
              </div>
              <div style={{ fontSize: 12 }}>Résultat affiché pour chaque scénario Bear / Base / Bull</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Model info + disclaimer ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 700, marginBottom: 8 }}>📊 Méthodologie</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong>Fan chart</strong> : 5 bandes probabilistes (p10/p25/p50/p75/p90) basées sur la volatilité GJR-GARCH avec persistance β=0.83 et asymétrie γ=0.08.<br />
            <strong>Scénarios</strong> : Drift annualisé + mean reversion vers la moyenne 52S (vitesse 0.8%/jour) + momentum basé sur la position dans le range.<br />
            <strong>Source</strong> : Volatilité historique calibrée sur le Beta du sous-jacent.
          </div>
        </div>
        <div className="card" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700, marginBottom: 8 }}>⚠️ Avertissement</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            Les projections sont générées par des modèles statistiques et ne constituent pas des prévisions fiables des prix futurs.
            Les marchés peuvent évoluer significativement différemment de tout scénario présenté.
            Ces données sont à titre informatif uniquement et ne constituent pas un conseil en investissement.
          </div>
        </div>
      </div>
    </div>
  )
}
