import api from './api'

export interface LiveQuote {
  price: number
  change24h: number
  high24h?: number
  low24h?: number
}

const TTL_MS = 15_000
let cache: { at: number; bySymbol: Map<string, LiveQuote> } | null = null

function asQuote(row: Record<string, unknown>): LiveQuote | null {
  const price = Number(row.lastPrice ?? row.price ?? row.c ?? 0)
  if (!Number.isFinite(price) || price <= 0) return null
  return {
    price,
    change24h: Number(row.priceChangePercent ?? row.change24h ?? row.P ?? 0),
    high24h: Number(row.highPrice ?? row.high24h ?? row.h ?? price),
    low24h: Number(row.lowPrice ?? row.low24h ?? row.l ?? price),
  }
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]
  if (!payload || typeof payload !== 'object') return []
  const data = payload as Record<string, unknown>
  if (Array.isArray(data.data)) return data.data as Record<string, unknown>[]
  return []
}

/** One Binance 24h ticker snapshot, reused by crypto, gold, and forex. */
export async function getBinanceQuotes(): Promise<Map<string, LiveQuote>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.bySymbol

  let rows: Record<string, unknown>[] = []
  try {
    const response = await api.get('/api/market/tickers/24hr')
    rows = extractRows(response.data)
  } catch {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr')
      if (response.ok) rows = extractRows(await response.json())
    } catch {
      rows = []
    }
  }

  const bySymbol = new Map<string, LiveQuote>()
  for (const row of rows) {
    const symbol = String(row.symbol || row.s || '').toUpperCase()
    const quote = asQuote(row)
    if (!symbol || !quote) continue
    bySymbol.set(symbol, quote)
  }

  if (bySymbol.size > 0) cache = { at: Date.now(), bySymbol }
  return bySymbol.size > 0 ? bySymbol : cache?.bySymbol || bySymbol
}
