import api from './api'
import { coinService } from './marketDataService'
import { Coin } from '../types'
import { resolveCoinIcon } from '../utils/coinIcons'

export const DEPOSIT_SYMBOLS = ['BTC', 'ETH', 'USDT'] as const

const DEPOSIT_COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether',
}

export interface DepositMethod {
  asset: string
  network: string
  address: string | null
  enabled: boolean
  isDefault?: boolean
}

export interface WalletBalance {
  asset: string
  balance: number
  locked?: number
  available?: number
  // Backend may return these field names
  lockedBalance?: number
  availableBalance?: number
}

export interface Transaction {
  id: string
  type: string
  asset: string
  amount: number
  status: string
  createdAt: string
  description?: string
}

export interface DepositRequest {
  asset: string
  amount: number
}

export interface WithdrawRequest {
  asset: string
  amount: number
  address: string
  fundPassword?: string
}

export const walletService = {
  async getBalances(): Promise<WalletBalance[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/wallet/balances')
    // Transform backend response to match expected format
    return (response.data.data || []).map((b: any) => ({
      asset: b.asset,
      balance: b.balance,
      locked: b.lockedBalance ?? b.locked ?? 0,
      available: b.availableBalance ?? b.available ?? (b.balance - (b.lockedBalance ?? b.locked ?? 0)),
      // Keep original fields for compatibility
      lockedBalance: b.lockedBalance,
      availableBalance: b.availableBalance,
    }))
  },

  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<{ success: boolean; data: Transaction[] }>('/api/wallet/transactions')
    return response.data.data
  },

  async deposit(data: DepositRequest): Promise<Transaction> {
    const response = await api.post<{ success: boolean; data: Transaction }>('/api/wallet/deposit', data)
    return response.data.data
  },

  async withdraw(data: WithdrawRequest): Promise<Transaction> {
    const response = await api.post<{ success: boolean; data: Transaction }>('/api/wallet/withdraw', data)
    return response.data.data
  },

  /** Deposit methods from admin — BTC, ETH and USDT only (no market catalog coins). */
  async getDepositConfig(): Promise<DepositMethod[]> {
    const response = await api.get<{ success: boolean; data: { methods: DepositMethod[] } }>(
      '/api/wallet/deposit-config'
    )
    return response.data.data?.methods ?? []
  },

  async getDepositCoins(): Promise<Coin[]> {
    const [methods, marketCoins] = await Promise.all([
      this.getDepositConfig(),
      coinService.getCoins().catch(() => [] as Coin[]),
    ])

    return buildFundCoins(marketCoins, methods)
  },

  /** Same BTC / ETH / USDT list for withdrawals (amount is always USDT balance). */
  async getWithdrawalCoins(): Promise<Coin[]> {
    const [methods, marketCoins] = await Promise.all([
      this.getDepositConfig().catch(() => [] as DepositMethod[]),
      coinService.getCoins().catch(() => [] as Coin[]),
    ])

    return buildFundCoins(marketCoins, methods, { requireAddress: false })
  },
}

function buildFundCoins(
  marketCoins: Coin[],
  methods: DepositMethod[],
  { requireAddress = true }: { requireAddress?: boolean } = {}
): Coin[] {
  return DEPOSIT_SYMBOLS.map((symbol, index) => {
    const method = methods.find((entry) => String(entry.asset).toUpperCase() === symbol)
    const market = marketCoins.find((entry) => entry.symbol.toUpperCase() === symbol)
    const address = method?.address?.trim() || undefined

    return {
      _id: market?._id ?? symbol.toLowerCase(),
      symbol,
      name: market?.name ?? DEPOSIT_COIN_NAMES[symbol],
      image: resolveCoinIcon(symbol, market?.image),
      price: market?.price ?? (symbol === 'USDT' ? 1 : 0),
      change24h: market?.change24h ?? 0,
      high24h: market?.high24h ?? 0,
      low24h: market?.low24h ?? 0,
      volume: market?.volume,
      marketCap: market?.marketCap,
      rank: index + 1,
      minDeposit: market?.minDeposit,
      maxDeposit: market?.maxDeposit,
      minWithdraw: market?.minWithdraw,
      maxWithdraw: market?.maxWithdraw,
      address,
      network: method?.network ?? market?.network,
      isActive: requireAddress ? Boolean(method?.enabled && address) : true,
    }
  })
}

