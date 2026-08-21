import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { formatBalance } from '../utils/format'
import { AssetType } from '../types'
import AssetTabs from '../components/market/AssetTabs'
import TradeAssetTable from '../components/trade/TradeAssetTable'

export default function TradePage() {
  const { user } = useAuth()
  const [type, setType] = useState<AssetType>('crypto')
  const [query, setQuery] = useState('')
  const { assets, loading } = useMarketAssets(type)
  const displayed = filterAssets(assets, 'Hot', query)

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">Available Balance</span>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatBalance(user?.balance ?? 0)}{' '}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">USDT</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="mb-3">
            <AssetTabs active={type} onChange={setType} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${type}...`}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <TradeAssetTable assets={displayed} type={type} />
        )}
      </div>
    </div>
  )
}
