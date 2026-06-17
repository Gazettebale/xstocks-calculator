// ─────────────────────────────────────────────────────────────────────────────
// Serverless Solana RPC proxy (Vercel function → /api/rpc)
// Forwards read-only JSON-RPC calls to the endpoint in SOLANA_RPC_URL (e.g. a Helius
// URL). The API key stays server-side and never ships in the browser bundle.
// Same-origin only (no CORS headers) + a method allowlist so the endpoint can't be
// abused as a free general-purpose RPC.
// ─────────────────────────────────────────────────────────────────────────────

// Only the read calls the app actually makes are permitted.
const ALLOWED_METHODS = new Set([
  'getTokenAccountsByOwner', // wallet xStock holdings
  'getMultipleAccounts',     // LP positions / pools
  'getAccountInfo',
  'getBalance',
  'getTokenAccountBalance',
  'getHealth',
])

function methodAllowed(payload) {
  const calls = Array.isArray(payload) ? payload : [payload]
  return calls.length > 0 && calls.every((c) => c && ALLOWED_METHODS.has(c.method))
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body) } catch { return null }
  }
  const chunks = []
  for await (const c of req) chunks.push(c)
  if (!chunks.length) return null
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée (POST uniquement)' })
    return
  }

  const upstream = process.env.SOLANA_RPC_URL
  if (!upstream) {
    res.status(500).json({ error: 'SOLANA_RPC_URL non configurée sur le serveur' })
    return
  }

  const payload = await readBody(req)
  if (!payload || !methodAllowed(payload)) {
    res.status(400).json({ error: 'Requête RPC invalide ou méthode non autorisée' })
    return
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const r = await fetch(upstream, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    const text = await r.text()
    res.status(r.status)
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'no-store')
    res.send(text)
  } catch (e) {
    res.status(502).json({
      error: 'Proxy RPC: ' + (e?.name === 'AbortError' ? 'timeout upstream' : String(e?.message || e)),
    })
  } finally {
    clearTimeout(timer)
  }
}
