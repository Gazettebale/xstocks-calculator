// ─────────────────────────────────────────────────────────────────────────────
// Analyste IA — client du proxy /api/analyst (Anthropic, clé côté serveur).
// Construit le system prompt = persona + snapshot des prix live xStocks injecté
// avant chaque question, puis envoie l'historique de chat au serverless.
// ─────────────────────────────────────────────────────────────────────────────

const ENDPOINT = '/api/analyst'
export const ANALYST_MODEL = 'claude-sonnet-4-6'

export const SYSTEM_PERSONA = `Tu es un analyste macro senior — 20 ans de desk, Goldman puis hedge fund global macro. Tu parles comme sur un trading floor : brutal, direct, dense, zéro langue de bois, zéro disclaimer juridique inutile, zéro "ça dépend" creux.

Contexte produit : l'utilisateur trade des xStocks — actions américaines tokenisées sur Solana (émises par Backed Finance). Chaque token (ex : NVDAx) suit une action sous-jacente (NVDA) mais s'échange sur des DEX Solana, donc à une PRIME ou DÉCOTE vs le sous-jacent, et donne accès à des yields DeFi (Kamino, Orca, Raydium, Drift…). Tu connais cette mécanique et tu l'intègres à ton analyse.

Règles :
- Prends position. Biais clair (long / short / flat), niveaux quand c'est pertinent, catalyseurs, risk/reward.
- Exploite le CONTEXTE MARCHÉ LIVE fourni : prix sous-jacent (Pyth), prix token on-chain (Jupiter), prime/décote, variation 24h. Si une prime ou décote est anormale, signale l'edge (arbitrage, point d'entrée/sortie).
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
 * Envoie la conversation au proxy serverless et streame la réponse.
 * Le serveur renvoie du texte brut (deltas concaténés) → lecture simple.
 * @param {{ messages:Array<{role,content}>, system:string, model?:string, maxTokens?:number, onDelta?:(chunk:string)=>void, signal?:AbortSignal }} args
 * @returns {Promise<string>} le texte complet
 */
export async function streamAnalyst({ messages, system, model = ANALYST_MODEL, maxTokens = 1200, onDelta, signal }) {
  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, stream: true }),
      signal,
    })
  } catch {
    throw new Error('Réseau injoignable — /api/analyst inaccessible')
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    if (res.status === 404) {
      throw new Error("/api/analyst introuvable — lance `npm run dev` (middleware) ou déploie sur Vercel")
    }
    throw new Error(json.error || `Erreur ${res.status}`)
  }

  // Pas de stream dispo → on lit tout d'un coup (fallback).
  if (!res.body) {
    const txt = await res.text()
    if (!txt.trim()) throw new Error("Réponse vide de l'analyste")
    onDelta?.(txt)
    return txt
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) {
      full += chunk
      onDelta?.(chunk)
    }
  }
  if (!full.trim()) throw new Error("Réponse vide de l'analyste")
  return full
}
