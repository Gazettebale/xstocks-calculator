// ─────────────────────────────────────────────────────────────────────────────
// Serverless Anthropic proxy (Vercel function → /api/analyst)
// Streams chat completions from the Anthropic Messages API. The ANTHROPIC_API_KEY
// stays server-side and never ships in the browser bundle — same pattern as
// /api/rpc. Same-origin only (no CORS headers) + a model allowlist and hard caps.
// Anthropic's SSE stream is parsed server-side and re-emitted as a plain UTF-8
// text stream (just the text deltas) so the browser can read it with a simple
// reader loop — no client-side SSE parsing needed.
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MODELS = new Set(['claude-sonnet-4-6'])
const DEFAULT_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS_CAP = 1500
const MAX_MESSAGES = 40
const MAX_MSG_CHARS = 8000
const MAX_SYSTEM_CHARS = 16000

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

function sendJson(res, code, obj) {
  res.statusCode = code
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(obj))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Méthode non autorisée (POST uniquement)' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return sendJson(res, 500, { error: 'ANTHROPIC_API_KEY non configurée sur le serveur' })
  }

  const payload = await readBody(req)
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return sendJson(res, 400, { error: 'Requête invalide : messages[] requis' })
  }

  const messages = payload.messages
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m && m.role === 'assistant' ? 'assistant' : 'user',
      content: String((m && m.content) ?? '').slice(0, MAX_MSG_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0)

  if (!messages.length) return sendJson(res, 400, { error: 'Aucun message valide' })

  const model = ALLOWED_MODELS.has(payload.model) ? payload.model : DEFAULT_MODEL
  const max_tokens = Math.min(Math.max(Number(payload.max_tokens) || 1024, 256), MAX_TOKENS_CAP)
  const system =
    typeof payload.system === 'string' ? payload.system.slice(0, MAX_SYSTEM_CHARS) : undefined

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 60000)
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, system, messages, stream: true }),
      signal: ctrl.signal,
    })

    if (!upstream.ok || !upstream.body) {
      const errJson = await upstream.json().catch(() => null)
      return sendJson(res, upstream.status || 502, {
        error: errJson?.error?.message || `Anthropic ${upstream.status}`,
      })
    }

    // Begin streaming plain text to the client.
    res.statusCode = 200
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.setHeader('x-accel-buffering', 'no') // hint proxies not to buffer

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // SSE events are separated by a blank line.
      let sep
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const rawEvent = buf.slice(0, sep)
        buf = buf.slice(sep + 2)
        for (const line of rawEvent.split('\n')) {
          const trimmed = line.replace(/^\s+/, '')
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (!data || data === '[DONE]') continue
          try {
            const evt = JSON.parse(data)
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
              res.write(evt.delta.text)
            } else if (evt.type === 'error') {
              res.write(`\n[erreur upstream : ${evt.error?.message || 'inconnue'}]`)
            }
          } catch { /* partial / non-JSON keep-alive — ignore */ }
        }
      }
    }
    res.end()
  } catch (e) {
    const msg = 'Proxy analyste : ' + (e?.name === 'AbortError' ? 'timeout upstream' : String(e?.message || e))
    if (!res.headersSent) sendJson(res, 502, { error: msg })
    else { try { res.write(`\n[${msg}]`) } catch {} res.end() }
  } finally {
    clearTimeout(timer)
  }
}
