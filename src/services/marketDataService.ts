import api from './api'
import { Coin, Metal, SiteSettings } from '../types'
import { FALLBACK_COINS, mergeCoinCatalog } from '../data/placeholderCoins'
import { resolveCoinIcon } from '../utils/coinIcons'
import { getBinanceQuotes } from './binanceQuotes'

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image?: string
  current_price?: number
  price_change_percentage_24h?: number
  high_24h?: number
  low_24h?: number
  total_volume?: number
  market_cap?: number
  market_cap_rank?: number
}

function toCoin(raw: Record<string, unknown>, index = 0): Coin | null {
  const symbol = String(raw.symbol || raw.coinSymbol || '').toUpperCase()
  if (!symbol) return null
  return {
    _id: String(raw._id || raw.id || symbol.toLowerCase()),
    symbol,
    name: String(raw.name || symbol),
    image: resolveCoinIcon(symbol, raw.image ? String(raw.image) : undefined),
    price: Number(raw.price ?? 0),
    change24h: Number(raw.change24h ?? 0),
    high24h: Number(raw.high24h ?? raw.price ?? 0),
    low24h: Number(raw.low24h ?? raw.price ?? 0),
    volume: raw.volume != null ? Number(raw.volume) : undefined,
    marketCap: raw.marketCap != null ? Number(raw.marketCap) : undefined,
    rank: raw.rank != null ? Number(raw.rank) : index + 1,
    isActive: raw.isActive !== false,
    minDeposit: raw.minDeposit != null ? Number(raw.minDeposit) : undefined,
    maxDeposit: raw.maxDeposit != null ? Number(raw.maxDeposit) : undefined,
    minWithdraw: raw.minWithdraw != null ? Number(raw.minWithdraw) : undefined,
    maxWithdraw: raw.maxWithdraw != null ? Number(raw.maxWithdraw) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    network: raw.network ? String(raw.network) : undefined,
  }
}

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  ADA: 'Cardano',
  XRP: 'Ripple',
  DOGE: 'Dogecoin',
  DOT: 'Polkadot',
  MATIC: 'Polygon',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
  ATOM: 'Cosmos',
  LTC: 'Litecoin',
  NEAR: 'NEAR Protocol',
  APT: 'Aptos',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  SUI: 'Sui',
  PEPE: 'Pepe',
  SHIB: 'Shiba Inu',
  TON: 'Toncoin',
  TRX: 'TRON',
  USDT: 'Tether',
  USDC: 'USD Coin',
}

function fromMarketTicker(row: Record<string, unknown>, index: number): Coin | null {
  const asset = String(row.asset || row.symbol || row.s || '')
  const symbol = asset.replace(/USDT$/i, '').toUpperCase()
  if (!symbol) return null
  const price = Number(row.price ?? row.lastPrice ?? row.c ?? 0)
  const change = Number(row.change24h ?? row.priceChangePercent ?? row.P ?? 0)
  return {
    _id: symbol.toLowerCase(),
    symbol,
    name: COIN_NAMES[symbol] || symbol,
    price,
    change24h: change,
    high24h: Number(row.high24h ?? row.highPrice ?? row.h ?? price),
    low24h: Number(row.low24h ?? row.lowPrice ?? row.l ?? price),
    volume: row.volume24h != null ? Number(row.volume24h) : row.volume != null ? Number(row.volume) : undefined,
    rank: index + 1,
    isActive: true,
  }
}

function extractMarketList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]
  if (!payload || typeof payload !== 'object') return []
  const data = payload as Record<string, unknown>
  const nested = data.data ?? data.markets ?? data.tickers ?? data.coins ?? data.result
  if (Array.isArray(nested)) return nested as Record<string, unknown>[]
  if (nested && typeof nested === 'object' && Array.isArray((nested as Record<string, unknown>).data)) {
    return (nested as Record<string, unknown>).data as Record<string, unknown>[]
  }
  return []
}

async function fetchHostedMarket(): Promise<Coin[]> {
  const response = await api.get('/api/market')
  const list = extractMarketList(response.data)
  if (list.length === 0) return []
  return list
    .map((item, index) => fromMarketTicker(item, index))
    .filter((item): item is Coin => Boolean(item))
}

async function fetchPublicMarkets(): Promise<Coin[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
      { signal: controller.signal }
    )
    if (!response.ok) throw new Error('Public market feed unavailable')
    const rows = (await response.json()) as CoinGeckoMarket[]
    if (!Array.isArray(rows) || rows.length === 0) return []
    return rows.map((row, index) => ({
      _id: row.id || row.symbol,
      symbol: row.symbol.toUpperCase(),
      name: row.name,
      image: row.image,
      price: Number(row.current_price ?? 0),
      change24h: Number(row.price_change_percentage_24h ?? 0),
      high24h: Number(row.high_24h ?? row.current_price ?? 0),
      low24h: Number(row.low_24h ?? row.current_price ?? 0),
      volume: Number(row.total_volume ?? 0),
      marketCap: Number(row.market_cap ?? 0),
      rank: row.market_cap_rank ?? index + 1,
      isActive: true,
    }))
  } finally {
    clearTimeout(timer)
  }
}

async function fetchCoinCatalog(): Promise<Coin[]> {
  const response = await api.get('/api/coins')
  const list = extractMarketList(response.data).length
    ? extractMarketList(response.data)
    : (response.data?.coins || response.data?.data || [])
  const rows = Array.isArray(list) ? list : []
  return rows
    .map((item: Record<string, unknown>, index: number) => toCoin(item, index))
    .filter((item): item is Coin => Boolean(item))
}

export const coinService = {
  async getCoins(): Promise<Coin[]> {
    try {
      const [catalogResult, marketResult] = await Promise.allSettled([
        fetchCoinCatalog(),
        fetchHostedMarket(),
      ])
      const catalog = catalogResult.status === 'fulfilled' ? catalogResult.value : []
      const hosted = marketResult.status === 'fulfilled' ? marketResult.value : []
      const quotes = await getBinanceQuotes()
      const overlay = (coins: Coin[]) =>
        coins.map((coin) => {
          const live = quotes.get(`${coin.symbol}USDT`) || quotes.get(coin.symbol)
          if (!live) return coin
          return {
            ...coin,
            price: live.price,
            change24h: live.change24h,
            high24h: live.high24h ?? coin.high24h,
            low24h: live.low24h ?? coin.low24h,
          }
        })

      if (catalog.length > 0) return overlay(mergeCoinCatalog(catalog))
      if (hosted.length > 0) return overlay(hosted)
    } catch {
      // Fall through to public feed / static catalog.
    }

    try {
      const publicMarkets = await fetchPublicMarkets()
      if (publicMarkets.length > 0) return publicMarkets
    } catch {
      // Offline or rate-limited; use the static catalog below.
    }

    return mergeCoinCatalog(FALLBACK_COINS)
  },
}

const METAL_CATALOG: Metal[] = [
  { symbol: 'XAU', name: 'Gold', price: 4617.73, change24h: 0, unit: 'USD/oz' },
  { symbol: 'XAG', name: 'Silver', price: 69.96, change24h: 0, unit: 'USD/oz' },
  { symbol: 'XPT', name: 'Platinum', price: 1893, change24h: 0, unit: 'USD/oz' },
  { symbol: 'XPD', name: 'Palladium', price: 1370, change24h: 0, unit: 'USD/oz' },
  { symbol: 'XCU', name: 'Copper', price: 5.08, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XAL', name: 'Aluminum', price: 1.37, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XZN', name: 'Zinc', price: 1.84, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XNI', name: 'Nickel', price: 9.25, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XPB', name: 'Lead', price: 0.9233, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XTN', name: 'Tin', price: 13.78, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XIR', name: 'Iron Ore', price: 0.1398, change24h: 0, unit: 'USD/lb' },
  { symbol: 'XST', name: 'Steel', price: 0.0926, change24h: 0, unit: 'USD/lb' },
]

const LIVE_METAL_SYMBOLS = new Set(['XAU', 'XAG', 'XPT', 'XPD', 'XCU'])

function mergeMetalCatalog(incoming: Metal[]): Metal[] {
  const bySymbol = new Map(incoming.map((metal) => [metal.symbol, metal]))
  return METAL_CATALOG.map((base) => {
    const live = bySymbol.get(base.symbol)
    if (!live) return { ...base }
    return {
      ...base,
      ...live,
      unit: live.unit || base.unit,
    }
  })
}

function jitterIndustrial(metal: Metal): Metal {
  if (LIVE_METAL_SYMBOLS.has(metal.symbol) || metal.price <= 0) return metal
  const next = metal.price * (1 + (Math.random() - 0.5) * 0.0016)
  return { ...metal, price: Number(next.toFixed(metal.price < 1 ? 4 : 2)) }
}

async function fetchLiveMetalQuotes(): Promise<Map<string, Partial<Metal>>> {
  const quotes = new Map<string, Partial<Metal>>()
  const goldApi = [
    { local: 'XAG', remote: 'XAG' },
    { local: 'XPT', remote: 'XPT' },
    { local: 'XPD', remote: 'XPD' },
    { local: 'XCU', remote: 'HG' },
  ] as const

  const [binance, spots] = await Promise.allSettled([
    getBinanceQuotes(),
    Promise.allSettled(
      goldApi.map(async ({ local, remote }) => {
        const response = await fetch(`https://api.gold-api.com/price/${remote}`)
        if (!response.ok) throw new Error(remote)
        const data = (await response.json()) as { price?: number }
        return { symbol: local, price: Number(data.price) }
      })
    ),
  ])

  if (binance.status === 'fulfilled') {
    const paxg = binance.value.get('PAXGUSDT')
    if (paxg) quotes.set('XAU', paxg)
  }

  if (spots.status === 'fulfilled') {
    for (const result of spots.value) {
      if (result.status !== 'fulfilled' || !Number.isFinite(result.value.price) || result.value.price <= 0) continue
      quotes.set(result.value.symbol, { price: result.value.price })
    }
  }

  return quotes
}

export const metalService = {
  async getMetals(): Promise<Metal[]> {
    let incoming: Metal[] = []
    try {
      const response = await api.get('/api/metals', {
        params: { _t: Date.now(), _r: Math.random() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      })
      const list = response.data.metals || response.data.data || []
      if (Array.isArray(list) && list.length > 0) incoming = list
    } catch {
      // Fall through to live quotes / catalog.
    }

    let catalog = mergeMetalCatalog(incoming)
    const gold = catalog.find((metal) => metal.symbol === 'XAU')
    const needsOverlay = !gold || gold.price < 3000

    if (needsOverlay) {
      try {
        const live = await fetchLiveMetalQuotes()
        if (live.size > 0) {
          catalog = catalog.map((metal) => {
            const quote = live.get(metal.symbol)
            if (!quote) return metal
            return {
              ...metal,
              price: quote.price ?? metal.price,
              change24h: quote.change24h ?? metal.change24h,
              high24h: quote.high24h ?? metal.high24h,
              low24h: quote.low24h ?? metal.low24h,
            }
          })
        }
      } catch {
        // Keep catalog prices.
      }
    }

    return catalog.map(jitterIndustrial)
  },
}

export const settingsService = {
  async getPublicSettings(): Promise<SiteSettings> {
    const response = await api.get('/api/settings/public')
    return response.data.settings
  },
}
