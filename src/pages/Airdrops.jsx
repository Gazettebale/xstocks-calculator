import { useState } from 'react'
import { PROTOCOLS, SOLANA_PROTOCOLS } from '../data/protocols'

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function fmtDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Build enriched airdrop list — Solana only (exclude Hyperliquid)
const ALL_AIRDROPS = SOLANA_PROTOCOLS.map(p => ({
  protocol: p,
  ...p.airdrop,
  days: p.airdrop?.endDate ? daysLeft(p.airdrop.endDate) : null,
})).sort((a, b) => {
  // Active first, then by urgency
  if (a.active && !b.active) return -1
  if (!a.active && b.active) return 1
  if (a.days !== null && b.days !== null) return a.days - b.days
  return 0
})

// ─── sub-components ──────────────────────────────────────────────────────────

function UrgencyBadge({ days, active }) {
  if (!active || (days !== null && days < 0)) return (
    <span style={{
      background: 'rgba(71,85,105,0.3)', color: '#94a3b8',
      border: '1px solid rgba(71,85,105,0.4)',
      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>TERMINÉ</span>
  )
  if (days === null) return (
    <span style={{
      background: 'rgba(34,197,94,0.15)', color: '#4ade80',
      border: '1px solid rgba(34,197,94,0.3)',
      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>EN COURS</span>
  )
  if (days <= 3) return (
    <span className="airdrop-urgent" style={{
      background: 'rgba(239,68,68,0.2)', color: '#f87171',
      border: '1px solid rgba(239,68,68,0.5)',
      borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 800,
    }}>🚨 {days}J RESTANTS</span>
  )
  if (days <= 14) return (
    <span style={{
      background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
      border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>⚠️ {days}J</span>
  )
  return (
    <span style={{
      background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>{days}J</span>
  )
}

function StepBadge({ n }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, color: 'white',
    }}>{n}</div>
  )
}

function AirdropCard({ item, expanded, onToggle }) {
  const { protocol: p, active, title, description, endDate, days, vestingInfo, multipliers, howTo, season } = item
  const isUrgent = active && days !== null && days <= 7

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        borderColor: isUrgent
          ? 'rgba(239,68,68,0.5)'
          : active
          ? `${p.color}44`
          : 'var(--border)',
        background: isUrgent
          ? 'rgba(239,68,68,0.04)'
          : active
          ? `${p.color}06`
          : 'var(--card)',
        transition: 'all 0.2s',
        animation: isUrgent ? 'urgentPulse 2s infinite' : undefined,
      }}
      onClick={onToggle}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: expanded ? 16 : 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${p.color}20`, border: `1.5px solid ${p.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{p.logo}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
            {season && (
              <span style={{
                background: `${p.color}20`, color: p.color,
                border: `1px solid ${p.color}40`,
                borderRadius: 6, padding: '1px 6px', fontSize: 10.5, fontWeight: 700,
              }}>S{season}</span>
            )}
            <UrgencyBadge days={days} active={active} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {active && p.rewards?.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {p.rewards.map(r => (
                <span key={r} style={{
                  background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                }}>{r}</span>
              ))}
            </div>
          )}
          <span style={{ fontSize: 16, color: 'var(--text-3)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div onClick={e => e.stopPropagation()}>
          {/* Quick stats bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20,
            padding: '14px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 10,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Protocole
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.type}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Date de fin
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isUrgent ? '#f87171' : 'var(--text)' }}>
                {endDate ? fmtDate(endDate) : 'Pas de deadline'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                xStocks supportés
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.xstocksSupported?.length || 0} assets</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
            {description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Vesting */}
            {vestingInfo && (
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  📅 Vesting / Distribution
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{vestingInfo}</div>
              </div>
            )}

            {/* Multipliers */}
            {multipliers && (
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  ✨ Multiplicateurs / Boost
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{multipliers}</div>
              </div>
            )}
          </div>

          {/* How-to */}
          {howTo && active && (
            <div style={{
              background: `${p.color}10`, border: `1px solid ${p.color}30`,
              borderRadius: 10, padding: '16px 18px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                🎯 Comment participer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {howTo.split('·').map((step, i) => step.trim()).filter(Boolean).map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <StepBadge n={i + 1} />
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, paddingTop: 2 }}>{step.replace(/^\d+\.\s*/, '')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                background: active ? p.color : 'rgba(99,102,241,0.1)',
                color: active ? 'white' : '#a5b4fc',
                border: active ? 'none' : '1px solid rgba(99,102,241,0.3)',
                fontSize: 13, fontWeight: 700,
              }}
            >
              {active ? '🚀 Participer maintenant' : '🔗 Voir le protocole'}
            </a>
            <a
              href={p.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                background: 'rgba(29,161,242,0.1)', color: '#60a5fa',
                border: '1px solid rgba(29,161,242,0.2)',
                fontSize: 13, fontWeight: 600,
              }}
            >
              𝕏 Suivre
            </a>
            <a
              href={p.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8, textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)',
                border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600,
              }}
            >
              📄 Docs
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: '🔥 Actifs' },
  { id: 'urgent', label: '🚨 Urgents' },
  { id: 'ended', label: 'Terminés' },
]

export default function Airdrops() {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const activeCount = ALL_AIRDROPS.filter(a => a.active).length
  const urgentCount = ALL_AIRDROPS.filter(a => a.active && a.days !== null && a.days <= 14).length
  const piggyDays = daysLeft('2026-03-31')

  const filtered = ALL_AIRDROPS.filter(a => {
    if (filter === 'active') return a.active
    if (filter === 'urgent') return a.active && a.days !== null && a.days <= 14
    if (filter === 'ended') return !a.active
    return true
  })

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          Airdrops & <span className="gradient-text">Incentives</span>
        </h1>
        <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>
          Tous les programmes de récompenses actifs sur les protocoles xStocks
        </p>
      </div>

      {/* ── xPoints main featured banner ──────────────────────────────────── */}
      <div className="xpoints-banner" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'rgba(0,200,150,0.15)', border: '2px solid rgba(0,200,150,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>⭐</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#00e4b5', marginBottom: 5 }}>
              xStocks xPoints — Le Programme Principal (Kraken × Backed Finance)
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Lancé le 10 mars 2026 · Pas de token confirmé mais fort signal d'airdrop futur
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'LP Raydium/Orca', mult: '7×', color: '#14f195' },
                { label: 'Lend Kamino', mult: '5×', color: '#00c896' },
                { label: 'Hold', mult: '1×', color: '#8fa3bc' },
                { label: 'Early wallet', mult: '+20% perm.', color: '#fbbf24' },
                { label: 'Referral', mult: '+20%', color: '#f9a8d4' },
              ].map(m => (
                <span key={m.label} style={{ fontSize: 11.5, background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '2px 8px', color: 'var(--text-2)' }}>
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
            padding: '12px 24px', borderRadius: 10, textDecoration: 'none',
            background: 'linear-gradient(135deg, #00c896, #00a8d4)',
            color: '#05090f', fontSize: 13.5, fontWeight: 900, flexShrink: 0,
            boxShadow: '0 4px 20px rgba(0,200,150,0.4)',
          }}
        >
          ⭐ Rejoindre xPoints →
        </a>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Programmes actifs', value: activeCount, color: '#4ade80', icon: '✅' },
          { label: 'Se terminent bientôt', value: urgentCount, color: '#fbbf24', icon: '⏰' },
          { label: 'Protocoles total', value: PROTOCOLS.length, color: '#a5b4fc', icon: '🏛️' },
          { label: 'xPoints (officiel)', value: 'Season 1', color: '#00e4b5', icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`tab-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === 'active' && (
              <span style={{ marginLeft: 6, background: 'rgba(34,197,94,0.2)', color: '#4ade80', borderRadius: 8, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>
                {activeCount}
              </span>
            )}
            {f.id === 'urgent' && urgentCount > 0 && (
              <span style={{ marginLeft: 6, background: 'rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>
                {urgentCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Airdrop cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(item => (
          <AirdropCard
            key={item.protocol.id}
            item={item}
            expanded={expanded === item.protocol.id}
            onToggle={() => setExpanded(expanded === item.protocol.id ? null : item.protocol.id)}
          />
        ))}
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="card" style={{
        marginTop: 28, background: 'rgba(245,158,11,0.05)',
        borderColor: 'rgba(245,158,11,0.2)',
      }}>
        <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>⚠️ Avertissement</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Les airdrops ne sont pas garantis. Les tokens peuvent être soumis à des conditions d'éligibilité spécifiques et des périodes de vesting.
          Les informations sont indicatives et peuvent changer sans préavis. Ce n'est pas un conseil financier — faites toujours vos propres recherches (DYOR).
          Vérifiez toujours les informations directement sur les sites officiels des protocoles avant d'investir.
        </div>
      </div>
    </div>
  )
}
