import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import AssetTabs, { FilterTabs } from '../components/market/AssetTabs'
import MarketTable from '../components/market/MarketTable'
import PageHeader from '../components/layout/PageHeader'
import { SortDirection, SortKey, filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { useFavourites } from '../hooks/useFavourites'
import { AssetType } from '../types'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'change', label: 'Change' },
]

export default function MarketPage() {
  const location = useLocation()
  const initialType = (location.state as { type?: AssetType })?.type || 'crypto'
  const [type, setType] = useState<AssetType>(initialType)
  const [filter, setFilter] = useState('Hot')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey | ''>('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { assets, loading } = useMarketAssets(type)
  const { toggle, isFavourite, favourites } = useFavourites(type)

  const displayed = filterAssets(assets, filter, query, {
    favourites,
    sortBy: sortBy || undefined,
    sortDirection,
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Market" subtitle="All Markets Overview" />

      <AssetTabs active={type} onChange={setType} />
      <FilterTabs active={filter} onChange={setFilter} />

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

      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey | '')}
          aria-label="Sort by"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <option value="">Default order</option>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          disabled={!sortBy}
          aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
          className="rounded-xl border border-gray-200 px-4 disabled:opacity-40 dark:border-gray-800"
        >
          {sortDirection === 'asc' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <MarketTable
          assets={displayed}
          type={type}
          popularCount={!sortBy && filter === 'Hot' && !query ? 3 : 0}
          isFavourite={isFavourite}
          onToggleFavourite={toggle}
        />
      )}
    </div>
  )
}
