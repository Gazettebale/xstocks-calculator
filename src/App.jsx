import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import DefiHub from './pages/DefiHub'
import Projections from './pages/Projections'
import Portfolio from './pages/Portfolio'
import { LIVE_COUNT, COMING_SOON_COUNT } from './data/xstocks'
import { SOLANA_PROTOCOLS } from './data/protocols'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',       icon: '◼',  desc: 'Vue globale' },
  { id: 'markets',     label: 'Markets',          icon: '📈', desc: `${LIVE_COUNT} xStocks live` },
  { id: 'defi',        label: 'DeFi Hub',         icon: '⚡', desc: 'DeFi Solana xStocks' },
  { id: 'projections', label: 'Projections',      icon: '🔭', desc: 'Analyse de prix' },
  { id: 'portfolio',   label: 'Portfolio & DCA',  icon: '💼', desc: 'Mes positions' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard setPage={setPage} />
      case 'markets':     return <Markets />
      case 'defi':        return <DefiHub />
      case 'projections': return <Projections />
      case 'portfolio':   return <Portfolio />
      default:            return <Dashboard setPage={setPage} />
    }
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #00c896, #00a8d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 900, color: '#05090f', letterSpacing: '-0.05em',
              flexShrink: 0, boxShadow: '0 4px 12px rgba(0,200,150,0.4)',
            }}>x</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>xStocks</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.03em' }}>DeFi Intelligence</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 8px' }}>
            Menu
          </div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.label}</div>
              </div>
              {item.id === 'markets' && (
                <span style={{
                  background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                }}>{LIVE_COUNT}</span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 4px 10px' }} />

          {/* Quick stats */}
          <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'xStocks Live', value: LIVE_COUNT, color: '#4ade80' },
              { label: 'Coming Soon', value: COMING_SOON_COUNT, color: '#fbbf24' },
              { label: 'Protocoles', value: SOLANA_PROTOCOLS.filter(p=>!p.isPointsProgram).length, color: '#00c896' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <a
            href="https://xstocks.fi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)',
              borderRadius: 8, textDecoration: 'none', color: '#00c896',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            <span>🔗</span> xstocks.fi officiel
          </a>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
            ⚠️ Not financial advice. Prices indicative only.
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
