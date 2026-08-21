import { useCallback, useEffect, useState } from 'react'
import { AssetType } from '../types'

const STORAGE_KEY = 'marketFavourites'

type FavouriteMap = Partial<Record<AssetType, string[]>>

function read(): FavouriteMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as FavouriteMap
  } catch {
    return {}
  }
}

export function useFavourites(type: AssetType) {
  const [symbols, setSymbols] = useState<string[]>(() => read()[type] ?? [])

  useEffect(() => {
    setSymbols(read()[type] ?? [])
  }, [type])

  const toggle = useCallback(
    (symbol: string) => {
      const all = read()
      const current = all[type] ?? []
      const next = current.includes(symbol)
        ? current.filter((s) => s !== symbol)
        : [...current, symbol]
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [type]: next }))
      setSymbols(next)
    },
    [type]
  )

  const isFavourite = useCallback((symbol: string) => symbols.includes(symbol), [symbols])

  return { favourites: symbols, toggle, isFavourite }
}
