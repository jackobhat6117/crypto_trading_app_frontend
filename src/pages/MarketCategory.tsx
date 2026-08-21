import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { FilterTabs } from '../components/market/AssetTabs'
import MarketTable from '../components/market/MarketTable'
import PageHeader from '../components/layout/PageHeader'
import { filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { useFavourites } from '../hooks/useFavourites'
import { AssetType } from '../types'

const TITLES: Record<AssetType, { title: string; subtitle: string }> = {
  crypto: { title: 'Crypto', subtitle: 'Cryptocurrency Markets' },
  stocks: { title: 'Stocks', subtitle: 'Global Equities' },
  forex: { title: 'Forex', subtitle: 'Currency Pairs' },
  metals: { title: 'Precious Metals', subtitle: 'Gold, Silver & More' },
}

const CATEGORY_FILTERS = ['Hot', 'Gainers', 'Losers', 'New', 'Alpha', 'Favourites']

interface MarketCategoryProps {
  type: AssetType
}

export default function MarketCategory({ type }: MarketCategoryProps) {
  const { category } = useParams<{ category?: string }>()
  const initialFilter =
    CATEGORY_FILTERS.find((f) => f.toLowerCase() === category?.toLowerCase()) ?? 'Hot'

  const [filter, setFilter] = useState(initialFilter)
  const [query, setQuery] = useState('')
  const { assets, loading } = useMarketAssets(type)
  const { toggle, isFavourite, favourites } = useFavourites(type)

  const displayed = filterAssets(assets, filter, query, { favourites })
  const { title, subtitle } = TITLES[type]

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} />

      <FilterTabs active={filter} onChange={setFilter} filters={CATEGORY_FILTERS} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${type}...`}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 dark:border-gray-800 dark:bg-gray-900"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <MarketTable
          assets={displayed}
          type={type}
          isFavourite={isFavourite}
          onToggleFavourite={toggle}
        />
      )}
    </div>
  )
}
