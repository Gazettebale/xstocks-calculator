import { useState, useMemo } from 'react'
import { PROTOCOLS, SOLANA_PROTOCOLS, TOTAL_TVL, getProtocolsForStock, calcLendingNetApy, RISK_LABELS } from '../data/protocols'
import { useLiveTVLs, useLiveYields } from '../hooks/useLiveData'
import { formatTVL } from '../services/liveData'
import { XSTOCKS_LIST } from '../data/xstocks'

// Only Solana DeFi protocols (excludes Hyperliquid L1 and points-only programs)
const DEFI_PROTOCOLS = SOLANA_PROTOCOLS.filter(p => p.solanaDefi !== false && !p.isPointsProgram)

// ── Yield Explorer helpers ──────────────────────────────────────────────────

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ opacity: 0.3, fontSize: 10, marginLeft: 4 }}>&#9650;&#9660;</span>
  return <span style={{ fontSize: 10, marginLeft: 4, color: '#00e4b5' }}>{dir === 'asc' ? '\u25B2' : '\u25BC'}</span>
}

function LoadingPulse({ rows = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 42, borderRadius: 8,
          background: 'linear-gradient(90deg, var(--card) 25%, rgba(255,255,255,0.04) 50%, var(--card) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}

// ── Protocol Card (Overview tab) ────────────────────────────────────────────

function ProtocolCard({ protocol, liveTvl, liveApyRange, poolCount }) {
  const hasAirdrop = protocol.airdrop?.active
  const isUrgent = protocol.airdrop?.urgency === 'high'
  const displayTvl = liveTvl ?? protocol.tvl
  const xStocksCount = protocol.xstocksSupported?.length || 0

  const apyMin = liveApyRange?.min ?? protocol.supplyApy?.min ?? 0
  const apyMax = liveApyRange?.max ?? protocol.supplyApy?.max ?? 0
  const hasApy = apyMax > 0

  const riskInfo = RISK_LABELS[protocol.risk] || RISK_LABELS.medium
  const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }

  return (
    <a
      href={protocol.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--card)',
        border: `1px solid ${hasAirdrop ? (isUrgent ? 'rgba(236,72,153,0.35)' : 'rgba(99,102,241,0.25)') : 'var(--border)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        textDecoration: 'none',
        color: 'var(--text)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = protocol.color + '60'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 24px ${protocol.color}15`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = hasAirdrop ? (isUrgent ? 'rgba(236,72,153,0.35)' : 'rgba(99,102,241,0.25)') : 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: protocol.color + '18',
            border: `1px solid ${protocol.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, flexShrink: 0,
          }}>{protocol.logo}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em' }}>{protocol.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{protocol.type}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
            background: riskColors[protocol.risk] + '18',
            color: riskColors[protocol.risk],
            border: `1px solid ${riskColors[protocol.risk]}30`,
          }}>
            {riskInfo.label}
          </span>
          {protocol.earlyStage && (
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
              Early Stage
            </span>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {/* TVL */}
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>TVL</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#00e4b5' }}>{displayTvl || 'N/A'}</div>
          {liveTvl && <div style={{ fontSize: 8.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>LIVE</div>}
        </div>
        {/* APY */}
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>APY Range</div>
          {hasApy ? (
            <div style={{ fontWeight: 800, fontSize: 15, color: '#4ade80' }}>
              {apyMin.toFixed(1)}–{apyMax.toFixed(1)}%
            </div>
          ) : (
            <div style={{ fontWeight: 700, fontSize: 13, color: '#f9a8d4' }}>Points Only</div>
          )}
          {liveApyRange && <div style={{ fontSize: 8.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>LIVE</div>}
        </div>
        {/* Rewards */}
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Rewards</div>
          {protocol.rewardApy > 0 ? (
            <div style={{ fontWeight: 800, fontSize: 15, color: '#a5b4fc' }}>+{protocol.rewardApy}%</div>
          ) : (
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-3)' }}>{protocol.rewards?.[0] || '---'}</div>
          )}
          {protocol.rewards?.[0] && protocol.rewardApy > 0 && (
            <div style={{ fontSize: 8.5, color: '#a5b4fc', fontWeight: 600, marginTop: 2 }}>{protocol.rewards[0]}</div>
          )}
        </div>
      </div>

      {/* Airdrop banner */}
      {hasAirdrop && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: isUrgent ? 'rgba(236,72,153,0.08)' : 'rgba(99,102,241,0.08)',
          border: `1px solid ${isUrgent ? 'rgba(236,72,153,0.25)' : 'rgba(99,102,241,0.2)'}`,
          fontSize: 11.5, color: isUrgent ? '#f9a8d4' : '#a5b4fc',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>&#127978;</span>
          <strong>{protocol.airdrop.title}</strong>
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
            background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            {xStocksCount} xStocks
          </span>
          {poolCount > 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
              {poolCount} pools
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {protocol.rewards?.map(r => (
            <span key={r} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
              background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>{r}</span>
          ))}
          <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>Open &#8599;</span>
        </div>
      </div>
    </a>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DefiHub() {
  const [activeTab, setActiveTab] = useState('overview')
  const [yieldSort, setYieldSort] = useState({ key: 'apy', dir: 'desc' })
  const [yieldFilter, setYieldFilter] = useState('all')

  // Live data hooks
  const { tvls, tvlsFormatted, loading: tvlLoading } = useLiveTVLs()
  const { pools, loading: yieldsLoading, error: yieldsError } = useLiveYields()

  // ── Computed: live APY ranges per protocol ──
  const protocolApyRanges = useMemo(() => {
    if (!pools.length) return {}
    const ranges = {}
    for (const pool of pools) {
      const protoEntry = DEFI_PROTOCOLS.find(p => p.defillamaSlug === pool.project)
      if (!protoEntry) continue
      const totalApy = pool.apy ?? 0
      if (!ranges[protoEntry.id]) {
        ranges[protoEntry.id] = { min: totalApy, max: totalApy, count: 1 }
      } else {
        ranges[protoEntry.id].min = Math.min(ranges[protoEntry.id].min, totalApy)
        ranges[protoEntry.id].max = Math.max(ranges[protoEntry.id].max, totalApy)
        ranges[protoEntry.id].count++
      }
    }
    return ranges
  }, [pools])

  // ── Computed: stats ──
  const totalLiveTVL = useMemo(() => {
    const sum = Object.values(tvls).reduce((s, v) => s + (v || 0), 0)
    return sum > 0 ? sum : null
  }, [tvls])

  const avgApy = useMemo(() => {
    if (!pools.length) return 0
    const apys = pools.filter(p => p.apy > 0).map(p => p.apy)
    return apys.length ? apys.reduce((s, v) => s + v, 0) / apys.length : 0
  }, [pools])

  const activeAirdrops = SOLANA_PROTOCOLS.filter(p => p.airdrop?.active).length

  // ── Yield Explorer: sorted + filtered pools ──
  const filteredPools = useMemo(() => {
    let list = [...pools]
    if (yieldFilter !== 'all') {
      list = list.filter(p => p.project === yieldFilter)
    }
    list.sort((a, b) => {
      const valA = a[yieldSort.key] ?? 0
      const valB = b[yieldSort.key] ?? 0
      return yieldSort.dir === 'asc' ? valA - valB : valB - valA
    })
    return list
  }, [pools, yieldSort, yieldFilter])

  const uniqueProjects = useMemo(() => {
    const set = new Set(pools.map(p => p.project))
    return [...set].sort()
  }, [pools])

  function toggleSort(key) {
    setYieldSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
    }))
  }

  // ── Tab definitions ──
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'yields', label: 'Yield Explorer' },
    { id: 'xpoints', label: 'xPoints' },
  ]

  return (
    <div className="page-wrapper">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8,
          background: 'linear-gradient(135deg, #00e4b5, #6366f1, #f472b6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          DeFi Hub
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Live DeFi analytics for xStocks on Solana
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <span style={{ color: '#00e4b5', fontWeight: 600 }}>
            {totalLiveTVL ? formatTVL(totalLiveTVL) : `$${(TOTAL_TVL / 1000).toFixed(1)}B`} TVL
          </span>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <span style={{ fontWeight: 600 }}>{DEFI_PROTOCOLS.length} protocols</span>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <span style={{ fontWeight: 600 }}>{pools.length} live pools</span>
        </p>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'inline-flex', gap: 2, marginBottom: 24,
        background: 'var(--card)', borderRadius: 10, padding: 3,
        border: '1px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
              background: activeTab === t.id ? 'rgba(0,228,181,0.12)' : 'transparent',
              color: activeTab === t.id ? '#00e4b5' : 'var(--text-3)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              {
                label: 'Total TVL',
                value: totalLiveTVL ? formatTVL(totalLiveTVL) : `$${(TOTAL_TVL / 1000).toFixed(1)}B`,
                color: '#00e4b5',
                sub: totalLiveTVL ? 'Live from DeFiLlama' : 'Hardcoded fallback',
                live: !!totalLiveTVL,
              },
              {
                label: 'Protocols Active',
                value: DEFI_PROTOCOLS.length,
                color: '#6366f1',
                sub: 'Solana DeFi',
              },
              {
                label: 'Avg APY',
                value: avgApy > 0 ? `${avgApy.toFixed(1)}%` : '---',
                color: '#4ade80',
                sub: pools.length > 0 ? `Across ${pools.length} pools` : 'Loading...',
                live: avgApy > 0,
              },
              {
                label: 'Active Airdrops',
                value: activeAirdrops,
                color: '#f9a8d4',
                sub: 'Ongoing programs',
              },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--card)', borderRadius: 12, padding: '16px 18px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.live && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10b981', display: 'inline-block' }} />}
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Protocol cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16,
          }}>
            {DEFI_PROTOCOLS.map(p => (
              <ProtocolCard
                key={p.id}
                protocol={p}
                liveTvl={p.defillamaSlug ? tvlsFormatted[p.id] : null}
                liveApyRange={protocolApyRanges[p.id] ? { min: protocolApyRanges[p.id].min, max: protocolApyRanges[p.id].max } : null}
                poolCount={protocolApyRanges[p.id]?.count || 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── YIELD EXPLORER TAB ───────────────────────────────────────────── */}
      {activeTab === 'yields' && (
        <div>
          {/* Filter bar */}
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Filter:</div>
            <select
              value={yieldFilter}
              onChange={e => setYieldFilter(e.target.value)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 12px', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Protocols ({pools.length})</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {filteredPools.length} pools
              {yieldsLoading && <span style={{ marginLeft: 8, color: '#00e4b5' }}>Loading...</span>}
            </div>
          </div>

          {yieldsLoading ? (
            <LoadingPulse rows={10} />
          ) : yieldsError ? (
            <div style={{
              padding: '24px', textAlign: 'center', borderRadius: 12,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 13,
            }}>
              Failed to load yields: {yieldsError}
            </div>
          ) : (
            <div style={{
              background: 'var(--card)', borderRadius: 14,
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 90px 110px 90px 90px 90px 80px',
                gap: 0,
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid var(--border)',
                fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <div>Protocol</div>
                <div>Pool</div>
                <div>Chain</div>
                <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('tvlUsd')}>
                  TVL <SortIcon active={yieldSort.key === 'tvlUsd'} dir={yieldSort.dir} />
                </div>
                <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('apyBase')}>
                  APY Base <SortIcon active={yieldSort.key === 'apyBase'} dir={yieldSort.dir} />
                </div>
                <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('apyReward')}>
                  APY Reward <SortIcon active={yieldSort.key === 'apyReward'} dir={yieldSort.dir} />
                </div>
                <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('apy')}>
                  Total APY <SortIcon active={yieldSort.key === 'apy'} dir={yieldSort.dir} />
                </div>
                <div>IL Risk</div>
              </div>

              {/* Table rows */}
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {filteredPools.slice(0, 100).map((pool, i) => {
                  const totalApy = pool.apy ?? 0
                  const isTopYield = totalApy >= 20
                  return (
                    <div
                      key={pool.pool}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr 90px 110px 90px 90px 90px 80px',
                        gap: 0,
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 12.5,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.08)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,228,181,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.08)'}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pool.project}
                      </div>
                      <div style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pool.symbol || '---'}
                      </div>
                      <div style={{ color: 'var(--text-3)' }}>{pool.chain}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {pool.tvlUsd ? formatTVL(pool.tvlUsd) : '---'}
                      </div>
                      <div style={{ color: (pool.apyBase ?? 0) > 0 ? '#4ade80' : 'var(--text-3)' }}>
                        {pool.apyBase != null ? `${pool.apyBase.toFixed(2)}%` : '---'}
                      </div>
                      <div style={{ color: (pool.apyReward ?? 0) > 0 ? '#a5b4fc' : 'var(--text-3)' }}>
                        {pool.apyReward != null ? `${pool.apyReward.toFixed(2)}%` : '---'}
                      </div>
                      <div style={{
                        fontWeight: 800,
                        color: isTopYield ? '#00e4b5' : totalApy > 0 ? '#4ade80' : 'var(--text-3)',
                      }}>
                        {totalApy > 0 ? `${totalApy.toFixed(2)}%` : '---'}
                        {isTopYield && <span style={{ fontSize: 9, marginLeft: 3 }}>&#9733;</span>}
                      </div>
                      <div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                          background: pool.ilRisk === 'yes'
                            ? 'rgba(239,68,68,0.1)' : pool.ilRisk === 'no'
                            ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: pool.ilRisk === 'yes'
                            ? '#f87171' : pool.ilRisk === 'no'
                            ? '#10b981' : '#f59e0b',
                          border: `1px solid ${pool.ilRisk === 'yes'
                            ? 'rgba(239,68,68,0.2)' : pool.ilRisk === 'no'
                            ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        }}>
                          {pool.ilRisk === 'yes' ? 'Yes' : pool.ilRisk === 'no' ? 'No' : 'Varies'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredPools.length > 100 && (
                <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  Showing top 100 of {filteredPools.length} pools
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── XPOINTS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'xpoints' && (
        <div>
          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,228,181,0.06), rgba(99,102,241,0.06))',
            border: '1px solid rgba(0,228,181,0.2)', borderRadius: 14,
            padding: '28px 32px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>&#11088;</span>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#00e4b5' }}>
                  xPoints Program
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                  Official rewards program by Kraken x Backed Finance -- Season 1
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 20, maxWidth: 700 }}>
              Earn xPoints for every DeFi action with xStocks on Solana. LP, lend, hold -- every activity counts.
              Connect your wallet early for a permanent +20% bonus. Season 1 launched March 10, 2026.
            </p>
            <a
              href="https://defi.xstocks.fi/points?ref=GAZETTEBALE"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 10,
                background: 'linear-gradient(135deg, #00c896, #00a8d4)',
                color: '#05090f', fontSize: 14, fontWeight: 800, textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,228,181,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              Join xPoints &#8599;
            </a>
          </div>

          {/* Multipliers grid */}
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.01em' }}>
            Point Multipliers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { activity: 'LP on Raydium / Orca', mult: '7x', color: '#14f195', icon: '&#127754;', desc: 'Provide liquidity in xStock pools' },
              { activity: 'Lend on Kamino', mult: '5x', color: '#06b6d4', icon: '&#127974;', desc: 'Deposit xStocks as collateral' },
              { activity: 'Hold xStocks', mult: '1x', color: '#8fa3bc', icon: '&#128176;', desc: 'Simply hold in your wallet' },
              { activity: 'Early Connector', mult: '+20%', color: '#fbbf24', icon: '&#9889;', desc: 'Permanent bonus for early wallets' },
              { activity: 'Referral', mult: '+20%', color: '#f9a8d4', icon: '&#128101;', desc: 'Earn 20% of your referrals\' points' },
            ].map(m => (
              <div key={m.activity} style={{
                background: 'var(--card)', borderRadius: 12, padding: '18px 16px',
                border: `1px solid ${m.color}25`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 22 }} dangerouslySetInnerHTML={{ __html: m.icon }} />
                  <span style={{
                    fontSize: 20, fontWeight: 900, color: m.color, letterSpacing: '-0.02em',
                  }}>{m.mult}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.activity}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.01em' }}>
            How It Works
          </h3>
          <div style={{
            background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)',
            padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { step: 1, title: 'Connect your wallet', desc: 'Visit defi.xstocks.fi/points and connect your Solana wallet. Get the permanent +20% early bonus.' },
                { step: 2, title: 'Get xStocks', desc: 'Buy tokenized US equities on Jupiter, Raydium, or directly from xstocks.fi.' },
                { step: 3, title: 'Deploy in DeFi', desc: 'Provide LP on Raydium/Orca (7x) or lend on Kamino (5x) for maximum points.' },
                { step: 4, title: 'Share your referral', desc: 'Your referral earns +20% for them and you get 20% of all their points.' },
                { step: 5, title: 'Climb the leaderboard', desc: 'xBoost multiplier increases with consistency. Stay active for best rewards.' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(0,228,181,0.12)', border: '1px solid rgba(0,228,181,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color: '#00e4b5', flexShrink: 0,
                  }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important notes */}
          <div style={{
            marginTop: 20, padding: '16px 20px', borderRadius: 12,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            fontSize: 12.5, color: '#fbbf24', lineHeight: 1.7,
          }}>
            <strong>Note:</strong> No token has been officially confirmed. Points accumulate onchain. Season duration has not been announced.
            The xPoints program rewards early and active DeFi participants on Solana.
          </div>
        </div>
      )}
    </div>
  )
}
