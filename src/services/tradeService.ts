import api from './api'
import { AssetType, Trade } from '../types'

function asAssetType(value: unknown): AssetType {
  if (value === 'crypto' || value === 'stocks' || value === 'forex' || value === 'metals') return value
  return 'crypto'
}

function normalizeTrade(raw: Record<string, unknown>): Trade {
  const profit = Number(raw.profit ?? 0)
  const result =
    raw.result === 'win' || raw.result === 'loss'
      ? raw.result
      : profit > 0
        ? 'win'
        : profit < 0
          ? 'loss'
          : undefined
  const side = raw.side === 'sell' || raw.direction === 'DOWN' ? 'sell' : 'buy'

  return {
    _id: String(raw._id || raw.id || ''),
    symbol: String(raw.symbol || raw.asset || ''),
    type: asAssetType(raw.type),
    side,
    orderType: raw.orderType === 'limit' ? 'limit' : 'market',
    price: Number(raw.price ?? raw.entryPrice ?? 0),
    amount: Number(raw.amount ?? raw.marginUsed ?? 0),
    leverage: raw.leverage != null ? Number(raw.leverage) : undefined,
    marginMode: raw.marginMode === 'isolated' ? 'isolated' : raw.marginMode === 'cross' ? 'cross' : undefined,
    timer: raw.timer != null ? Number(raw.timer) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    result,
    profit,
    profitPercent: raw.profitPercent != null ? Number(raw.profitPercent) : undefined,
    lossPercent: raw.lossPercent != null ? Number(raw.lossPercent) : undefined,
    marginUsed: raw.marginUsed != null ? Number(raw.marginUsed) : undefined,
    entryPrice: raw.entryPrice != null ? Number(raw.entryPrice) : undefined,
    exitPrice: raw.exitPrice != null ? Number(raw.exitPrice) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    closedAt: raw.closedAt ? String(raw.closedAt) : undefined,
  }
}

export interface PlaceTradePayload {
  symbol: string
  type: AssetType
  side: 'buy' | 'sell'
  orderType: 'limit' | 'market'
  price?: number
  amount: number
  leverage?: number
  marginMode?: 'cross' | 'isolated'
  timer?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  reduceOnly?: boolean
}

export const tradeService = {
  async placeTrade(payload: PlaceTradePayload) {
    const response = await api.post('/api/trades/place', payload)
    return response.data
  },

  async getHistory(): Promise<Trade[]> {
    const response = await api.get('/api/trades/history')
    const data = response.data
    const list = data?.trades || data?.history || data?.data || []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => normalizeTrade(item))
  },

  async getPositions(): Promise<Trade[]> {
    const response = await api.get('/api/trades/positions')
    return response.data.positions || response.data.trades || []
  },

  async getTrade(id: string): Promise<Trade> {
    const response = await api.get(`/api/trades/${id}`)
    return response.data.trade
  },

  async createTrade(payload: PlaceTradePayload | Record<string, unknown>) {
    const legacy = payload as Record<string, unknown>
    if (legacy.asset && legacy.direction) {
      return this.placeTrade({
        symbol: String(legacy.asset),
        type: 'crypto',
        side: legacy.direction === 'UP' ? 'buy' : 'sell',
        orderType: 'market',
        amount: Number(legacy.amount),
        timer: Number(legacy.duration || 60),
      })
    }
    return this.placeTrade(payload as PlaceTradePayload)
  },

  async getUserTrades() {
    return this.getHistory()
  },
}
