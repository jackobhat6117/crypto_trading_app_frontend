import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUp, ChevronLeft, Search } from 'lucide-react'
import AssetTabs, { FilterTabs } from '../components/market/AssetTabs'
import MarketTable from '../components/market/MarketTable'
import { SortDirection, SortKey, filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { useFavourites } from '../hooks/useFavourites'
import { AssetType } from '../types'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'change', label: 'Change' },
]

const MARKET_FILTERS = ['Hot', 'Gainers', 'Losers', 'New', 'Alpha', 'Favourites']

const POPULAR_SYMBOLS = [
  'BTC',
  'ETH',
  'BNB',
  'SOL',
  'XRP',
  'ADA',
  'DOGE',
  'DOT',
  'LINK',
  'AVAX',
  'BNSOL',
  'ETHFI',
  'WBETH',
  'WBTC',
]

export default function MarketPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialType = (location.state as { type?: AssetType })?.type || 'crypto'
  const [type, setType] = useState<AssetType>(initialType)
  const [filter, setFilter] = useState('Hot')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const { assets, loading } = useMarketAssets(type)
  const { favourites } = useFavourites(type)

  const { displayed, popularCount } = useMemo(() => {
    const filtered = filterAssets(assets, filter, query, {
      favourites,
      sortBy,
      sortDirection,
    })

    if (filter !== 'Hot' || query.trim()) {
      return { displayed: filtered, popularCount: 0 }
    }

    const popular: typeof filtered = []
    const rest: typeof filtered = []
    for (const asset of filtered) {
      if (POPULAR_SYMBOLS.includes(asset.symbol.toUpperCase())) popular.push(asset)
      else rest.push(asset)
    }
    return { displayed: [...popular, ...rest], popularCount: popular.length }
  }, [assets, filter, query, favourites, sortBy, sortDirection])

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Market</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">All Markets Overview</p>
          </div>
        </div>
      </header>

      <div className="sticky top-[73px] z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="px-2 sm:px-4">
          <AssetTabs active={type} onChange={setType} variant="underline" />
        </div>
      </div>

      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 sm:px-4 sm:py-3">
        <FilterTabs
          active={filter}
          onChange={setFilter}
          filters={MARKET_FILTERS}
          variant="chip"
        />
      </div>

      <div className="border-b border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-4">
        <div className="flex flex-col gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${type}...`}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort by"
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 sm:text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
              className="rounded-lg border border-gray-200 bg-gray-50 p-2 transition hover:bg-gray-100 active:scale-95 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <ArrowUp
                className={`h-4 w-4 sm:h-5 sm:w-5 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <MarketTable assets={displayed} type={type} popularCount={popularCount} />
        )}
      </div>
    </div>
  )
}
