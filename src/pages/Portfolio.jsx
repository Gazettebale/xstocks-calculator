import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, ComposedChart, Line, Bar, CartesianGrid,
} from 'recharts'
import { XSTOCKS_LIST } from '../data/xstocks'
import { PROTOCOLS } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'

// ─── constants ───────────────────────────────────────────────────────────────

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16']

const STRATEGY_LABELS = {
  hold:       { label: 'Hold',    color: '#60a5fa' },
  supply:     { label: 'Supply',  color: '#10b981' },
  lp:         { label: 'LP',      color: '#8b5cf6' },
  leveraged:  { label: 'Levier',  color: '#f59e0b' },
  perp:       { label: 'Perp',    color: '#f43f5e' },
}

const TABS = [
  { id: 'positions', label: '💼 Positions' },
  { id: 'dca',       label: '📅 DCA Tracker' },
  { id: 'watchlist', label: '⭐ Watchlist' },
  { id: 'sectors',   label: '🗂️ Secteurs' },
]

// ─── modal: add position ─────────────────────────────────────────────────────

function AddPositionModal({ onClose }) {
  const addPosition = usePortfolioStore(s => s.addPosition)
  const [form, setForm] = useState({
    symbol: 'xAAPL', quantity: '', entryPrice: '', protocol: '', strategy: 'hold', notes: '',
  })

  const liveStocks = XSTOCKS_LIST.filter(x => x.status === 'live')
  const selectedStock = XSTOCKS_LIST.find(x => x.symbol === form.symbol)
  const availableProtocols = PROTOCOLS.filter(p => p.xstocksSupported?.includes(form.symbol))
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }))
  const cost = (parseFloat(form.quantity) || 0) * (parseFloat(form.entryPrice) || 0)

  const handleSubmit = () => {
    if (!form.quantity || !form.entryPrice) return
    addPosition({
      symbol: form.symbol,
      name: selectedStock?.name || '',
      quantity: parseFloat(form.quantity),
      entryPrice: parseFloat(form.entryPrice),
      protocol: form.protocol || null,
      strategy: form.strategy,
      notes: form.notes,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Ajouter une position</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Asset</label>
            <select className="select-field" value={form.symbol} onChange={e => update('symbol', e.target.value)}>
              {liveStocks.map(s => <option key={s.symbol} value={s.symbol}>{s.logo} {s.symbol} — {s.name}</option>)}
            </select>
            {selectedStock && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-3)' }}>
                Prix actuel: <strong style={{ color: 'white' }}>${selectedStock.price.toLocaleString()}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Quantité</label>
              <input className="input-field" type="number" placeholder="10" value={form.quantity} onChange={e => update('quantity', e.target.value)} min={0} step={0.001} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Prix d'entrée ($)</label>
              <input className="input-field" type="number" placeholder={selectedStock?.price || '0'} value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} min={0} step={0.01} />
            </div>
          </div>

          {cost > 0 && (
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, fontSize: 13 }}>
              Coût total: <strong style={{ color: '#a5b4fc' }}>${cost.toLocaleString('en', { maximumFractionDigits: 2 })}</strong>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Protocole (optionnel)</label>
            <select className="select-field" value={form.protocol} onChange={e => update('protocol', e.target.value)}>
              <option value="">Wallet / Spot</option>
              {availableProtocols.map(p => <option key={p.id} value={p.id}>{p.logo} {p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Stratégie</label>
            <select className="select-field" value={form.strategy} onChange={e => update('strategy', e.target.value)}>
              {Object.entries(STRATEGY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Notes (optionnel)</label>
            <input className="input-field" type="text" placeholder="DCA mensuel, TP à $300..." value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={!form.quantity || !form.entryPrice}>
              Ajouter la position
            </button>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DCA Tracker ─────────────────────────────────────────────────────────────

function DCATracker() {
  const [dcaSymbol, setDcaSymbol] = useState('xAAPL')
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  const [startPrice, setStartPrice] = useState('')
  const [months, setMonths] = useState(12)
  const [annualGrowth, setAnnualGrowth] = useState(12)

  const stock = XSTOCKS_LIST.find(x => x.symbol === dcaSymbol)
  const liveStocks = XSTOCKS_LIST.filter(x => x.status === 'live')

  const dcaData = useMemo(() => {
    const monthly = parseFloat(monthlyAmount) || 500
    const initPrice = parseFloat(startPrice) || stock.price
    const growth = (1 + annualGrowth / 100) ** (1 / 12) - 1 // monthly growth factor

    let totalInvested = 0
    let totalTokens = 0
    const rows = []

    for (let m = 1; m <= months; m++) {
      const price = initPrice * (1 + growth) ** m
      const tokensBought = monthly / price
      totalInvested += monthly
      totalTokens += tokensBought
      const avgCost = totalInvested / totalTokens
      const currentValue = totalTokens * price
      const pnl = currentValue - totalInvested
      const pnlPct = (pnl / totalInvested) * 100

      const d = new Date()
      d.setMonth(d.getMonth() + m)
      rows.push({
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        price: parseFloat(price.toFixed(2)),
        tokens: parseFloat(tokensBought.toFixed(4)),
        totalTokens: parseFloat(totalTokens.toFixed(4)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        avgCost: parseFloat(avgCost.toFixed(2)),
        value: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct: parseFloat(pnlPct.toFixed(1)),
      })
    }

    return rows
  }, [dcaSymbol, monthlyAmount, startPrice, months, annualGrowth, stock.price])

  const final = dcaData[dcaData.length - 1]

  return (
    <div>
      {/* Config */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          📅 Simulateur DCA mensuel
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Asset</label>
            <select className="select-field" value={dcaSymbol} onChange={e => setDcaSymbol(e.target.value)}>
              {liveStocks.map(s => <option key={s.symbol} value={s.symbol}>{s.logo} {s.symbol}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Montant/mois ($)</label>
            <input className="input-field" type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} min={1} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Prix départ ($)</label>
            <input className="input-field" type="number" placeholder={String(stock.price)} value={startPrice} onChange={e => setStartPrice(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Durée (mois)</label>
            <input className="input-field" type="number" value={months} onChange={e => setMonths(Math.max(1, Math.min(60, parseInt(e.target.value) || 12)))} min={1} max={60} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Croissance ann. (%)</label>
            <input className="input-field" type="number" value={annualGrowth} onChange={e => setAnnualGrowth(parseFloat(e.target.value) || 0)} step={1} />
          </div>
        </div>
      </div>

      {/* Summary */}
      {final && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          {[
            { label: 'Investi total', value: `$${final.totalInvested.toLocaleString('en', { maximumFractionDigits: 0 })}`, color: '#a5b4fc' },
            { label: 'Valeur finale', value: `$${final.value.toLocaleString('en', { maximumFractionDigits: 0 })}`, color: '#4ade80' },
            { label: 'PnL estimé', value: `${final.pnl >= 0 ? '+' : ''}$${final.pnl.toLocaleString('en', { maximumFractionDigits: 0 })}`, color: final.pnl >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Performance', value: `${final.pnlPct >= 0 ? '+' : ''}${final.pnlPct}%`, color: final.pnlPct >= 0 ? '#4ade80' : '#f87171' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart: value vs invested */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          Valeur portfolio vs capital investi · {stock.logo} {dcaSymbol} · ${parseFloat(monthlyAmount) || 500}/mois
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={dcaData} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="dcaValueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dcaInvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} interval={Math.floor(dcaData.length / 6)} />
            <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} width={58} />
            <Tooltip
              contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => [`$${v.toLocaleString()}`, name]}
            />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#dcaValueGrad)" dot={false} name="Valeur" />
            <Area type="monotone" dataKey="totalInvested" stroke="#6366f1" strokeWidth={2} fill="url(#dcaInvGrad)" dot={false} name="Investi" strokeDasharray="5 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
          Détail mois par mois
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Mois</th>
                <th>Prix</th>
                <th>Tokens achetés</th>
                <th>Total tokens</th>
                <th>Coût moyen</th>
                <th>Investi</th>
                <th>Valeur</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {dcaData.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.month}</td>
                  <td>${row.price.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--text-2)' }}>{row.tokens}</td>
                  <td style={{ fontWeight: 600 }}>{row.totalTokens}</td>
                  <td style={{ color: '#a5b4fc' }}>${row.avgCost.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--text-2)' }}>${row.totalInvested.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                  <td style={{ fontWeight: 700 }}>${row.value.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                  <td>
                    <span style={{ color: row.pnl >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString('en', { maximumFractionDigits: 0 })} ({row.pnlPct}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const positions = usePortfolioStore(s => s.positions)
  const removePosition = usePortfolioStore(s => s.removePosition)
  const watchlist = usePortfolioStore(s => s.watchlist)
  const removeFromWatchlist = usePortfolioStore(s => s.removeFromWatchlist)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState('positions')

  const currentPrices = useMemo(() => {
    const m = {}
    XSTOCKS_LIST.forEach(x => { m[x.symbol] = x.price })
    return m
  }, [])

  const enriched = useMemo(() => positions.map(pos => {
    const currentPrice = currentPrices[pos.symbol] || pos.entryPrice
    const currentValue = currentPrice * pos.quantity
    const cost = pos.entryPrice * pos.quantity
    const pnl = currentValue - cost
    const pnlPct = (pnl / cost) * 100
    const stock = XSTOCKS_LIST.find(x => x.symbol === pos.symbol)
    const protocol = pos.protocol ? PROTOCOLS.find(p => p.id === pos.protocol) : null
    return { ...pos, currentPrice, currentValue, cost, pnl, pnlPct, stock, protocol }
  }), [positions, currentPrices])

  const totalValue = enriched.reduce((s, p) => s + p.currentValue, 0)
  const totalCost = enriched.reduce((s, p) => s + p.cost, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  const allocationData = useMemo(() => enriched.map((p, i) => ({
    name: p.symbol, value: parseFloat(p.currentValue.toFixed(2)), color: COLORS[i % COLORS.length],
  })), [enriched])

  const sectorAlloc = useMemo(() => {
    const map = {}
    enriched.forEach(p => {
      const s = p.stock?.sector || 'Autre'
      map[s] = (map[s] || 0) + p.currentValue
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [enriched])

  // Simulated portfolio history
  const portfolioHistory = useMemo(() => {
    if (positions.length === 0) return []
    return Array.from({ length: 30 }, (_, i) => {
      const noise = 1 + (Math.sin(i * 0.7) * 0.015 + (i / 30) * 0.08)
      return {
        day: `J-${29 - i}`,
        value: parseFloat((totalValue * 0.88 * noise).toFixed(2)),
      }
    })
  }, [positions.length, totalValue])

  const isEmpty = positions.length === 0

  return (
    <div>
      {showAddModal && <AddPositionModal onClose={() => setShowAddModal(false)} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            Portfolio <span className="gradient-text">&amp; DCA</span>
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: 5, fontSize: 14 }}>
            Suivi de positions · DCA mensuel · Analyse sectorielle
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Ajouter position</button>
      </div>

      {/* ── Tabs — always visible including DCA ────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.id === 'positions' && positions.length > 0 && (
              <span style={{ marginLeft: 6, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: 8, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                {positions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── DCA tab — always available ─────────────────────────────────────── */}
      {activeTab === 'dca' && <DCATracker />}

      {/* ── Positions tab ─────────────────────────────────────────────────── */}
      {activeTab === 'positions' && (
        <>
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💼</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Portfolio vide</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                Ajoute ta première position pour suivre tes xStocks à travers tous les protocoles.
              </div>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Ajouter ma première position</button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                {[
                  { label: 'Valeur Totale', value: `$${totalValue.toLocaleString('en', { maximumFractionDigits: 2 })}`, color: '#a5b4fc' },
                  { label: 'Capital Investi', value: `$${totalCost.toLocaleString('en', { maximumFractionDigits: 2 })}` },
                  { label: 'PnL Total', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString('en', { maximumFractionDigits: 2 })}`, color: totalPnL >= 0 ? '#4ade80' : '#f87171' },
                  { label: 'Performance', value: `${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`, color: totalPnLPct >= 0 ? '#4ade80' : '#f87171' },
                ].map(c => (
                  <div key={c.label} className="card">
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: c.color || 'var(--text)' }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 22 }}>
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Évolution estimée (30j)</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={portfolioHistory}>
                      <defs>
                        <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} interval={5} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                        tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} width={58} />
                      <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                        formatter={v => [`$${v.toLocaleString()}`, 'Valeur']} />
                      <Area type="monotone" dataKey="value" stroke={totalPnL >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2.5} fill="url(#portGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Allocation</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                        {allocationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }}
                        formatter={(v, n) => [`$${v.toLocaleString()}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {allocationData.map(a => (
                      <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text-2)' }}>{a.name}</span>
                        <span style={{ fontWeight: 700 }}>{totalValue > 0 ? ((a.value / totalValue) * 100).toFixed(1) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Positions table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Qté</th>
                      <th>Entrée</th>
                      <th>Actuel</th>
                      <th>Coût</th>
                      <th>Valeur</th>
                      <th>PnL</th>
                      <th>Protocole</th>
                      <th>Stratégie</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map(pos => {
                      const strat = STRATEGY_LABELS[pos.strategy] || STRATEGY_LABELS.hold
                      return (
                        <tr key={pos.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 20 }}>{pos.stock?.logo || '📊'}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{pos.symbol}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{pos.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{pos.quantity}</td>
                          <td>${pos.entryPrice.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 700 }}>${pos.currentPrice.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                          <td style={{ color: 'var(--text-2)' }}>${pos.cost.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 700 }}>${pos.currentValue.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                          <td>
                            <div style={{ color: pos.pnl >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                              {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, color: pos.pnlPct >= 0 ? '#4ade80' : '#f87171' }}>
                              {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                            </div>
                          </td>
                          <td>
                            {pos.protocol ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <a href={pos.protocol.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)', textDecoration: 'none', fontSize: 12 }}>
                                  <span>{pos.protocol.logo}</span>{pos.protocol.name.split(' ')[0]}
                                </a>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Wallet</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              background: strat.color + '20', color: strat.color,
                              border: `1px solid ${strat.color}40`,
                              borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                            }}>
                              {strat.label}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => removePosition(pos.id)}
                              style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171', borderRadius: 6, cursor: 'pointer',
                                width: 26, height: 26, fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Watchlist tab ─────────────────────────────────────────────────── */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun xStock en watchlist</div>
              <div style={{ fontSize: 13 }}>Ajoute des assets depuis la page Markets.</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Prix</th>
                    <th>24h</th>
                    <th>52W Range</th>
                    <th>Protocoles</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map(sym => {
                    const s = XSTOCKS_LIST.find(x => x.symbol === sym)
                    if (!s) return null
                    return (
                      <tr key={sym}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>{s.logo}</span>
                            <div>
                              <div style={{ fontWeight: 700 }}>{s.symbol}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>${s.price.toLocaleString()}</td>
                        <td style={{ color: s.change24h >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                          {s.change24h >= 0 ? '▲' : '▼'} {Math.abs(s.change24h)}%
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          ${s.low52w} — ${s.high52w}
                        </td>
                        <td style={{ fontSize: 12 }}>{s.protocols?.length || 0} protocoles</td>
                        <td>
                          <button
                            onClick={() => removeFromWatchlist(sym)}
                            style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', borderRadius: 6, cursor: 'pointer',
                              width: 26, height: 26, fontSize: 12, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sectors tab ───────────────────────────────────────────────────── */}
      {activeTab === 'sectors' && (
        <div>
          {isEmpty ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗂️</div>
              <div>Ajoute des positions pour voir l'analyse sectorielle.</div>
            </div>
          ) : (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Allocation par Secteur</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sectorAlloc.sort((a, b) => b.value - a.value).map((s, i) => {
                  const pct = totalValue > 0 ? (s.value / totalValue) * 100 : 0
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                          ${s.value.toLocaleString('en', { maximumFractionDigits: 0 })} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                          borderRadius: 4, transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
