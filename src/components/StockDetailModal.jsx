import { useState } from 'react'
import { getTvSymbol, range52w } from '../data/xstocks'
import { getProtocolsForStock } from '../data/protocols'
import usePortfolioStore from '../store/portfolioStore'
import TradingViewChart from './TradingViewChart'
import StockLogo from './StockLogo'

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const jupSwap = (mint) => `https://jup.ag/swap/USDC-${mint}`
const raySwap = (mint) => `https://raydium.io/swap/?inputMint=${USDC_MINT}&outputMint=${mint}`

// Copyable contract address (mint) — full bar for the modal, icon-only when compact
export function CopyCA({ mint, compact = false }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e?.stopPropagation?.()
    navigator.clipboard?.writeText(mint).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1300)
    })
  }
  if (compact) {
    return (
      <button onClick={copy} title="Copier le contract address (CA)"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 5,
          cursor: 'pointer', color: copied ? '#10b981' : 'var(--text-3)', fontSize: 11, padding: '1px 6px', lineHeight: 1.4 }}>
        {copied ? '✓' : '⧉'}
      </button>
    )
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Contract Address (mint Solana)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <code onClick={copy} title="Cliquer pour copier" style={{
          flex: 1, minWidth: 220, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{mint}</code>
        <button onClick={copy} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: copied ? '#10b981' : undefined }}>
          {copied ? '✓ Copié' : '⧉ Copier'}
        </button>
        <a href={jupSwap(mint)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>🪐 Jupiter</a>
        <a href={raySwap(mint)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>⚡ Raydium</a>
      </div>
    </div>
  )
}

// Full stock detail modal — shared by Markets and the Portfolio wallet/positions tabs
export default function StockDetailModal({ stock, liveData, onClose }) {
  const protocols = getProtocolsForStock(stock.symbol)
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolioStore()
  const inWatchlist = watchlist.includes(stock.symbol)

  const displayPrice = liveData?.price ?? stock.price
  const isLive = liveData?.isLive ?? false
  const chg = liveData?.change24h ?? (stock.change24h || null)
  const isUp = (chg ?? 0) >= 0
  const r = range52w(stock)
  const rangePos = Math.min(Math.max(((displayPrice - r.low) / (r.high - r.low)) * 100, 2), 98)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StockLogo stock={stock} size={44} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>{stock.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
                {stock.symbol} · {stock.underlying} · {stock.sector}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className={inWatchlist ? 'btn-danger' : 'btn-primary'}
              onClick={() => inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)}
              style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px', whiteSpace: 'nowrap' }}>
              {inWatchlist ? '★ Retirer Watchlist' : '☆ Ajouter Watchlist'}
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ fontSize: 18, padding: '2px 8px' }}>✕</button>
          </div>
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>
            ${displayPrice >= 1000 ? displayPrice.toLocaleString() : displayPrice.toFixed(2)}
          </div>
          {chg != null ? (
            <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>
              {isUp ? '+' : ''}{chg}% 24h
            </span>
          ) : null}
          <span className={`badge ${stock.status === 'live' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 11 }}>
            {stock.status === 'live' ? '● Live' : '◌ Bientôt'}
          </span>
          {stock.status === 'live' && (
            <span style={{ fontSize: 10.5, color: isLive ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
              {isLive ? '⚡ Pyth Live' : '◌ Indicatif'}
            </span>
          )}
        </div>

        {/* Contract address (copy + direct swap links) */}
        <CopyCA mint={stock.mint} />

        {/* TradingView Chart */}
        <div style={{ marginBottom: 18 }}>
          <TradingViewChart symbol={getTvSymbol(stock)} height={420} interval="D" showToolbar showDrawingTools />
        </div>

        {/* 52W Range */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
            <span>52W Low: ${r.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Actuel: ${displayPrice >= 1000 ? displayPrice.toLocaleString() : displayPrice.toFixed(2)}</span>
            <span>52W High: ${r.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, height: '100%', width: `${rangePos}%`, background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: `${rangePos}%`, top: -3, width: 12, height: 12, borderRadius: '50%', background: 'white', border: '2px solid var(--bg)', transform: 'translateX(-50%)', boxShadow: '0 0 0 2px rgba(255,255,255,0.3)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 6 }}>À {rangePos.toFixed(0)}% du range 52 semaines</div>
        </div>

        {/* Key Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Market Cap', value: stock.marketCap || '—' },
            { label: 'P/E Ratio', value: stock.pe ? stock.pe.toFixed(1) : 'N/A' },
            { label: 'Dividend', value: stock.dividendYield ? `${stock.dividendYield}%` : '—' },
            { label: '52W High', value: `$${r.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { label: '52W Low', value: `$${r.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { label: 'Beta', value: stock.beta },
            { label: 'Vol 24h', value: stock.volume24h ? `${stock.volume24h}` : '—' },
            { label: 'EPS', value: stock.eps ? `$${stock.eps}` : 'N/A' },
            { label: 'Protocoles', value: protocols.length },
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
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8,
                  background: p.color + '12', border: `1px solid ${p.color}25`, textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 15 }}>{p.logo}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: p.color }}>{p.name.split(' ')[0]}</span>
                  {p.airdrop?.active && p.supplyApy.max === 0
                    ? <span className="badge badge-pink" style={{ fontSize: 9, padding: '1px 5px' }}>🪂</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>↑{(p.supplyApy.max + p.rewardApy).toFixed(1)}%</span>}
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
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
