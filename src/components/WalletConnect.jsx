import { useState, useEffect, useMemo } from 'react'
import useWalletStore from '../store/walletStore'
import { shortAddress, DEFAULT_RPC } from '../services/walletData'

// Read-only Solana wallet connector. Paste a public address → live xStock holdings.
// `compact` renders a slimmer bar for secondary pages (e.g. Projections).
export default function WalletConnect({ compact = false }) {
  const { address, holdings, loading, error, lastSync, rpcUrl, connect, refresh, disconnect, setRpcUrl } = useWalletStore()
  const [input, setInput] = useState(address || '')
  const [showRpc, setShowRpc] = useState(false)
  const [rpcDraft, setRpcDraft] = useState(rpcUrl || '')

  // Auto-load holdings on return if we have a saved address but no data yet
  useEffect(() => {
    if (address && holdings.length === 0 && !loading && !error) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalValue = useMemo(
    () => holdings.reduce((s, h) => s + h.qty * (h.priceUsd || h.stock?.price || 0), 0),
    [holdings]
  )

  const connected = Boolean(address) && holdings.length >= 0 && !error && address === input.trim()

  // ── Connected state ─────────────────────────────────────────────────────────
  if (address && !error) {
    return (
      <div className="card" style={{
        border: '1.5px solid rgba(0,200,150,0.35)', background: 'rgba(0,200,150,0.05)',
        padding: compact ? '10px 14px' : '14px 18px', marginBottom: compact ? 12 : 18,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>👛</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#00e4b5' }}>Wallet connecté</span>
            <code style={{ fontSize: 12, color: 'var(--text-2)', background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 5 }}>
              {shortAddress(address, 5)}
            </code>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>lecture seule</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>
            {loading ? (
              <span>Lecture on-chain…</span>
            ) : (
              <>
                <strong style={{ color: 'var(--text)' }}>{holdings.length}</strong> xStock{holdings.length > 1 ? 's' : ''} détecté{holdings.length > 1 ? 's' : ''}
                {totalValue > 0 && <> · ≈ <strong style={{ color: '#14f195' }}>${totalValue.toLocaleString('en', { maximumFractionDigits: 0 })}</strong></>}
                {lastSync && <span style={{ color: 'var(--text-3)' }}> · maj {new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={refresh} disabled={loading}>
            {loading ? '…' : '↻ Rafraîchir'}
          </button>
          <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={() => { disconnect(); setInput('') }}>
            Déconnecter
          </button>
        </div>
      </div>
    )
  }

  // ── Disconnected / input state ──────────────────────────────────────────────
  return (
    <div className="card" style={{
      border: '1.5px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)',
      padding: compact ? '12px 16px' : '16px 18px', marginBottom: compact ? 12 : 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20 }}>👛</span>
        <div style={{ fontWeight: 800, fontSize: 14 }}>Connecter un wallet</div>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          Colle ton adresse Solana — lecture seule, aucune signature, jamais ta seed phrase
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          className="input-field"
          placeholder="Adresse Solana (ex: HmMx…XFqk)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && connect(input)}
          style={{ flex: 1, minWidth: 240, fontFamily: 'monospace', fontSize: 13 }}
        />
        <button className="btn-primary" onClick={() => connect(input)} disabled={loading || !input.trim()}>
          {loading ? 'Lecture…' : 'Connecter'}
        </button>
      </div>
      {error && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: '#f87171' }}>⚠️ {error}</div>
      )}
      <div style={{ marginTop: 10, fontSize: 11.5 }}>
        <button onClick={() => setShowRpc(v => !v)} className="btn-ghost" style={{ padding: '2px 0', fontSize: 11.5, color: 'var(--text-3)' }}>
          {showRpc ? '▴' : '▾'} RPC avancé {rpcUrl ? '(personnalisé)' : '(par défaut)'}
        </button>
        {showRpc && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="input-field"
              placeholder={DEFAULT_RPC}
              value={rpcDraft}
              onChange={e => setRpcDraft(e.target.value)}
              style={{ flex: 1, minWidth: 240, fontFamily: 'monospace', fontSize: 12 }}
            />
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => setRpcUrl(rpcDraft)}>
              Enregistrer
            </button>
            <div style={{ width: '100%', fontSize: 11, color: 'var(--text-3)' }}>
              Pour plus de fiabilité, crée une clé gratuite sur Helius et colle l'URL RPC ici.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
