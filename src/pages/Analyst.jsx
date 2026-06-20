import { useState, useRef, useEffect, useMemo } from 'react'
import { useLivePrices, useOnchainPrices } from '../hooks/useLiveData'
import { isMarketOpen } from '../services/liveData'
import { STOCKS_BY_SYMBOL } from '../data/xstocks'
import useWalletStore from '../store/walletStore'
import usePortfolioStore from '../store/portfolioStore'
import { SYSTEM_PERSONA, buildSnapshot, buildPortfolioBlock, buildMarketLines, detectMentionedSymbols, fetchLiveForSymbols, streamAnalyst, getApiKey, setApiKey, maskKey } from '../services/analyst'

// Panier macro injecté dans le contexte de l'analyste (xStocks dispo en live).
const MACRO_BASKET = [
  'NVDAx', 'AAPLx', 'MSFTx', 'GOOGLx', 'AMZNx', 'METAx', 'TSLAx',
  'AMDx', 'AVGOx', 'SPYx', 'QQQx', 'XOMx', 'JPMx', 'GLDx', 'SLVx',
]

const SUGGESTIONS = [
  "NVDA, j'allège ou je garde ?",
  'Régime macro actuel, ta lecture ?',
  "Prime/décote xStocks : où est l'edge aujourd'hui ?",
  'Quel est le risque principal cette semaine ?',
  'Or vs tech US, comment tu te positionnes ?',
]

// Mini markdown → HTML (gras + retours ligne), entrée échappée.
function renderRich(text) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

function premiumColor(p) {
  if (p == null) return 'var(--text-3)'
  return p >= 0 ? 'var(--green)' : 'var(--red)'
}

export default function Analyst() {
  // Portefeuille : wallet on-chain (read-only) + positions manuelles (DCA).
  const walletHoldings = useWalletStore((s) => s.holdings)
  const walletAddr = useWalletStore((s) => s.address)
  const walletRefresh = useWalletStore((s) => s.refresh)
  const positions = usePortfolioStore((s) => s.positions)

  // Symboles détenus (wallet + manuel), résolus dans la data xStocks.
  const heldSymbols = useMemo(() => {
    const set = new Set()
    walletHoldings.forEach((h) => h?.stock?.symbol && set.add(h.stock.symbol))
    positions.forEach((p) => p?.symbol && STOCKS_BY_SYMBOL[p.symbol] && set.add(p.symbol))
    return [...set]
  }, [walletHoldings, positions])

  // Macro + détenus → on fetch les prix live de tout (pour valoriser le portefeuille).
  const allSymbols = useMemo(() => [...new Set([...MACRO_BASKET, ...heldSymbols])], [heldSymbols])
  const allMints = useMemo(
    () => allSymbols.map((s) => STOCKS_BY_SYMBOL[s]?.mint).filter(Boolean),
    [allSymbols]
  )

  const { prices, lastUpdate } = useLivePrices(allSymbols) // Pyth (sous-jacent)
  const onchain = useOnchainPrices(allMints)               // Jupiter (token on-chain)

  // Adresse mémorisée mais holdings pas encore chargés (non persistés) → refetch.
  useEffect(() => {
    if (walletAddr && walletHoldings.length === 0) walletRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddr])

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showCtx, setShowCtx] = useState(false)

  // ── Clé Anthropic (BYOK, localStorage navigateur) ──────────────────────────
  const [apiKey, setKeyState] = useState(getApiKey())
  const [editingKey, setEditingKey] = useState(!getApiKey())
  const [keyDraft, setKeyDraft] = useState('')

  const logRef = useRef(null)
  const taRef = useRef(null)

  const rows = useMemo(
    () =>
      MACRO_BASKET.map((sym) => {
        const meta = STOCKS_BY_SYMBOL[sym]
        const pyth = prices[sym]
        const oc = meta?.mint ? onchain[meta.mint] : null
        const underlyingPrice = pyth?.price ?? null
        const tokenPrice = oc?.priceUsd ?? null
        const premium = underlyingPrice && tokenPrice ? (tokenPrice / underlyingPrice - 1) * 100 : null
        return {
          symbol: sym,
          underlying: meta?.underlying ?? sym.replace(/x$/, ''),
          name: meta?.name ?? '',
          underlyingPrice,
          tokenPrice,
          premium,
          change24h: oc?.change24h ?? pyth?.change24h ?? null,
          isLive: pyth?.isLive ?? false,
        }
      }),
    [prices, onchain]
  )

  // Lignes du portefeuille (wallet + manuel) valorisées au prix live.
  const portfolioRows = useMemo(() => {
    const out = []
    for (const h of walletHoldings) {
      const sym = h?.stock?.symbol
      if (!sym || !(h.qty > 0)) continue
      const meta = STOCKS_BY_SYMBOL[sym]
      const oc = meta?.mint ? onchain[meta.mint] : null
      const price = oc?.priceUsd ?? prices[sym]?.price ?? h.stock?.price ?? null
      out.push({
        source: 'wallet',
        symbol: sym,
        underlying: meta?.underlying ?? sym.replace(/x$/, ''),
        qty: h.qty,
        price,
        value: price != null ? price * h.qty : null,
        change24h: oc?.change24h ?? prices[sym]?.change24h ?? null,
      })
    }
    for (const p of positions) {
      const sym = p?.symbol
      if (!sym || !(p.quantity > 0)) continue
      const meta = STOCKS_BY_SYMBOL[sym]
      const oc = meta?.mint ? onchain[meta.mint] : null
      const price = oc?.priceUsd ?? prices[sym]?.price ?? null
      out.push({
        source: 'manuel',
        symbol: sym,
        underlying: meta?.underlying ?? sym,
        qty: p.quantity,
        price,
        value: price != null ? price * p.quantity : null,
        entryPrice: p.entryPrice,
        pnlPct: price != null && p.entryPrice ? (price / p.entryPrice - 1) * 100 : null,
        change24h: oc?.change24h ?? prices[sym]?.change24h ?? null,
      })
    }
    return out
  }, [walletHoldings, positions, onchain, prices])

  const pfTotal = portfolioRows.reduce((s, r) => s + (r.value || 0), 0)

  const liveCount = rows.filter((r) => r.underlyingPrice != null || r.tokenPrice != null).length

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, busy])

  const saveKey = () => {
    const k = keyDraft.trim()
    if (!k) return
    setApiKey(k)
    setKeyState(k)
    setEditingKey(false)
    setKeyDraft('')
    setError(null)
  }
  const forgetKey = () => {
    setApiKey('')
    setKeyState('')
    setEditingKey(true)
  }

  const send = async (q) => {
    const text = (q ?? input).trim()
    if (!text || busy) return
    if (!apiKey) {
      setError('Ajoute ta clé Anthropic ci-dessus pour discuter avec l’analyste.')
      setEditingKey(true)
      return
    }
    setError(null)
    const next = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }]) // bulle remplie au fil du stream
    setInput('')
    if (taRef.current) taRef.current.style.height = '46px'
    setBusy(true)
    try {
      // JIT : marchés cités hors contexte → prix live récupérés pour cette question.
      let extraRows = []
      try {
        const already = new Set([...allSymbols, ...portfolioRows.map((r) => r.symbol)])
        const toFetch = detectMentionedSymbols(text).filter((s) => !already.has(s))
        if (toFetch.length) extraRows = await fetchLiveForSymbols(toFetch)
      } catch { /* best-effort — l'analyste garde son garde-fou anti-invention */ }

      const snapshot = buildSnapshot(rows, { marketOpen: isMarketOpen() })
      const pf = buildPortfolioBlock(portfolioRows)
      const extra = extraRows.length ? buildMarketLines(extraRows) : ''
      const system =
        `${SYSTEM_PERSONA}\n\n--- PANORAMA MACRO (live) ---\n${snapshot}` +
        (pf ? `\n\n--- TON PORTEFEUILLE (live) ---\n${pf}` : '') +
        (extra ? `\n\n--- MARCHÉS DEMANDÉS (live, récupérés pour cette question) ---\n${extra}` : '')
      let acc = ''
      await streamAnalyst({
        messages: next,
        system,
        apiKey,
        onDelta: (chunk) => {
          acc += chunk
          setMessages((m) => {
            const copy = m.slice()
            copy[copy.length - 1] = { role: 'assistant', content: acc }
            return copy
          })
        },
      })
    } catch (e) {
      setMessages((m) => {
        const copy = m.slice()
        if (copy.length && copy[copy.length - 1].role === 'assistant' && !copy[copy.length - 1].content) copy.pop()
        return copy
      })
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }
  const autoGrow = (e) => {
    setInput(e.target.value)
    e.target.style.height = '46px'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Analyste IA <span className="gradient-text">macro</span></h1>
          <p className="page-subtitle">
            Desk senior brutal et concret — il raisonne sur tes prix xStocks live (Pyth + Jupiter) + ton portefeuille, injectés à chaque question.
          </p>
        </div>
        <span className={`badge ${isMarketOpen() ? 'badge-green' : 'badge-gray'}`}>
          ● Marché US {isMarketOpen() ? 'ouvert' : 'fermé'}
        </span>
      </div>

      {/* ── Clé Anthropic (BYOK) ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16, borderColor: apiKey ? 'var(--border)' : 'rgba(245,158,11,0.4)' }}>
        {!editingKey && apiKey ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>🔑</span>
              <span style={{ fontWeight: 600 }}>Ta clé Anthropic est connectée</span>
              <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{maskKey(apiKey)}</span>
            </span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={() => { setKeyDraft(''); setEditingKey(true) }}>Modifier</button>
              <button className="btn-danger" onClick={forgetKey}>Oublier</button>
            </span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 15 }}>🔑</span>
              <span style={{ fontWeight: 600 }}>Ajoute ta clé Anthropic pour activer l’analyste</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="input"
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                placeholder="sk-ant-…"
                style={{ flex: 1, minWidth: 220, fontFamily: 'monospace' }}
                autoComplete="off"
              />
              <button className="btn-primary" onClick={saveKey} disabled={!keyDraft.trim()} style={{ opacity: keyDraft.trim() ? 1 : 0.5 }}>
                Enregistrer
              </button>
              {apiKey && (
                <button className="btn-ghost" onClick={() => { setEditingKey(false); setKeyDraft('') }}>Annuler</button>
              )}
            </div>
            <div className="dim" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
              🔒 Stockée <strong>uniquement dans ton navigateur</strong> (localStorage). L’appel va <strong>direct à Anthropic</strong> — la clé ne passe jamais par le serveur xStocks.{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                Obtenir une clé →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Contexte live injecté (repliable) */}
      <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
        <button
          onClick={() => setShowCtx((v) => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '14px 20px', font: 'inherit' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15 }}>🛰️</span>
            <span style={{ fontWeight: 600 }}>Contexte live injecté</span>
            <span className="badge badge-blue">{liveCount} macro</span>
            {portfolioRows.length > 0 && <span className="badge badge-green">{portfolioRows.length} portefeuille</span>}
            {lastUpdate && <span className="dim" style={{ fontSize: 11.5 }}>MAJ {new Date(lastUpdate).toLocaleTimeString('fr-FR')}</span>}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>{showCtx ? '▲ masquer' : '▼ voir'}</span>
        </button>
        {showCtx && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
            {portfolioRows.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span className="stat-label">Ton portefeuille</span>
                  <span className="dim" style={{ fontSize: 11.5 }}>≈ ${pfTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {portfolioRows.map((r, i) => (
                    <div key={`pf-${r.source}-${r.symbol}-${i}`} style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 8, padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{r.underlying}</span>
                        <span className="dim" style={{ fontSize: 10 }}>{r.source}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span className="muted">{r.qty.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} × ${r.price != null ? r.price.toFixed(2) : '—'}</span>
                        <span>{r.value != null ? `$${r.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}</span>
                      </div>
                      {r.pnlPct != null && (
                        <div style={{ fontSize: 10.5, color: r.pnlPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          PnL {r.pnlPct >= 0 ? '+' : ''}{r.pnlPct.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0 10px' }} />
                <span className="stat-label">Panorama macro</span>
                <div style={{ height: 8 }} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {rows.map((r) => (
                <div key={r.symbol} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{r.underlying}</span>
                    <span className="dim" style={{ fontSize: 10.5 }}>{r.symbol}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="muted">{r.tokenPrice != null ? `$${r.tokenPrice.toFixed(2)}` : r.underlyingPrice != null ? `$${r.underlyingPrice.toFixed(2)}` : '—'}</span>
                    <span style={{ color: r.change24h == null ? 'var(--text-3)' : r.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {r.change24h == null ? '—' : `${r.change24h >= 0 ? '+' : ''}${r.change24h.toFixed(2)}%`}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: premiumColor(r.premium) }}>
                    {r.premium == null ? 'prime —' : `prime ${r.premium >= 0 ? '+' : ''}${r.premium.toFixed(2)}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: 400 }}>
        <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 460, color: 'var(--text-2)' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🧠</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16, marginBottom: 6 }}>Le desk est en ligne.</div>
              <div style={{ fontSize: 13 }}>
                {apiKey
                  ? `Pose ta question. ${liveCount} actifs macro${portfolioRows.length ? ` + tes ${portfolioRows.length} positions` : ''} sont injectés avant chaque réponse.${portfolioRows.length ? '' : ' (Connecte ton wallet dans Portfolio pour qu’il voie ton expo.)'}`
                  : 'Ajoute ta clé Anthropic ci-dessus, puis pose ta question.'}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isLast = i === messages.length - 1
            if (m.role === 'user') {
              return (
                <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div style={{ background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.25)', color: 'var(--text)', padding: '10px 14px', borderRadius: '12px 12px 3px 12px', fontSize: 13.5, whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>
                </div>
              )
            }
            const streaming = busy && isLast
            return (
              <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-2)', letterSpacing: '0.06em', marginBottom: 4, textTransform: 'uppercase' }}>▸ Desk</div>
                {m.content ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: renderRich(m.content) + (streaming ? '<span class="blink">▋</span>' : '') }} />
                ) : (
                  <span className="dim" style={{ fontSize: 13 }}>analyse…</span>
                )}
              </div>
            )
          })}

          {error && (
            <div className="badge badge-red" style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 8 }}>⚠️ {error}</div>
          )}
        </div>

        {messages.length === 0 && apiKey && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 20px 12px' }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="pill-tab" onClick={() => send(s)} disabled={busy}>{s}</button>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={taRef}
            className="input"
            value={input}
            onChange={autoGrow}
            onKeyDown={onKey}
            placeholder={apiKey ? 'Pose ta question au desk…  (Entrée = envoyer · Maj+Entrée = saut de ligne)' : 'Ajoute ta clé Anthropic ci-dessus pour commencer…'}
            rows={1}
            style={{ resize: 'none', height: 46, maxHeight: 140, lineHeight: 1.5 }}
          />
          <button className="btn-primary" onClick={() => send()} disabled={busy || !input.trim()} style={{ height: 46, opacity: busy || !input.trim() ? 0.5 : 1 }}>
            {busy ? '…' : 'Envoyer'}
          </button>
        </div>
      </div>

      <div className="dim" style={{ fontSize: 10.5, marginTop: 12, textAlign: 'center' }}>
        BYOK · ta clé Anthropic reste dans ton navigateur · appel direct à Anthropic (claude-sonnet-4-6) · opinion de marché IA, pas un conseil en investissement.
      </div>
    </div>
  )
}
