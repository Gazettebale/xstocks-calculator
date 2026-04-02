import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { XSTOCKS_LIST } from '../data/xstocks'
import { PROTOCOLS, PROTOCOL_TYPES, RISK_LABELS, calcLendingNetApy } from '../data/protocols'

const STRATEGY_TYPES = [
  { id: 'simple_supply', label: 'Supply Simple', icon: '💰', desc: 'Déposer et percevoir des intérêts' },
  { id: 'leveraged', label: 'Levier (Supply → Borrow)', icon: '🔄', desc: 'Boucler supply/borrow pour amplifier' },
  { id: 'lp', label: 'Liquidité (LP)', icon: '🌊', desc: 'Fournir liquidité dans un pool' },
  { id: 'perp_funding', label: 'Funding Rate Perp', icon: '⚡', desc: 'Delta neutral via perp funding' },
]

function ResultBar({ protocol, value, maxValue, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{protocol.logo}</span>
          <span style={{ fontWeight: 500 }}>{protocol.name}</span>
          <span className={`badge ${RISK_LABELS[protocol.risk].class}`} style={{ fontSize: 10 }}>
            {RISK_LABELS[protocol.risk].label}
          </span>
          {protocol.earlyStage && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '1px 7px' }}>Early</span>}
          {protocol.airdrop?.active && <span style={{ fontSize: 10, background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, padding: '1px 7px' }}>🪂 Points</span>}
        </div>
        <span style={{ fontWeight: 700, color }}>{protocol.airdrop?.active ? '🪂 Points' : `${value.toFixed(2)}% APY`}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.max((value / maxValue) * 100, 2)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function ComparisonTable({ results, amount, duration }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Protocole</th>
            <th>Type</th>
            <th>APY Net</th>
            <th>Gains {duration}j</th>
            <th>Gains 1 an</th>
            <th>Rewards Token</th>
            <th>LTV Max</th>
            <th>Risque</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.protocol.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{r.protocol.logo}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.protocol.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.protocol.chain}</div>
                  </div>
                </div>
              </td>
              <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{r.protocol.type}</span></td>
              <td style={{ fontWeight: 700, color: r.netApy >= 0 ? '#10b981' : '#ef4444' }}>
                {r.netApy.toFixed(2)}%
              </td>
              <td className="positive" style={{ fontWeight: 600 }}>
                +${(amount * r.netApy / 100 / 365 * duration).toFixed(2)}
              </td>
              <td className="positive" style={{ fontWeight: 600 }}>
                +${(amount * r.netApy / 100).toFixed(2)}
              </td>
              <td>
                {r.protocol.rewards.map(rw => (
                  <span key={rw} className="badge badge-purple" style={{ fontSize: 10, marginRight: 4 }}>{rw}</span>
                ))}
              </td>
              <td>{r.protocol.ltv ? `${(r.protocol.ltv * 100).toFixed(0)}%` : '—'}</td>
              <td><span className={`badge ${RISK_LABELS[r.protocol.risk].class}`} style={{ fontSize: 11 }}>{RISK_LABELS[r.protocol.risk].label}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DefiCalculator() {
  const [selectedSymbol, setSelectedSymbol] = useState('xAAPL')
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(365)
  const [strategy, setStrategy] = useState('simple_supply')
  const [leverage, setLeverage] = useState(2)
  const [activeTab, setActiveTab] = useState('visual')

  const liveStocks = XSTOCKS_LIST.filter(x => x.status === 'live')
  const selectedStock = XSTOCKS_LIST.find(x => x.symbol === selectedSymbol)

  const results = useMemo(() => {
    return PROTOCOLS
      .filter(p => p.xstocksSupported.includes(selectedSymbol))
      .map(p => {
        let netApy = 0
        if (strategy === 'simple_supply') {
          netApy = calcLendingNetApy(p, amount, 1)
        } else if (strategy === 'leveraged' && p.borrowApr.max > 0) {
          netApy = calcLendingNetApy(p, amount, leverage)
        } else if (strategy === 'lp' && p.type === PROTOCOL_TYPES.LP) {
          netApy = (p.supplyApy.min + p.supplyApy.max) / 2 + p.rewardApy
        } else if (strategy === 'perp_funding') {
          netApy = p.supplyApy.max + p.rewardApy
        } else {
          netApy = calcLendingNetApy(p, amount, 1)
        }
        return { protocol: p, netApy: Math.max(netApy, 0) }
      })
      .sort((a, b) => b.netApy - a.netApy)
  }, [selectedSymbol, strategy, leverage])

  const maxApy = Math.max(...results.map(r => r.netApy), 0.01)
  const bestResult = results[0]

  const chartData = results.map(r => ({
    name: r.protocol.name.split(' ')[0],
    apy: parseFloat(r.netApy.toFixed(2)),
    gains: parseFloat((amount * r.netApy / 100 / 365 * duration).toFixed(2)),
  }))

  // Projection over time
  const projectionData = useMemo(() => {
    if (!bestResult) return []
    return Array.from({ length: 13 }, (_, i) => {
      const months = i
      const value = amount * Math.pow(1 + bestResult.netApy / 100 / 12, months)
      return {
        month: `M${months}`,
        valeur: parseFloat(value.toFixed(2)),
        gains: parseFloat((value - amount).toFixed(2)),
      }
    })
  }, [bestResult, amount])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          DeFi <span className="gradient-text">Calculator</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          Comparez les rendements entre protocoles pour chaque xStock
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Config Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Configuration</div>

            {/* Asset */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                ASSET xSTOCK
              </label>
              <select className="select-field" value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}>
                {liveStocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.logo} {s.symbol} — {s.name}</option>
                ))}
              </select>
              {selectedStock && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Prix actuel: <strong style={{ color: 'var(--text-primary)' }}>${selectedStock.price.toLocaleString()}</strong>
                  <span style={{ marginLeft: 10 }} className={selectedStock.change24h >= 0 ? 'positive' : 'negative'}>
                    {selectedStock.change24h >= 0 ? '+' : ''}{selectedStock.change24h}%
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                MONTANT INVESTI (USD)
              </label>
              <input
                className="input-field"
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                min={100}
                step={100}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {[1000, 5000, 10000, 50000].map(v => (
                  <button key={v} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setAmount(v)}>
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                DURÉE (JOURS): {duration}j
              </label>
              <input
                type="range"
                min={7}
                max={730}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>7j</span><span>30j</span><span>90j</span><span>180j</span><span>1an</span><span>2ans</span>
              </div>
            </div>

            {/* Strategy */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                STRATÉGIE
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STRATEGY_TYPES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 8, border: `1px solid ${strategy === s.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: strategy === s.id ? 'rgba(59,130,246,0.1)' : 'var(--bg-primary)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: strategy === s.id ? '#60a5fa' : 'var(--text-primary)' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage */}
            {strategy === 'leveraged' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                  LEVIER: {leverage}x
                </label>
                <input
                  type="range" min={1.1} max={5} step={0.1}
                  value={leverage}
                  onChange={e => setLeverage(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 12, color: '#f59e0b', marginTop: 6 }}>
                  ⚠️ Levier amplifie gains ET pertes. Risque de liquidation.
                </div>
              </div>
            )}
          </div>

          {/* PiggyBank Airdrop Banner */}
          {results.some(r => r.protocol.id === 'piggybank') && (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(245,158,11,0.08))',
              border: '1px solid rgba(236,72,153,0.35)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f472b6', marginBottom: 5 }}>🐷 PIGGYBANK — AIRDROP ACTIF</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Protocole early stage. Des <strong style={{ color: '#f59e0b' }}>points</strong> sont distribués aux premiers déposants — convertibles en tokens PIGGY au TGE. Pas encore d'APY classique, le gain se joue sur l'airdrop.
              </div>
            </div>
          )}

          {/* Best Deal */}
          {bestResult && (
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>🏆 MEILLEURE OPTION</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{bestResult.protocol.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: '8px 0' }}>
                {bestResult.netApy.toFixed(2)}% APY
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Gains estimés sur {duration}j:
                <strong style={{ color: '#10b981', marginLeft: 6 }}>
                  +${(amount * bestResult.netApy / 100 / 365 * duration).toFixed(2)}
                </strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Soit sur 1 an:
                <strong style={{ color: '#10b981', marginLeft: 6 }}>
                  +${(amount * bestResult.netApy / 100).toFixed(2)}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'visual', label: '📊 Visuel' },
              { id: 'table', label: '📋 Tableau' },
              { id: 'projection', label: '📈 Projection' },
            ].map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'visual' && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Comparaison APY — {selectedSymbol}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                Stratégie: {STRATEGY_TYPES.find(s => s.id === strategy)?.label} · Montant: ${amount.toLocaleString()}
              </div>

              {results.length > 0 ? (
                <>
                  <div style={{ marginBottom: 24 }}>
                    {results.map((r, i) => (
                      <ResultBar
                        key={r.protocol.id}
                        protocol={r.protocol}
                        value={r.netApy}
                        maxValue={maxApy}
                        color={i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#8b5cf6'}
                      />
                    ))}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Gains estimés sur {duration} jours
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ left: 10 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false}
                        tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: '#131929', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                        formatter={v => [`$${v.toFixed(2)}`, 'Gains']}
                      />
                      <Bar dataKey="gains" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Aucun protocole ne supporte {selectedSymbol} avec cette stratégie.
                </div>
              )}
            </div>
          )}

          {activeTab === 'table' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <ComparisonTable results={results} amount={amount} duration={duration} />
            </div>
          )}

          {activeTab === 'projection' && bestResult && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Projection sur 12 mois — {bestResult.protocol.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                {bestResult.netApy.toFixed(2)}% APY · Intérêts composés mensuels
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectionData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v.toLocaleString()}`} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#131929', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }}
                    formatter={(v, name) => [`$${v.toLocaleString()}`, name === 'valeur' ? 'Valeur totale' : 'Gains']}
                  />
                  <ReferenceLine y={amount} stroke="#475569" strokeDasharray="4 4" />
                  <Bar dataKey="valeur" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.5} />
                  <Bar dataKey="gains" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Summary table */}
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: '30 jours', days: 30 },
                  { label: '3 mois', days: 90 },
                  { label: '6 mois', days: 180 },
                  { label: '1 an', days: 365 },
                ].map(p => {
                  const val = amount * Math.pow(1 + bestResult.netApy / 100 / 365, p.days)
                  const gain = val - amount
                  return (
                    <div key={p.days} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{p.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>${val.toFixed(0)}</div>
                      <div style={{ fontSize: 12, color: '#10b981' }}>+${gain.toFixed(2)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Strategy comparison hint */}
          <div className="card" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#60a5fa' }}>
              💡 Comment lire ces résultats
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              L'APY affiché inclut les intérêts de base <strong>+</strong> les rewards tokens.
              Pour la stratégie levier, l'APY est calculé sur le montant total déployé moins le coût d'emprunt.
              Les pools de liquidité exposent à l'impermanent loss. Les taux varient en temps réel selon l'utilisation des protocoles.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
