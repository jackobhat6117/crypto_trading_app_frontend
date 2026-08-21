import { ForexPair } from '../types'

/** Same pairs and public FX feed Base Trade uses on the client. */
const PAIRS: Array<{ pair: string; base: string; quote: string }> = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD' },
  { pair: 'USD/CNY', base: 'USD', quote: 'CNY' },
]

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest'
const PREVIOUS_RATES_KEY = 'forex_previous_rates'

function readPreviousRates(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PREVIOUS_RATES_KEY) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function writePreviousRates(rates: Record<string, number>) {
  try {
    localStorage.setItem(PREVIOUS_RATES_KEY, JSON.stringify(rates))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export async function fetchForex(): Promise<ForexPair[]> {
  try {
    const response = await fetch(`${EXCHANGE_API}/USD`)
    if (!response.ok) throw new Error('forex')
    const payload = (await response.json()) as { rates?: Record<string, number> }
    const rates = payload.rates
    if (!rates) return []

    const previous = readPreviousRates()
    const nextPrevious: Record<string, number> = {}

    const pairs = PAIRS.map(({ pair, base, quote }) => {
      const price = base === 'USD' ? rates[quote] || 0 : 1 / (rates[base] || 1)
      const prior = previous[pair] || price
      const change24h = prior ? ((price - prior) / prior) * 100 : 0
      nextPrevious[pair] = price
      return {
        pair,
        base,
        quote,
        price: Number(price.toFixed(4)),
        change24h: Number(change24h.toFixed(2)),
      }
    })

    writePreviousRates(nextPrevious)
    return pairs
  } catch (error) {
    console.error('Error fetching forex rates:', error)
    return []
  }
}
