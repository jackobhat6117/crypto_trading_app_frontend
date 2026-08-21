import api from './api'
import { Coin, Metal, SiteSettings } from '../types'
import { FALLBACK_COINS, mergeCoinCatalog } from '../data/placeholderCoins'

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
    image: raw.image ? String(raw.image) : undefined,
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
      if (catalog.length > 0) return mergeCoinCatalog(catalog)
      const hosted = marketResult.status === 'fulfilled' ? marketResult.value : []
      if (hosted.length > 0) return hosted
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

export const metalService = {
  async getMetals(): Promise<Metal[]> {
    try {
      const response = await api.get('/api/metals')
      const list = response.data.metals || response.data.data || []
      if (Array.isArray(list) && list.length > 0) return list
    } catch {
      // Fall through to placeholders.
    }
    return [
      { symbol: 'XAU', name: 'Gold', price: 4574.11, change24h: 2.46, unit: 'oz' },
      { symbol: 'XAG', name: 'Silver', price: 24.18, change24h: 0.4, unit: 'oz' },
      { symbol: 'XPT', name: 'Platinum', price: 913.7, change24h: 0.2, unit: 'oz' },
      { symbol: 'XPD', name: 'Palladium', price: 1042.5, change24h: -0.3, unit: 'oz' },
    ]
  },
}

export const settingsService = {
  async getPublicSettings(): Promise<SiteSettings> {
    const response = await api.get('/api/settings/public')
    return response.data.settings
  },
}
