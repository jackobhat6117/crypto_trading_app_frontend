import api from './api'
import { Coin, Metal, SiteSettings } from '../types'

export const coinService = {
  async getCoins(): Promise<Coin[]> {
    const response = await api.get('/api/coins')
    return response.data.coins || []
  },
}

export const metalService = {
  async getMetals(): Promise<Metal[]> {
    const response = await api.get('/api/metals')
    return response.data.metals || []
  },
}

export const settingsService = {
  async getPublicSettings(): Promise<SiteSettings> {
    const response = await api.get('/api/settings/public')
    return response.data.settings
  },
}
