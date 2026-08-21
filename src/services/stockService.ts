import { StockItem } from '../types'
import api from './api'

const FALLBACK: StockItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc', price: 0, change24h: 0 },
  { symbol: 'MSFT', name: 'Microsoft', price: 0, change24h: 0 },
  { symbol: 'GOOGL', name: 'Google', price: 0, change24h: 0 },
  { symbol: 'AMZN', name: 'Amazon', price: 0, change24h: 0 },
  { symbol: 'TSLA', name: 'Tesla', price: 0, change24h: 0 },
  { symbol: 'META', name: 'Meta', price: 0, change24h: 0 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 0, change24h: 0 },
  { symbol: 'NFLX', name: 'Netflix', price: 0, change24h: 0 },
  { symbol: 'AMD', name: 'AMD', price: 0, change24h: 0 },
  { symbol: 'INTC', name: 'Intel', price: 0, change24h: 0 },
]

export async function fetchStocks(): Promise<StockItem[]> {
  try {
    const response = await api.get('/api/market/stocks')
    const list = response.data?.stocks || response.data?.data || []
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: StockItem) => ({
        symbol: item.symbol,
        name: item.name,
        price: Number(item.price) || 0,
        change24h: Number(item.change24h) || 0,
      }))
    }
  } catch {
    // Continue to a public quote feed. Binance does not list US stocks.
  }

  const rows = await Promise.allSettled(
    FALLBACK.map(async (stock) => {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stock.symbol)}?range=5d&interval=1d`
      )
      if (!response.ok) throw new Error(stock.symbol)
      const data = await response.json()
      const meta = data?.chart?.result?.[0]?.meta || {}
      const price = Number(meta.regularMarketPrice || meta.previousClose || 0)
      const previous = Number(meta.chartPreviousClose || meta.previousClose || price)
      const change24h = previous ? ((price - previous) / previous) * 100 : 0
      return {
        symbol: stock.symbol,
        name: stock.name,
        price,
        change24h: Number(change24h.toFixed(2)),
      }
    })
  )

  const live = rows
    .filter((row): row is PromiseFulfilledResult<StockItem> => row.status === 'fulfilled' && row.value.price > 0)
    .map((row) => row.value)
  return live.length > 0 ? live : FALLBACK.filter((item) => item.price > 0)
}
