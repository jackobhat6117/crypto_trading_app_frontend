import { StockItem } from '../types'

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc',
  MSFT: 'Microsoft',
  GOOGL: 'Google',
  AMZN: 'Amazon',
  TSLA: 'Tesla',
  META: 'Meta',
  NVDA: 'NVIDIA',
  NFLX: 'Netflix',
  AMD: 'AMD',
  INTC: 'Intel',
}

const BASE_PRICES: Record<string, number> = {
  AAPL: 174.83,
  MSFT: 382.76,
  GOOGL: 142.75,
  AMZN: 149.81,
  TSLA: 248.25,
  META: 490.04,
  NVDA: 495.24,
  NFLX: 483.51,
  AMD: 147.09,
  INTC: 44.77,
}

const STORAGE_KEY = 'stock_previous_prices'

function getPreviousPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePreviousPrices(prices: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prices))
}

export async function fetchStocks(
  symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
): Promise<StockItem[]> {
  const previous = getPreviousPrices()
  const next: Record<string, number> = {}
  const items: StockItem[] = symbols.map((symbol) => {
    const base = BASE_PRICES[symbol] || 100
    const drift = (Math.random() * 0.04 - 0.02) * base
    const price = base + drift
    const prev = previous[symbol] || price
    const change24h = prev ? ((price - prev) / prev) * 100 : 0
    next[symbol] = price
    return {
      name: STOCK_NAMES[symbol] || symbol,
      symbol,
      price: parseFloat(price.toFixed(2)),
      change24h: parseFloat(change24h.toFixed(2)),
    }
  })
  savePreviousPrices(next)
  return items
}
