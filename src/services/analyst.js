// ─────────────────────────────────────────────────────────────────────────────
// Analyste IA — BYOK (Bring Your Own Key).
// L'appel part DIRECT du navigateur vers l'API Anthropic avec la clé de
// l'utilisateur (stockée uniquement dans son localStorage). Aucune clé ne
// transite par le serveur xStocks → impossible d'utiliser le crédit d'un autre.
// header `anthropic-dangerous-direct-browser-access` = mécanisme officiel
// Anthropic pour autoriser l'appel CORS depuis un navigateur.
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
export const ANALYST_MODEL = 'claude-sonnet-4-6'
const KEY_STORAGE = 'xstocks_anthropic_key'

// ── Gestion de la clé (localStorage, navigateur uniquement) ──────────────────
export function getApiKey() {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}
export function setApiKey(k) {
  try {
    if (k) localStorage.setItem(KEY_STORAGE, k)
    else localStorage.removeItem(KEY_STORAGE)
  } catch { /* localStorage indispo — la clé restera en mémoire le temps de la session */ }
}
export function maskKey(k) {
  if (!k) return ''
  return k.length <= 10 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`
}

export const SYSTEM_PERSONA = `Tu es un analyste macro senior — 20 ans de desk, Goldman puis hedge fund global macro. Tu parles comme sur un trading floor : brutal, direct, dense, zéro langue de bois, zéro disclaimer juridique inutile, zéro "ça dépend" creux.

Contexte produit : l'utilisateur trade des xStocks — actions américaines tokenisées sur Solana (émises par Backed Finance). Chaque token (ex : NVDAx) suit une action sous-jacente (NVDA) mais s'échange sur des DEX Solana, donc à une PRIME ou DÉCOTE vs le sous-jacent, et donne accès à des yields DeFi (Kamino, Orca, Raydium, Drift…). Tu connais cette mécanique et tu l'intègres à ton analyse.

Règles :
- Prends position. Biais clair (long / short / flat), niveaux quand c'est pertinent, catalyseurs, risk/reward.
- Exploite le CONTEXTE MARCHÉ LIVE fourni : prix sous-jacent (Pyth), prix token on-chain (Jupiter), prime/décote, variation 24h. Si une prime ou décote est anormale, signale l'edge (arbitrage, point d'entrée/sortie).
- Si un bloc TON PORTEFEUILLE est fourni, PRIORISE tes conseils sur ces positions précises : taille, concentration, PnL, faut-il alléger / renforcer / couvrir / encaisser. Sois spécifique sur SES lignes, pas générique.
- Réponds en français, court et tranchant. Phrases sèches. Pas de remplissage, pas de listes interminables.
- Si la question est vague, tu réponds quand même avec ton meilleur jugement de trader.
- Tu nuances le risque mais tu tranches toujours. Tu donnes ton opinion de marché, pas un conseil réglementé.`

/**
 * Construit le bloc de contexte marché injecté dans le system prompt.
 * @param {Array<{symbol,underlying,name,underlyingPrice,tokenPrice,change24h,isLive}>} rows
 * @param {{ marketOpen?: boolean }} opts
 * @returns {string}
 */
export function buildSnapshot(rows, { marketOpen } = {}) {
  const lines = rows
    .filter((r) => r.underlyingPrice != null || r.tokenPrice != null)
    .map((r) => {
      const parts = []
      if (r.underlyingPrice != null) parts.push(`sous-jacent $${r.underlyingPrice.toFixed(2)}`)
      if (r.tokenPrice != null) parts.push(`token $${r.tokenPrice.toFixed(2)}`)
      if (r.underlyingPrice && r.tokenPrice) {
        const p = (r.tokenPrice / r.underlyingPrice - 1) * 100
        parts.push(`prime ${p >= 0 ? '+' : ''}${p.toFixed(2)}%`)
      }
      if (r.change24h != null) parts.push(`24h ${r.change24h >= 0 ? '+' : ''}${r.change24h.toFixed(2)}%`)
      return `- ${r.underlying} (${r.symbol}) : ${parts.join(' | ')}`
    })

  const ts = new Date().toLocaleString('fr-FR', { timeZone: 'America/New_York' })
  const head = `Marché US : ${marketOpen ? 'OUVERT' : 'FERMÉ'} — snapshot ${ts} (heure ET).`
  return lines.length ? `${head}\n${lines.join('\n')}` : `${head}\n(prix indisponibles pour le moment)`
}

/**
 * Bloc "TON PORTEFEUILLE" : positions réellement détenues (wallet on-chain) +
 * positions manuelles (tracker DCA), avec qty, valeur et PnL quand dispo.
 * @param {Array<{source,symbol,underlying,qty,price,value,entryPrice,pnlPct,change24h}>} rows
 * @returns {string} '' si vide
 */
export function buildPortfolioBlock(rows) {
  const valid = (rows || []).filter((r) => r.symbol && r.qty > 0)
  if (!valid.length) return ''

  const total = valid.reduce((s, r) => s + (r.value || 0), 0)
  const lines = valid.map((r) => {
    const parts = [`${r.qty.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} ${r.symbol}`]
    if (r.price != null) parts.push(`@ $${r.price.toFixed(2)}`)
    if (r.value != null) parts.push(`= $${r.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`)
    if (r.entryPrice != null) parts.push(`PRU $${Number(r.entryPrice).toFixed(2)}`)
    if (r.pnlPct != null) parts.push(`PnL ${r.pnlPct >= 0 ? '+' : ''}${r.pnlPct.toFixed(1)}%`)
    if (r.change24h != null) parts.push(`24h ${r.change24h >= 0 ? '+' : ''}${r.change24h.toFixed(2)}%`)
    return `- ${r.underlying} [${r.source}] : ${parts.join(' | ')}`
  })
  const head = `Valeur totale ≈ $${total.toLocaleString('en-US', { maximumFractionDigits: 0 })} sur ${valid.length} ligne(s).`
  return `${head}\n${lines.join('\n')}`
}

/**
 * Appel DIRECT navigateur → Anthropic, streamé. La clé est celle de l'utilisateur.
 * @param {{ messages:Array<{role,content}>, system:string, apiKey:string, model?:string, maxTokens?:number, onDelta?:(chunk:string)=>void, signal?:AbortSignal }} args
 * @returns {Promise<string>} le texte complet
 */
export async function streamAnalyst({ messages, system, apiKey, model = ANALYST_MODEL, maxTokens = 1200, onDelta, signal }) {
  if (!apiKey) throw new Error('Ajoute ta clé Anthropic pour utiliser l’analyste')

  let res
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, stream: true }),
      signal,
    })
  } catch {
    throw new Error('Réseau injoignable — appel Anthropic échoué')
  }

  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('Clé Anthropic invalide ou révoquée')
    if (res.status === 429) throw new Error('Limite de débit Anthropic atteinte — réessaie dans un instant')
    if (res.status === 400 && /credit balance/i.test(json?.error?.message || '')) {
      throw new Error('Crédit Anthropic épuisé sur cette clé')
    }
    throw new Error(json?.error?.message || `Erreur ${res.status}`)
  }

  // Parse le flux SSE Anthropic côté client, émet les deltas de texte.
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let sep
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const rawEvent = buf.slice(0, sep)
      buf = buf.slice(sep + 2)
      for (const line of rawEvent.split('\n')) {
        const t = line.replace(/^\s+/, '')
        if (!t.startsWith('data:')) continue
        const data = t.slice(5).trim()
        if (!data || data === '[DONE]') continue
        let evt
        try { evt = JSON.parse(data) } catch { continue }
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
          full += evt.delta.text
          onDelta?.(evt.delta.text)
        } else if (evt.type === 'error') {
          throw new Error(evt.error?.message || 'Erreur Anthropic')
        }
      }
    }
  }
  if (!full.trim()) throw new Error('Réponse vide de l’analyste')
  return full
}
