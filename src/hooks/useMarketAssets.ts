import { useEffect, useState } from 'react'
import { coinService, metalService } from '../services/marketDataService'
import { fetchStocks } from '../services/stockService'
import { fetchForex } from '../services/forexService'
import { AssetType, MarketAsset } from '../types'

export function useMarketAssets(type: AssetType) {
  const [assets, setAssets] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async (isRefresh = false) => {
      if (!isRefresh) setLoading(true)
      try {
        let data: MarketAsset[] = []
        if (type === 'crypto') {
          const coins = await coinService.getCoins()
          data = coins
            .filter((c) => c.isActive !== false)
            .map((c) => ({
              _id: c._id,
              symbol: c.symbol,
              name: c.name,
              price: c.price,
              change24h: c.change24h,
              high24h: c.high24h,
              low24h: c.low24h,
              image: c.image,
              pair: `${c.symbol}/USDT`,
            }))
        } else if (type === 'stocks') {
          const stocks = await fetchStocks()
          data = stocks.map((s) => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            change24h: s.change24h,
            pair: `${s.symbol}/USDT`,
          }))
        } else if (type === 'forex') {
          const forex = await fetchForex()
          data = forex.map((f) => ({
            symbol: f.pair.replace('/', ''),
            name: f.pair,
            price: f.price,
            change24h: f.change24h,
            pair: `${f.pair}/USDT`,
          }))
        } else {
          const metals = await metalService.getMetals()
          data = metals.map((m) => ({
            symbol: m.symbol,
            name: m.name,
            price: m.price,
            change24h: m.change24h,
            high24h: m.high24h,
            pair: `${m.symbol}/USDT`,
          }))
        }
        if (active) setAssets(data)
      } catch (error) {
        console.error('Failed to load market assets', error)
        if (active) setAssets([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load(false)
    const interval = setInterval(() => load(true), 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [type])

  return { assets, loading }
}

export type SortKey = 'name' | 'price' | 'change'
export type SortDirection = 'asc' | 'desc'

export interface FilterOptions {
  favourites?: string[]
  sortBy?: SortKey
  sortDirection?: SortDirection
}

export function filterAssets(
  assets: MarketAsset[],
  filter: string,
  query: string,
  options: FilterOptions = {}
) {
  let filtered = [...assets]
  const q = query.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) || (a.symbol || '').toLowerCase().includes(q)
    )
  }

  if (filter === 'Favourites') {
    const favourites = options.favourites ?? []
    filtered = filtered.filter((a) => favourites.includes(a.symbol))
  }

  // An explicit sort choice overrides the ordering implied by the active filter tab.
  if (options.sortBy) {
    const direction = options.sortDirection === 'asc' ? 1 : -1
    filtered.sort((a, b) => {
      if (options.sortBy === 'name') return (a.name || '').localeCompare(b.name || '') * direction
      if (options.sortBy === 'price') return ((a.price || 0) - (b.price || 0)) * direction
      return ((a.change24h || 0) - (b.change24h || 0)) * direction
    })
    return filtered
  }

  switch (filter) {
    case 'Gainers':
      filtered.sort((a, b) => b.change24h - a.change24h)
      break
    case 'Losers':
      filtered.sort((a, b) => a.change24h - b.change24h)
      break
    case 'Alpha':
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol))
      break
    case 'New':
      filtered.reverse()
      break
    case 'Favourites':
      break
    case 'Hot':
    default:
      filtered.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      break
  }
  return filtered
}
