export type AssetType = 'crypto' | 'stocks' | 'forex' | 'metals'

export interface User {
  _id: string
  id?: string
  email: string
  name?: string
  username?: string
  uniqueId?: string
  role?: string
  isVerified?: boolean
  balance?: number
  phone?: string
  emailVerified?: boolean
  kycStatus?: string
}

export interface Coin {
  _id: string
  symbol: string
  name: string
  image?: string
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume?: number
  marketCap?: number
  rank?: number
  isActive?: boolean
  minDeposit?: number
  maxDeposit?: number
  minWithdraw?: number
  maxWithdraw?: number
  address?: string
  network?: string
}

export interface Metal {
  name: string
  symbol: string
  price: number
  change24h: number
  high24h?: number
  low24h?: number
  unit?: string
}

export interface StockItem {
  name: string
  symbol: string
  price: number
  change24h: number
}

export interface ForexPair {
  pair: string
  base: string
  quote: string
  price: number
  change24h: number
}

export interface MarketAsset {
  _id?: string
  symbol: string
  name: string
  price: number
  change24h: number
  high24h?: number
  low24h?: number
  image?: string
  pair?: string
  unit?: string
}

export interface Trade {
  _id: string
  symbol: string
  type: AssetType
  side: 'buy' | 'sell'
  orderType: 'limit' | 'market'
  price: number
  amount: number
  leverage?: number
  marginMode?: 'cross' | 'isolated'
  timer?: number
  status?: string
  result?: 'win' | 'loss' | 'pending'
  profit?: number
  profitPercent?: number
  lossPercent?: number
  marginUsed?: number
  entryPrice?: number
  exitPrice?: number
  createdAt?: string
  closedAt?: string
  expiresAt?: string
}

export interface SiteSettings {
  site: {
    name: string
    logo?: string
    favicon?: string
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    currency: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  user?: T
  token?: string
  message?: string
}
