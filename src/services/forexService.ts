import { ForexPair } from '../types'

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD'
const STORAGE_KEY = 'forex_previous_rates'

const PAIRS = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD' },
  { pair: 'USD/CNY', base: 'USD', quote: 'CNY' },
]

function getPreviousRates(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePreviousRates(rates: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
}

export async function fetchForex(): Promise<ForexPair[]> {
  try {
    const response = await fetch(EXCHANGE_API)
    const data = await response.json()
    const rates = data.rates || {}
    const previous = getPreviousRates()
    const next: Record<string, number> = {}

    const items = PAIRS.map(({ pair, base, quote }) => {
      let price = 1
      if (base === 'USD') price = rates[quote] || 1
      else if (quote === 'USD') price = 1 / (rates[base] || 1)
      else price = (rates[quote] || 1) / (rates[base] || 1)

      const prev = previous[pair] || price
      const change24h = prev ? ((price - prev) / prev) * 100 : 0
      next[pair] = price

      return {
        pair,
        base,
        quote,
        price: parseFloat(price.toFixed(4)),
        change24h: parseFloat(change24h.toFixed(2)),
      }
    })

    savePreviousRates(next)
    return items
  } catch {
    return PAIRS.map(({ pair, base, quote }) => ({
      pair,
      base,
      quote,
      price: 1,
      change24h: 0,
    }))
  }
}
