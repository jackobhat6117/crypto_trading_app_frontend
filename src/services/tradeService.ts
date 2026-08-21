import api from './api'
import { AssetType, Trade } from '../types'

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
    return response.data.trades || response.data.history || []
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
