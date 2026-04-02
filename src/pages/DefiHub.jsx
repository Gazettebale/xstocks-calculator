import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { XSTOCKS_LIST } from '../data/xstocks'
import { PROTOCOLS, SOLANA_PROTOCOLS, PROTOCOL_TYPES, RISK_LABELS, calcLendingNetApy, TOTAL_TVL } from '../data/protocols'
import { useLiveTVLs } from '../hooks/useLiveData'

// Only Solana DeFi protocols (excludes Hyperliquid L1 and points-only programs from cards)
const DEFI_PROTOCOLS = SOLANA_PROTOCOLS.filter(p => p.solanaDefi !== false && !p.isPointsProgram)

// Category groups for protocol tab display
const CATEGORY_GROUPS = [
  { key: 'swap',    label: '🔄 Swaps & Aggregateurs', desc: 'Meilleure exécution pour swapper vos xStocks' },
  { key: 'lp',     label: '🌊 Liquidité (AMM / LP)',  desc: 'Fournir liquidité et capter les fees de trading' },
  { key: 'lending',label: '🏦 Lending & Borrowing',   desc: 'Déposer en collatéral, emprunter ou prêter' },
  { key: 'vault',  label: '🔒 Vaults & Points',       desc: 'Stratégies automatisées et programmes de points' },
]

const STRATEGIES = [
  { id: 'supply', label: 'Supply / Dépôt', icon: '💰', desc: 'Déposer et percevoir intérêts + rewards' },
  { id: 'leveraged', label: 'Levier (Boucle)', icon: '🔄', desc: 'Supply → Borrow → Re-supply pour amplifier' },
  { id: 'lp', label: 'Liquidité LP', icon: '🌊', desc: 'Fournir liquidité, capter les fees de trading' },
  { id: 'perp', label: 'Perp / Funding', icon: '⚡', desc: 'Positions perps, capter funding rates' },
]

function ProtocolCard({ protocol, liveTvl }) {
  const hasAirdrop = protocol.airdrop?.active
  const isUrgent = protocol.airdrop?.urgency === 'high'
  const displayTvl = liveTvl ?? protocol.tvl

  return (
    <a
      href={protocol.url}
      target="_blank"
      rel="noopener noreferrer"
      className="protocol-card"
      style={{ borderColor: hasAirdrop ? (isUrgent ? 'rgba(236,72,153,0.3)' : 'rgba(99,102,241,0.2)') : undefined }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: protocol.color + '20', border: `1px solid ${protocol.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>{protocol.logo}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{protocol.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{protocol.type} · {protocol.chain}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span className={`badge ${RISK_LABELS[protocol.risk].class}`} style={{ fontSize: 10.5 }}>
            {RISK_LABELS[protocol.risk].label}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
        {protocol.description}
      </div>

      {/* APY Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {protocol.supplyApy.max > 0 ? (
          <>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Supply APY</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#4ade80' }}>
                {protocol.supplyApy.min.toFixed(1)}–{protocol.supplyApy.max.toFixed(1)}%
              </div>
            </div>
            {protocol.rewardApy > 0 && (
              <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Rewards</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#a5b4fc' }}>
                  +{protocol.rewardApy}% {protocol.rewards[0]}
                </div>
              </div>
            )}
            {protocol.borrowApr.max > 0 && (
              <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Borrow APR</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#f59e0b' }}>
                  {protocol.borrowApr.min.toFixed(1)}–{protocol.borrowApr.max.toFixed(1)}%
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(245,158,11,0.05))', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(236,72,153,0.25)' }}>
            <div style={{ fontSize: 11, color: '#f9a8d4', fontWeight: 700, marginBottom: 4 }}>🪂 AIRDROP ACTIF — Points en cours</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{protocol.airdrop?.title}</div>
          </div>
        )}
      </div>

      {/* Airdrop Banner */}
      {hasAirdrop && protocol.supplyApy.max > 0 && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          fontSize: 12, color: '#a5b4fc',
        }}>
          🪂 <strong>{protocol.airdrop.title}</strong> — {protocol.airdrop.description.slice(0, 80)}...
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>TVL:</span>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>{displayTvl}</span>
          {liveTvl && <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700 }}>● Live</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {protocol.rewards.map(r => <span key={r} className="badge badge-purple" style={{ fontSize: 10.5 }}>{r}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={protocol.twitterUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11.5, color: 'var(--text-3)', textDecoration: 'none' }}>𝕏</a>
          <a href={protocol.docsUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11.5, color: 'var(--text-3)', textDecoration: 'none' }}>Docs</a>
          <span style={{ fontSize: 11.5, color: '#a5b4fc' }}>↗ Ouvrir</span>
        </div>
      </div>
    </a>
  )
}

export default function DefiHub() {
  const [selectedSymbol, setSelectedSymbol] = useState('xAAPL')
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(365)
  const [strategy, setStrategy] = useState('supply')
  const [leverage, setLeverage] = useState(2)
  const [activeTab, setActiveTab] = useState('protocols')

  // Live TVL from DeFiLlama (refreshes every 5 min)
  const { tvlsFormatted } = useLiveTVLs()

  const liveStocks = XSTOCKS_LIST.filter(x => x.status === 'live')
  const selectedStock = XSTOCKS_LIST.find(x => x.symbol === selectedSymbol)

  const calcResults = useMemo(() => {
    return DEFI_PROTOCOLS
      .filter(p => p.xstocksSupported.includes(selectedSymbol))
      .map(p => {
        let netApy = 0
        const isPointsOnly = p.supplyApy.max === 0

        if (isPointsOnly) {
          netApy = 0 // Points-only protocol — no APY
        } else if (strategy === 'leveraged') {
          if (p.borrowApr.max > 0) {
            // Only lending protocols support looping
            netApy = calcLendingNetApy(p, amount, leverage)
          } else {
            // LP/Vault: no borrow loop available — use base supply
            netApy = p.supplyApy.min + p.rewardApy * 0.5
          }
        } else if (strategy === 'lp') {
          if (p.type === PROTOCOL_TYPES.LP) {
            // LP protocol: full fee range + rewards (this IS what LPs earn)
            netApy = (p.supplyApy.min + p.supplyApy.max) / 2 + p.rewardApy
          } else if (p.type === PROTOCOL_TYPES.PERP) {
            // Perp protocols: JLP-style vault exposure to LP fees
            netApy = p.supplyApy.max * 0.6 + p.rewardApy
          } else {
            // Lending protocols: LP not directly applicable — minimal return
            netApy = p.supplyApy.min
          }
        } else if (strategy === 'perp') {
          if (p.type === PROTOCOL_TYPES.PERP) {
            // Perp protocol: full yield via funding rates + vault APY
            netApy = p.supplyApy.max + p.rewardApy
          } else if (p.type === PROTOCOL_TYPES.LP) {
            // LP as liquidity for perp vault (partial)
            netApy = p.supplyApy.min + p.rewardApy * 0.7
          } else {
            // Lending: collateral for perp, basic interest
            netApy = p.supplyApy.min + p.rewardApy * 0.4
          }
        } else {
          // supply (default): standard deposit + rewards
          netApy = p.supplyApy.max + p.rewardApy
        }

        const annualGains = amount * Math.max(netApy, 0) / 100
        // Compound interest for duration > 365 days
        const years = duration / 365
        const gainsDuration = strategy === 'supply' || strategy === 'leveraged'
          ? amount * (Math.pow(1 + Math.max(netApy, 0) / 100, years) - 1)
          : annualGains / 365 * duration // simple for LP/perp

        return { protocol: p, netApy: Math.max(netApy, 0), gains365: annualGains, gainsDuration, isPointsOnly }
      })
      .sort((a, b) => b.netApy - a.netApy)
  }, [selectedSymbol, strategy, leverage, amount, duration])

  const chartData = calcResults.filter(r => !r.isPointsOnly).map(r => ({
    name: r.protocol.name.split(' ')[0],
    apy: parseFloat(r.netApy.toFixed(2)),
    gains: parseFloat(r.gainsDuration.toFixed(0)),
    fill: r.protocol.color,
  }))

  const best = calcResults.find(r => !r.isPointsOnly)

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">DeFi <span className="gradient-text">Hub</span></h1>
        <p className="page-subtitle">Protocoles DeFi xStocks · Clique sur une carte pour accéder au site officiel</p>
      </div>

      {/* TVL Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TVL Total (Solana)', value: `$${(TOTAL_TVL/1000).toFixed(1)}B`, color: '#14f195' },
          { label: 'Protocoles Solana', value: DEFI_PROTOCOLS.length, color: '#00e4b5' },
          { label: 'Airdrops Actifs', value: SOLANA_PROTOCOLS.filter(p=>p.airdrop?.active).length, color: '#f9a8d4' },
          { label: 'xStocks Supportés', value: Math.max(...DEFI_PROTOCOLS.map(p=>p.xstocksSupported.length)), color: '#fbbf24', sub: 'max par protocole' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 24, marginTop: 8 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20, display: 'inline-flex' }}>
        {[
          { id: 'protocols', label: '🏦 Protocoles' },
          { id: 'calculator', label: '⚡ Calculateur' },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Protocol Cards ─────────────────────────────────────────────── */}
      {activeTab === 'protocols' && (
        <div>
          {/* xPoints multiplier context */}
          <div className="xpoints-banner" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⭐</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#00e4b5', marginBottom: 4 }}>
                  Gagnez des xPoints sur ces protocoles — Programme Officiel Kraken × Backed Finance
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'LP Raydium/Orca', mult: '7×', color: '#14f195' },
                    { label: 'Lend Kamino', mult: '5×', color: '#00c896' },
                    { label: 'Hold xStocks', mult: '1×', color: '#8fa3bc' },
                    { label: 'Connexion tôt', mult: '+20%', color: '#fbbf24' },
                    { label: 'Referral', mult: '+20%', color: '#f9a8d4' },
                  ].map(m => (
                    <span key={m.label} style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      <strong style={{ color: m.color }}>{m.mult}</strong> {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <a
              href="https://defi.xstocks.fi/points?ref=GAZETTEBALE"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
                background: 'linear-gradient(135deg, #00c896, #00a8d4)',
                color: '#05090f', fontSize: 12.5, fontWeight: 800, flexShrink: 0,
              }}
            >⭐ Rejoindre xPoints</a>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
            Protocoles DeFi Solana intégrant les xStocks · Clique sur une carte pour accéder au site officiel · Hyperliquid (autre blockchain) non inclus
          </div>

          {CATEGORY_GROUPS.map(group => {
            const grouped = DEFI_PROTOCOLS.filter(p => p.category === group.key)
            if (!grouped.length) return null
            return (
              <div key={group.key} style={{ marginBottom: 32 }}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                      {group.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{group.desc}</div>
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {grouped.map(p => (
                    <ProtocolCard
                      key={p.id}
                      protocol={p}
                      liveTvl={p.defillamaSlug ? tvlsFormatted[p.id] : null}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Calculator ─────────────────────────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Configuration</div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asset</label>
                <select className="select" value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}>
                  {liveStocks.map(s => <option key={s.symbol} value={s.symbol}>{s.logo} {s.symbol} — {s.name}</option>)}
                </select>
                {selectedStock && (
                  <div style={{ marginTop: 6, fontSize: 12, padding: '7px 10px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-2)' }}>Prix: </span>
                    <strong>${selectedStock.price >= 1000 ? selectedStock.price.toLocaleString() : selectedStock.price.toFixed(2)}</strong>
                    <span className={selectedStock.change24h >= 0 ? ' positive' : ' negative'} style={{ marginLeft: 8, fontWeight: 600 }}>
                      {selectedStock.change24h >= 0 ? '+' : ''}{selectedStock.change24h}%
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Montant (USD)</label>
                <input className="input" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={100} />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {[1000, 5000, 10000, 50000].map(v => (
                    <button key={v} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11.5 }} onClick={() => setAmount(v)}>
                      ${v >= 1000 ? `${v/1000}K` : v}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Durée: {duration >= 365 ? `${(duration/365).toFixed(duration % 365 === 0 ? 0 : 1)} an(s)` : `${duration}j`}
                </label>
                <input type="range" min={7} max={3650} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                  {['7j','1an','2ans','3ans','5ans','10ans'].map(l => <span key={l}>{l}</span>)}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {[{l:'30j',v:30},{l:'1A',v:365},{l:'2A',v:730},{l:'3A',v:1095},{l:'5A',v:1825},{l:'10A',v:3650}].map(x => (
                    <button key={x.v} className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setDuration(x.v)}>
                      {x.l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stratégie</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {STRATEGIES.map(s => (
                    <button key={s.id} onClick={() => setStrategy(s.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      borderRadius: 8, border: `1px solid ${strategy === s.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: strategy === s.id ? 'rgba(99,102,241,0.1)' : 'var(--bg)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 17 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: strategy === s.id ? '#a5b4fc' : 'var(--text)' }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {strategy === 'leveraged' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Levier: {leverage}×
                  </label>
                  <input type="range" min={1.1} max={5} step={0.1} value={leverage} onChange={e => setLeverage(Number(e.target.value))} />
                  <div style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 7, fontSize: 12, color: '#fbbf24', marginTop: 8 }}>
                    ⚠️ Levier amplifie gains ET pertes. Risque de liquidation.
                  </div>
                </div>
              )}
            </div>

            {/* Best Result */}
            {best && (
              <div className="card-glow" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(99,102,241,0.06))', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏆 Meilleure Option</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{best.protocol.name}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#4ade80', margin: '8px 0', letterSpacing: '-0.04em' }}>
                  {best.netApy.toFixed(2)}%
                  <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}> APY</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
                  Sur {duration >= 365 ? `${(duration/365).toFixed(1)} an(s)` : `${duration}j`}: <strong style={{ color: '#4ade80' }}>+${best.gainsDuration.toLocaleString('en',{maximumFractionDigits:0})}</strong><br />
                  Sur 1 an: <strong style={{ color: '#4ade80' }}>+${best.gains365.toLocaleString('en',{maximumFractionDigits:0})}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Comparaison — {selectedSymbol}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
                {STRATEGIES.find(s => s.id === strategy)?.label} · ${amount.toLocaleString()} · {duration >= 365 ? `${(duration/365).toFixed(1)}A` : `${duration}j`}
              </div>

              {/* APY Bars */}
              <div style={{ marginBottom: 24 }}>
                {calcResults.map((r, i) => (
                  <div key={r.protocol.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href={r.protocol.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{r.protocol.logo}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13.5 }}>{r.protocol.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>↗</span>
                        </a>
                        <span className={`badge ${RISK_LABELS[r.protocol.risk].class}`} style={{ fontSize: 10 }}>
                          {RISK_LABELS[r.protocol.risk].label}
                        </span>
                        {r.protocol.earlyStage && <span className="badge badge-orange" style={{ fontSize: 9.5 }}>Early Stage</span>}
                        {r.protocol.airdrop?.active && <span className="badge badge-pink" style={{ fontSize: 9.5 }}>🪂 Points</span>}
                      </div>
                      <span style={{ fontWeight: 800, color: r.isPointsOnly ? '#f9a8d4' : '#4ade80', fontSize: 15 }}>
                        {r.isPointsOnly ? '🪂 Points' : `${r.netApy.toFixed(2)}%`}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: r.isPointsOnly ? '15%' : `${Math.max((r.netApy / Math.max(...calcResults.filter(x=>!x.isPointsOnly).map(x=>x.netApy), 1)) * 100, 5)}%`,
                        background: r.isPointsOnly
                          ? 'linear-gradient(90deg, #ec4899, #a855f7)'
                          : i === 0 ? 'linear-gradient(90deg, #22c55e, #10b981)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar Chart */}
              {chartData.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Gains estimés sur {duration >= 365 ? `${(duration/365).toFixed(1)} an(s)` : `${duration}j`} ($)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4a5568' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#4a5568' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} width={50} />
                      <Tooltip contentStyle={{ background: '#0d1421', border: '1px solid #1a2840', borderRadius: 8, fontSize: 12 }}
                        formatter={v => [`$${v.toLocaleString()}`, 'Gains estimés']} />
                      <Bar dataKey="gains" radius={[4,4,0,0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            <div className="card" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.15)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 8 }}>💡 Comment lire ces résultats</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                L'APY inclut le taux de base + rewards tokens. Les pools LP exposent à l'<strong>impermanent loss</strong>.
                PiggyBank distribue des <strong>Oink Points</strong> sans APY classique — le gain dépend du TGE futur du token PIGGY.
                Les taux varient en temps réel selon l'utilisation des protocoles.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
