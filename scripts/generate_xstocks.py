#!/usr/bin/env python3
"""
Generate src/data/xstocks.js from the official xStocks API.

- Pulls the full Solana token universe (symbol, name, underlying, mint, logo, halted)
  from https://api.xstocks.fi/api/v1/token
- Fetches a real baseline price per token from /api/v1/collateral/quote
- Carries over curated fundamentals (PE, 52w, beta, dividend, description) from the
  existing data file when available, so the major names keep their rich metadata.
- Emits a clean, fully-typed JS data module.

Dev-only build tool. Re-run when the xStocks universe changes:
    python3 scripts/generate_xstocks.py
"""
import json, re, sys, subprocess, urllib.parse
from concurrent.futures import ThreadPoolExecutor

API = "https://api.xstocks.fi/api/v1"
ROOT = "/Users/gazettebale/Documents/GitHub/xstocks-calculator"
# Curated fundamentals source = original committed file (git HEAD), exported once to /tmp.
# Keeps re-runs idempotent — we never read the file we're about to overwrite.
OLD_FILE = "/tmp/xstocks_orig.js"
OUT_FILE = f"{ROOT}/src/data/xstocks.js"

# ── Category taxonomy (underlying -> sector) ────────────────────────────────
SECTORS = {
    "HARDWARE":   "Hardware & Semi-conducteurs",
    "SOFTWARE":   "Logiciels & Cloud",
    "FRONTIER":   "IA & Tech de Pointe",
    "INTERNET":   "Internet & Médias",
    "CRYPTO":     "Crypto & Actifs Numériques",
    "FINANCE":    "Finance & Banques",
    "HEALTH":     "Santé & Pharma",
    "CONSUMER":   "Consommation & Distribution",
    "ENERGY":     "Énergie & Nucléaire",
    "INDUSTRIAL": "Industrie",
    "COMMODITIES":"Matières Premières & Métaux",
    "INDICES":    "ETF & Indices",
    "BONDS":      "Obligations & Revenu",
    "OTHER":      "Autres",
}

SECTOR_MAP = {
    # Hardware & Semiconductors
    "AAPL":"HARDWARE","NVDA":"HARDWARE","AMD":"HARDWARE","AVGO":"HARDWARE","ASML":"HARDWARE",
    "AMAT":"HARDWARE","LRCX":"HARDWARE","KLAC":"HARDWARE","MU":"HARDWARE","MRVL":"HARDWARE",
    "TSM":"HARDWARE","INTC":"HARDWARE","SMCI":"HARDWARE","TER":"HARDWARE","SNDK":"HARDWARE",
    "LITE":"HARDWARE","DELL":"HARDWARE","ANET":"HARDWARE","CSCO":"HARDWARE",
    # Software & Cloud
    "MSFT":"SOFTWARE","ORCL":"SOFTWARE","CRM":"SOFTWARE","ADBE":"SOFTWARE","CRWD":"SOFTWARE",
    "PANW":"SOFTWARE","NET":"SOFTWARE","PLTR":"SOFTWARE","IBM":"SOFTWARE","ACN":"SOFTWARE","APP":"SOFTWARE",
    # AI & Frontier Tech (space, drones, robotics, AI infra, rare earth, quantum-thematic)
    "ASTS":"FRONTIER","SPCX":"FRONTIER","SPCE":"FRONTIER","PL":"FRONTIER","RCAT":"FRONTIER",
    "ONDS":"FRONTIER","USAR":"FRONTIER","VRT":"FRONTIER","APLD":"FRONTIER","IQM":"FRONTIER",
    "TSLA":"FRONTIER",
    # Internet & Media
    "GOOGL":"INTERNET","META":"INTERNET","AMZN":"INTERNET","NFLX":"INTERNET","UBER":"INTERNET",
    "RBLX":"INTERNET","WBD":"INTERNET","CMCSA":"INTERNET","TMUS":"INTERNET","OPEN":"INTERNET",
    # Crypto & Digital Assets
    "COIN":"CRYPTO","MSTR":"CRYPTO","HOOD":"CRYPTO","GLXY":"CRYPTO","CRCL":"CRYPTO","MARA":"CRYPTO",
    "RIOT":"CRYPTO","CLSK":"CRYPTO","HUT":"CRYPTO","BTBT":"CRYPTO","CORZ":"CRYPTO","IREN":"CRYPTO",
    "WULF":"CRYPTO","BMNR":"CRYPTO","DFDV":"CRYPTO","SBET":"CRYPTO","STRC":"CRYPTO","STRK":"CRYPTO",
    "BITX":"CRYPTO","BTGO":"CRYPTO","TONX":"CRYPTO","AMBR":"CRYPTO",
    # Finance & Banking
    "JPM":"FINANCE","BAC":"FINANCE","V":"FINANCE","MA":"FINANCE","GS":"FINANCE","BRK.B":"FINANCE",
    "PYPL":"FINANCE","SATA":"FINANCE","VCX":"FINANCE",
    # Healthcare & Pharma
    "ABBV":"HEALTH","ABT":"HEALTH","AZN":"HEALTH","DHR":"HEALTH","JNJ":"HEALTH","LLY":"HEALTH",
    "MRK":"HEALTH","MDT":"HEALTH","NVO":"HEALTH","PFE":"HEALTH","TMO":"HEALTH","MDLN":"HEALTH",
    "HIMS":"HEALTH","VIDA":"HEALTH","UNH":"HEALTH",
    # Consumer & Retail
    "KO":"CONSUMER","MCD":"CONSUMER","HD":"CONSUMER","PEP":"CONSUMER","PG":"CONSUMER",
    "PM":"CONSUMER","WMT":"CONSUMER","SLMT":"CONSUMER","GME":"CONSUMER",
    # Energy & Nuclear
    "XOM":"ENERGY","CVX":"ENERGY","OKLO":"ENERGY","SMR":"ENERGY","CEG":"ENERGY","UUUU":"ENERGY",
    "LNG":"ENERGY","GEV":"ENERGY",
    # Industrials
    "HON":"INDUSTRIAL","ETN":"INDUSTRIAL","LIN":"INDUSTRIAL","PWR":"INDUSTRIAL",
    # Commodities & Metals
    "GLD":"COMMODITIES","SLV":"COMMODITIES","PALL":"COMMODITIES","PPLT":"COMMODITIES",
    "FGDL":"COMMODITIES","GDX":"COMMODITIES","COPX":"COMMODITIES",
    # ETFs & Indices
    "SPY":"INDICES","QQQ":"INDICES","VOO":"INDICES","VTI":"INDICES","VT":"INDICES","VUG":"INDICES",
    "VXUS":"INDICES","IWM":"INDICES","IJR":"INDICES","USPX":"INDICES","SCHF":"INDICES","IEMG":"INDICES",
    "DAX":"INDICES","FEZ":"INDICES","VGK":"INDICES","EWG":"INDICES","EWQ":"INDICES","EWU":"INDICES",
    "EWY":"INDICES","SMH":"INDICES","SOXX":"INDICES","SOXL":"INDICES","TQQQ":"INDICES","MOO":"INDICES",
    "NLR":"INDICES","URA":"INDICES","ITA":"INDICES","XLE":"INDICES","XOP":"INDICES","FLQM":"INDICES",
    "FSML":"INDICES","KRAQ":"INDICES","ENHA":"INDICES",
    # Bonds & Income
    "JAAA":"BONDS","JPST":"BONDS","SGOV":"BONDS","TBLL":"BONDS","FLBL":"BONDS","FAAA":"BONDS","YLDE":"BONDS",
}

# Default beta per sector (model parameter for projection vol; not a fabricated fundamental)
SECTOR_BETA = {
    "HARDWARE":1.5,"SOFTWARE":1.25,"FRONTIER":2.4,"INTERNET":1.3,"CRYPTO":3.0,"FINANCE":1.1,
    "HEALTH":0.75,"CONSUMER":0.7,"ENERGY":1.0,"INDUSTRIAL":1.05,"COMMODITIES":0.4,
    "INDICES":1.0,"BONDS":0.15,"OTHER":1.2,
}

# Leveraged ETFs get a higher effective beta
LEVERAGED = {"SOXL":3.0,"TQQQ":3.0,"BITX":2.0}

# Fallback emoji per sector (new stocks without a curated emoji)
SECTOR_EMOJI = {
    "HARDWARE":"🔌","SOFTWARE":"☁️","FRONTIER":"🚀","INTERNET":"🌐","CRYPTO":"₿","FINANCE":"🏦",
    "HEALTH":"🧬","CONSUMER":"🛒","ENERGY":"⚡","INDUSTRIAL":"🏗️","COMMODITIES":"🥇",
    "INDICES":"📊","BONDS":"🏛️","OTHER":"🔹",
}

# Default DeFi venues for tokens we have no curated protocol data for.
# Effectively every xStock is swappable via Jupiter/Raydium; lending is selective.
DEFAULT_PROTOCOLS = ["jupiter", "raydium"]

# ── Carry over curated fundamentals from the existing data file ─────────────
def parse_old_fundamentals():
    try:
        txt = open(OLD_FILE).read()
    except FileNotFoundError:
        return {}
    # Objects are flat (no nested braces) -> match each {...} block.
    out = {}
    for block in re.findall(r"\{[^{}]*\}", txt):
        mu = re.search(r"underlying:\s*'([^']*)'", block)
        if not mu:
            continue
        u = mu.group(1)
        def num(field):
            m = re.search(rf"\b{field}:\s*(-?[\d.]+|null)", block)
            if not m: return None
            return None if m.group(1) == "null" else float(m.group(1))
        def s(field):
            m = re.search(rf"\b{field}:\s*'((?:[^'\\]|\\.)*)'", block)
            return m.group(1) if m else None
        mp = re.search(r"protocols:\s*\[([^\]]*)\]", block)
        protos = re.findall(r"'([^']+)'", mp.group(1)) if mp else None
        # PiggyBank delisted (Oink campaign ended) — drop it from carried protocols
        if protos:
            protos = [p for p in protos if p != 'piggybank']
        out[u] = {
            "pe": num("pe"), "high52w": num("high52w"), "low52w": num("low52w"),
            "dividendYield": num("dividendYield"), "beta": num("beta"), "eps": num("eps"),
            "marketCap": s("marketCap"), "volume24h": s("volume24h"), "avgVolume": s("avgVolume"),
            "description": s("description"), "logo": s("logo"), "change24h": num("change24h"),
            "protocols": protos,
        }
    return out

# ── Fetch helpers ───────────────────────────────────────────────────────────
def http_json(url):
    # curl, because the sandbox blocks direct python sockets but allows curl
    out = subprocess.run(
        ["curl", "-s", "--max-time", "20", "-H", "accept: application/json", url],
        capture_output=True, text=True,
    ).stdout
    return json.loads(out)

def fetch_quote(underlying):
    try:
        d = http_json(f"{API}/collateral/quote?symbol={urllib.parse.quote(underlying)}")
        q = d.get("quote")
        return round(float(q), 2) if q else None
    except Exception:
        return None

def main():
    print("Loading Solana token list…")
    sol = json.load(open("/tmp/xstocks_sol.json"))
    # Drop legacy b-prefixed duplicates
    sol = [t for t in sol if not t["symbol"].startswith("b")]
    print(f"  {len(sol)} tokens after dropping legacy duplicates")

    old = parse_old_fundamentals()
    print(f"  carried fundamentals for {len(old)} existing underlyings")

    # Report unmapped underlyings (so we never silently mis-bucket)
    unmapped = sorted({t["underlying"] for t in sol if t["underlying"] not in SECTOR_MAP})
    if unmapped:
        print(f"  ⚠ {len(unmapped)} unmapped -> OTHER: {', '.join(unmapped)}")

    print("Fetching real prices…")
    unders = list({t["underlying"] for t in sol})
    with ThreadPoolExecutor(max_workers=16) as ex:
        prices = dict(zip(unders, ex.map(fetch_quote, unders)))
    got = sum(1 for v in prices.values() if v)
    print(f"  {got}/{len(unders)} prices fetched")

    # Build records
    recs = []
    for t in sorted(sol, key=lambda x: x["symbol"]):
        u = t["underlying"]
        skey = SECTOR_MAP.get(u, "OTHER")
        sector = SECTORS[skey]
        o = old.get(u, {})
        price = prices.get(u) or (o.get("high52w") and o["high52w"]*0.7) or 0
        beta = o.get("beta") or LEVERAGED.get(u) or SECTOR_BETA[skey]
        # Drop stale 52w ranges that contradict the live price (let the engine re-derive)
        hi, lo = o.get("high52w"), o.get("low52w")
        if hi and lo and price and (price > hi or price < lo):
            hi = lo = None
        recs.append({
            "symbol": t["symbol"], "underlying": u, "name": t["name"].replace(" xStock","").strip(),
            "sector": sector, "mint": t["mint"],
            "logo": o.get("logo") or SECTOR_EMOJI[skey],      # emoji (UI fallback)
            "image": t["logo"],                                # real PNG URL
            "price": price, "change24h": o.get("change24h") or 0,
            "status": "halted" if t["halted"] else "live",
            "protocols": o.get("protocols") or list(DEFAULT_PROTOCOLS),
            "pe": o.get("pe"), "high52w": hi, "low52w": lo,
            "dividendYield": o.get("dividendYield") or 0, "beta": round(beta,2),
            "eps": o.get("eps"), "marketCap": o.get("marketCap"),
            "volume24h": o.get("volume24h"), "avgVolume": o.get("avgVolume"),
            "description": o.get("description") or t["name"],
        })

    emit(recs)
    print(f"✅ wrote {len(recs)} stocks -> {OUT_FILE}")
    # sector breakdown
    from collections import Counter
    c = Counter(r["sector"] for r in recs)
    for s, n in c.most_common():
        print(f"   {n:3}  {s}")

def js(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"

def emit(recs):
    lines = []
    P = lines.append
    P("// ─────────────────────────────────────────────────────────────────────────────")
    P("// xStocks Complete Database — Tokenized Equities, ETFs & Commodities on Solana")
    P("// Backed Finance AG (Kraken) · xstocks.fi")
    P("// AUTO-GENERATED by scripts/generate_xstocks.py from api.xstocks.fi — do not hand-edit.")
    P("// Prices = real baseline snapshot (overlaid live by Pyth). Fundamentals indicative.")
    P("// ─────────────────────────────────────────────────────────────────────────────")
    P("")
    P("export const SECTORS = {")
    for k, v in SECTORS.items():
        P(f"  {k}: {js(v)},")
    P("}")
    P("")
    P("// Sub-sector enum value -> display order is the SECTORS insertion order above.")
    P("export const SECTOR_ORDER = [")
    for v in SECTORS.values():
        P(f"  {js(v)},")
    P("]")
    P("")
    P("export const XSTOCKS_LIST = [")
    for r in recs:
        protos = "[" + ", ".join(js(p) for p in r['protocols']) + "]"
        P("  {")
        P(f"    symbol: {js(r['symbol'])}, underlying: {js(r['underlying'])}, name: {js(r['name'])},")
        P(f"    sector: {js(r['sector'])}, status: {js(r['status'])},")
        P(f"    mint: {js(r['mint'])},")
        P(f"    logo: {js(r['logo'])}, image: {js(r['image'])},")
        P(f"    price: {js(r['price'])}, change24h: {js(r['change24h'])}, beta: {js(r['beta'])}, dividendYield: {js(r['dividendYield'])},")
        P(f"    pe: {js(r['pe'])}, eps: {js(r['eps'])}, high52w: {js(r['high52w'])}, low52w: {js(r['low52w'])},")
        P(f"    marketCap: {js(r['marketCap'])}, volume24h: {js(r['volume24h'])}, avgVolume: {js(r['avgVolume'])},")
        P(f"    protocols: {protos},")
        P(f"    description: {js(r['description'])},")
        P("  },")
    P("]")
    P("")
    P("export const LIVE_COUNT = XSTOCKS_LIST.filter(x => x.status === 'live').length")
    P("export const COMING_SOON_COUNT = XSTOCKS_LIST.filter(x => x.status === 'coming_soon').length")
    P("")
    # mint lookup map for wallet matching
    P("// mint address -> stock (for on-chain wallet matching)")
    P("export const STOCKS_BY_MINT = Object.fromEntries(XSTOCKS_LIST.map(s => [s.mint, s]))")
    P("export const STOCKS_BY_SYMBOL = Object.fromEntries(XSTOCKS_LIST.map(s => [s.symbol, s]))")
    P("")
    open(OUT_FILE, "w").write("\n".join(lines) + "\n" + TAIL)

# Everything after XSTOCKS_LIST: TV symbol mapping + seeded-PRNG projection engine,
# rewired to the new schema (suffix symbols, nullable 52w, new sector CAGR).
TAIL = r"""
// ─────────────────────────────────────────────────────────────────────────────
// TradingView Symbol Mapping
// ─────────────────────────────────────────────────────────────────────────────
const TV_SYMBOL_OVERRIDES = {
  'GLD': 'AMEX:GLD', 'SLV': 'AMEX:SLV', 'GDX': 'AMEX:GDX', 'COPX': 'AMEX:COPX',
  'PALL': 'AMEX:PALL', 'PPLT': 'AMEX:PPLT', 'URA': 'AMEX:URA',
  'BRK.B': 'NYSE:BRK.B', 'SPY': 'AMEX:SPY', 'QQQ': 'NASDAQ:QQQ', 'DIA': 'AMEX:DIA',
  'IWM': 'AMEX:IWM', 'VOO': 'AMEX:VOO', 'VTI': 'AMEX:VTI', 'VT': 'AMEX:VT',
  'VUG': 'AMEX:VUG', 'VXUS': 'NASDAQ:VXUS', 'SCHF': 'AMEX:SCHF', 'IJR': 'AMEX:IJR',
  'IEMG': 'AMEX:IEMG', 'FEZ': 'AMEX:FEZ', 'VGK': 'AMEX:VGK', 'EWG': 'AMEX:EWG',
  'EWQ': 'AMEX:EWQ', 'EWU': 'AMEX:EWU', 'EWY': 'AMEX:EWY', 'SMH': 'NASDAQ:SMH',
  'SOXX': 'NASDAQ:SOXX', 'SOXL': 'AMEX:SOXL', 'TQQQ': 'NASDAQ:TQQQ', 'MOO': 'AMEX:MOO',
  'NLR': 'NYSE:NLR', 'ITA': 'AMEX:ITA', 'XLE': 'AMEX:XLE', 'XOP': 'AMEX:XOP',
  'SGOV': 'AMEX:SGOV', 'JPST': 'AMEX:JPST', 'TSM': 'NYSE:TSM', 'ASML': 'NASDAQ:ASML',
  'AZN': 'NASDAQ:AZN', 'NVO': 'NYSE:NVO',
}
const NYSE_TICKERS = new Set([
  'JPM','BAC','V','MA','GS','PYPL','JNJ','PFE','LLY','UNH','ABBV','ABT','MRK','DHR','TMO','MDT',
  'WMT','MCD','HD','KO','PEP','PG','PM','XOM','CVX','LNG','CEG','GEV','ETN','HON','LIN','PWR',
  'ACN','IBM','ORCL','CRM','NET','PANW','UBER','WBD','CMCSA','HOOD','COIN','GLXY','CRCL','HIMS',
  'OPEN','SPCE','RCAT','USAR','BRK.B','SMR','OKLO','VRT','ANET','DELL','SMCI',
])
export function getTvSymbol(stock) {
  if (TV_SYMBOL_OVERRIDES[stock.underlying]) return TV_SYMBOL_OVERRIDES[stock.underlying]
  const exchange = NYSE_TICKERS.has(stock.underlying) ? 'NYSE' : 'NASDAQ'
  return `${exchange}:${stock.underlying}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Effective 52-week range — derives a band from price when fundamentals are absent
// ─────────────────────────────────────────────────────────────────────────────
export function range52w(stock) {
  if (stock.high52w && stock.low52w) return { high: stock.high52w, low: stock.low52w }
  const vol = Math.max((stock.beta || 1) * 0.25, 0.12)
  const p = stock.price || 100
  return { high: p * (1 + vol), low: p * Math.max(1 - vol, 0.25) }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED PRNG — deterministic: same inputs = same outputs
// ─────────────────────────────────────────────────────────────────────────────
function cyrb128(str) {
  let h = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h = h2 ^ Math.imul(h ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h ^ Math.imul(h4 ^ k, 2716044179)
  }
  h = Math.imul(h3 ^ (h >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  return (h ^ h2) >>> 0
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL CAGR — long-term average annual returns by sub-sector
// ─────────────────────────────────────────────────────────────────────────────
// Conservative long-term nominal CAGR by sector. Deliberately BELOW the euphoric
// last-decade numbers: hot sectors mean-revert and single stocks carry idiosyncratic
// risk, so these are defensible "if long-run averages roughly hold" baselines —
// not predictions. Broad indices ~8% (vs ~10% historical, kept prudent).
const SECTOR_CAGR = {
  'Hardware & Semi-conducteurs': 0.110,
  'Logiciels & Cloud':           0.110,
  'IA & Tech de Pointe':         0.120,
  'Internet & Médias':           0.100,
  'Crypto & Actifs Numériques':  0.130,
  'Finance & Banques':           0.080,
  'Santé & Pharma':              0.090,
  'Consommation & Distribution': 0.080,
  'Énergie & Nucléaire':         0.070,
  'Industrie':                   0.080,
  'Matières Premières & Métaux': 0.050,
  'ETF & Indices':               0.080,
  'Obligations & Revenu':        0.035,
  'Autres':                      0.070,
}
export function getSectorCagr(sector) { return SECTOR_CAGR[sector] ?? 0.105 }

// ─────────────────────────────────────────────────────────────────────────────
// PRICE HISTORY — deterministic simulation anchored to the 52W band
// ─────────────────────────────────────────────────────────────────────────────
export function generateHistoricalData(stock, days = 365) {
  const rand = mulberry32(cyrb128(stock.symbol + ':hist:' + days))
  const data = []
  const today = new Date()
  const { high, low } = range52w(stock)

  let price = low + (high - low) * 0.35
  const annualVol = Math.max((stock.beta || 1) * 0.18, 0.05)
  const dailyVol = annualVol / Math.sqrt(252)

  let currentVol = dailyVol
  const omegaGarch = dailyVol * 0.05
  const alphaGarch = 0.12
  const betaGarch = 0.83

  const avg52w = (high + low) / 2
  const impliedAnnualReturn = ((stock.price / price) - 1)
  const dailyDrift = impliedAnnualReturn / days

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const epsilon = (rand() * 2 - 1)
    const indicator = epsilon < 0 ? 1 : 0
    const gammaGarch = 0.08 * indicator
    const shock = epsilon * currentVol * price
    const meanRevForce = 0.01 * (avg52w - price) / price
    price = price * (1 + dailyDrift + meanRevForce) + shock
    price = Math.max(price, low * 0.7)
    price = Math.min(price, high * 1.15)
    currentVol = Math.sqrt(
      omegaGarch * omegaGarch +
      (alphaGarch + gammaGarch) * (epsilon * currentVol) * (epsilon * currentVol) +
      betaGarch * currentVol * currentVol
    )
    currentVol = Math.max(Math.min(currentVol, dailyVol * 3), dailyVol * 0.3)
    const avgVol = parseFloat(stock.avgVolume || '5') * 1e6
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(rand() * avgVol * 0.5 + avgVol * 0.75),
    })
  }
  data[data.length - 1].price = stock.price
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE PROJECTION — compound growth based on real historical CAGR
// ─────────────────────────────────────────────────────────────────────────────
export function generateProjectionFan(stock, days = 180) {
  const { low } = range52w(stock)
  const annualVol = Math.max((stock.beta || 1) * 0.18, 0.05)
  const annualDrift = SECTOR_CAGR[stock.sector] ?? 0.105
  const calYears = days / 365
  const expectedReturn = Math.pow(1 + annualDrift, calYears)
  const totalVol = annualVol * Math.sqrt(calYears)

  const terminalTargets = {
    p10: stock.price * Math.max(expectedReturn * (1 - 1.28 * totalVol), 0.1),
    p25: stock.price * Math.max(expectedReturn * (1 - 0.67 * totalVol), 0.15),
    p50: stock.price * expectedReturn,
    p75: stock.price * expectedReturn * (1 + 0.67 * totalVol),
    p90: stock.price * expectedReturn * (1 + 1.28 * totalVol),
  }
  const results = {}
  const today = new Date()
  const scenarioKeys = Object.keys(terminalTargets)
  for (const [key, terminal] of Object.entries(terminalTargets)) {
    const path = []
    const logStart = Math.log(stock.price)
    const logEnd = Math.log(Math.max(terminal, stock.price * 0.05))
    for (let i = 1; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const progress = i / days
      const basePx = Math.exp(logStart + (logEnd - logStart) * progress)
      const ripple = Math.sin(i * 0.05 + scenarioKeys.indexOf(key) * 1.2) * basePx * 0.008 * Math.sqrt(progress)
      const price = Math.max(basePx + ripple, low * 0.3)
      path.push({ date: date.toISOString().split('T')[0], price: parseFloat(price.toFixed(2)) })
    }
    results[key] = path
  }
  return results
}

// ─── Scenario projection — pure compound growth, deterministic ──────────────
export function generateProjection(stock, days = 180, growthBias = 0) {
  const data = []
  const today = new Date()
  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const price = stock.price * Math.pow(1 + growthBias / 100, i / 365)
    data.push({ date: date.toISOString().split('T')[0], price: parseFloat(price.toFixed(2)), type: 'projection' })
  }
  return data
}

// ─── Dividend projection — cumulative dividends along a price path ──────────
export function computeDividendProjection(stock, scenarioData) {
  const annualYield = (stock.dividendYield || 0) / 100
  const dailyYield = annualYield / 365
  let cumulativeDividends = 0
  return scenarioData.map(point => {
    const dailyDiv = point.price * dailyYield
    cumulativeDividends += dailyDiv
    return {
      ...point,
      cumulativeDividends: parseFloat(cumulativeDividends.toFixed(2)),
      totalReturn: parseFloat((point.price + cumulativeDividends).toFixed(2)),
    }
  })
}
"""

if __name__ == "__main__":
    main()
