// Fetch REAL stats (Yahoo Finance) for every xStock underlying → src/data/history.js
// One-time precompute (no runtime fetching). Run: node scripts/fetch_history.mjs
//   cagr/cagr10/vol/years : from adjusted-close history (projections)
//   beta                  : computed vs SPY from monthly returns
//   high52w/low52w/marketCap : from Yahoo quote (crumb-authenticated)
import fs from 'fs'

const ROOT = '/Users/gazettebale/Documents/GitHub/xstocks-calculator'
const SRC = `${ROOT}/src/data/xstocks.js`
const OUT = `${ROOT}/src/data/history.js`
const UA = 'Mozilla/5.0'

const text = fs.readFileSync(SRC, 'utf8')
const unders = [...new Set([...text.matchAll(/underlying:\s*'([^']+)'/g)].map(m => m[1]))]
const ysym = (s) => s.replace(/\./g, '-') // Yahoo uses '-' for class shares (BRK.B → BRK-B)

// ── Yahoo crumb + cookie (required for the quote endpoint) ───────────────────
let COOKIE = '', CRUMB = ''
async function initCrumb() {
  const r = await fetch('https://fc.yahoo.com/', { headers: { 'User-Agent': UA } })
  const sc = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : []
  COOKIE = sc.map((c) => c.split(';')[0]).join('; ')
  const cr = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, Cookie: COOKIE } })
  CRUMB = (await cr.text()).trim()
}

// ── adjusted-close monthly series ────────────────────────────────────────────
async function series(sym, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ysym(sym))}?range=${range}&interval=1mo`
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) return []
  const res = (await r.json())?.chart?.result?.[0]
  if (!res) return []
  const ts = res.timestamp || []
  const adj = res.indicators?.adjclose?.[0]?.adjclose || res.indicators?.quote?.[0]?.close || []
  const pts = []
  for (let i = 0; i < ts.length; i++) { const c = adj[i]; if (c && c > 0) pts.push({ t: ts[i], c }) }
  return pts
}

const monthlyLogReturns = (pts) => {
  const lr = []
  for (let i = 1; i < pts.length; i++) {
    const x = Math.log(pts[i].c / pts[i - 1].c)
    if (Math.abs(x) < 0.6) lr.push(x) // drop data-glitch outliers
  }
  return lr
}

let SPY_RET = []
function calcBeta(ret) {
  const n = Math.min(ret.length, SPY_RET.length)
  if (n < 12) return null
  const s = ret.slice(-n), m = SPY_RET.slice(-n)
  const ms = s.reduce((a, b) => a + b, 0) / n, mm = m.reduce((a, b) => a + b, 0) / n
  let cov = 0, vm = 0
  for (let i = 0; i < n; i++) { cov += (s[i] - ms) * (m[i] - mm); vm += (m[i] - mm) ** 2 }
  return vm > 0 ? +(cov / vm).toFixed(2) : null
}

// Returns { cagr, cagr10, vol, years, beta } or null
async function chartStats(sym) {
  const full = await series(sym, 'max')
  if (full.length < 8) return null
  const f0 = full[0], fN = full[full.length - 1]
  const years = (fN.t - f0.t) / (365.25 * 86400)
  if (years < 1.5) return null
  const cagr = Math.pow(fN.c / f0.c, 1 / years) - 1
  const rec = await series(sym, '10y')
  const ret = monthlyLogReturns(rec)
  if (ret.length < 12) return { cagr: +cagr.toFixed(4), cagr10: +cagr.toFixed(4), vol: null, years: +years.toFixed(1), beta: null, ret }
  const mean = ret.reduce((a, b) => a + b, 0) / ret.length
  const variance = ret.reduce((a, b) => a + (b - mean) ** 2, 0) / (ret.length - 1)
  const vol = Math.sqrt(variance) * Math.sqrt(12)
  const y10 = (rec[rec.length - 1].t - rec[0].t) / (365.25 * 86400)
  const cagr10 = y10 > 0 ? Math.pow(rec[rec.length - 1].c / rec[0].c, 1 / y10) - 1 : cagr
  return { cagr: +cagr.toFixed(4), cagr10: +cagr10.toFixed(4), vol: +vol.toFixed(4), years: +years.toFixed(1), beta: null, ret }
}

// ── Yahoo quote (marketCap + 52w hi/lo), batched with crumb ──────────────────
function fmtCap(n) {
  if (!n || n <= 0) return null
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return Math.round(n / 1e9) + 'B'
  if (n >= 1e6) return Math.round(n / 1e6) + 'M'
  return Math.round(n).toLocaleString()
}
async function quoteBatch(symList) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symList.map(ysym).join(',')}&crumb=${encodeURIComponent(CRUMB)}`
  const r = await fetch(url, { headers: { 'User-Agent': UA, Cookie: COOKIE } })
  if (!r.ok) return {}
  const res = (await r.json())?.quoteResponse?.result || []
  const bySym = {}
  for (const q of res) bySym[q.symbol] = { marketCap: fmtCap(q.marketCap), high52w: q.fiftyTwoWeekHigh ?? null, low52w: q.fiftyTwoWeekLow ?? null }
  // map Yahoo symbol back to the underlying we requested
  const out = {}
  for (const u of symList) { const d = bySym[ysym(u)]; if (d) out[u] = d }
  return out
}

// ── run ──────────────────────────────────────────────────────────────────────
await initCrumb()
console.log('crumb:', CRUMB ? 'ok' : 'FAILED')
const spy = await chartStats('SPY')
SPY_RET = spy?.ret || []
console.log('SPY monthly returns for beta:', SPY_RET.length)

// 1) chart stats (cagr/vol/beta) for all underlyings
const chart = {}
for (let i = 0; i < unders.length; i += 6) {
  const chunk = unders.slice(i, i + 6)
  const settled = await Promise.allSettled(chunk.map(async (s) => [s, await chartStats(s)]))
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value[1]) {
      const v = r.value[1]
      v.beta = calcBeta(v.ret)
      delete v.ret
      chart[r.value[0]] = v
    }
  }
  process.stdout.write(`\rchart ${Object.keys(chart).length}/${unders.length}…`)
  await new Promise((res) => setTimeout(res, 350))
}

// 2) quote (marketCap + 52w) for all underlyings, batched
const quotes = {}
for (let i = 0; i < unders.length; i += 50) {
  Object.assign(quotes, await quoteBatch(unders.slice(i, i + 50)))
  await new Promise((res) => setTimeout(res, 300))
}
console.log(`\nquote coverage: ${Object.keys(quotes).length}/${unders.length}`)

// 3) merge — a ticker is included if it has chart OR quote data
const out = {}
for (const u of unders) {
  const c = chart[u], q = quotes[u]
  if (!c && !q) continue
  out[u] = {
    ...(c?.vol != null ? { cagr: c.cagr, cagr10: c.cagr10, vol: c.vol, years: c.years } : c ? { cagr: c.cagr, years: c.years } : {}),
    ...(c?.beta != null ? { beta: c.beta } : {}),
    ...(q?.high52w != null ? { high52w: +q.high52w.toFixed(2), low52w: +q.low52w.toFixed(2) } : {}),
    ...(q?.marketCap ? { marketCap: q.marketCap } : {}),
  }
}

const body = `// AUTO-GENERATED by scripts/fetch_history.mjs — real stats (Yahoo Finance)
// Per underlying ticker (fields present only when available):
//   cagr/cagr10  full & last-10y annualized return  ·  vol  annualized volatility
//   years        history length  ·  beta  vs SPY (monthly returns)
//   high52w/low52w  52-week range  ·  marketCap  formatted ("4.35T")
export const HISTORY_STATS = ${JSON.stringify(out, null, 2)}
`
fs.writeFileSync(OUT, body)
const withCagr = Object.values(out).filter((v) => v.cagr != null).length
const withBeta = Object.values(out).filter((v) => v.beta != null).length
const with52 = Object.values(out).filter((v) => v.high52w != null).length
const withCap = Object.values(out).filter((v) => v.marketCap).length
console.log(`entries: ${Object.keys(out).length}/${unders.length} | cagr:${withCagr} beta:${withBeta} 52w:${with52} mktCap:${withCap}`)
console.log('AAPL:', out['AAPL'], '\nKO  :', out['KO'])
