import { useState } from 'react'
import { Search } from 'lucide-react'
import AssetTabs from '../components/market/AssetTabs'
import MarketTable from '../components/market/MarketTable'
import { filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { useAuth } from '../contexts/AuthContext'
import { formatBalance } from '../utils/format'
import { AssetType } from '../types'

export default function TradePage() {
  const { user } = useAuth()
  const [type, setType] = useState<AssetType>('crypto')
  const [query, setQuery] = useState('')
  const { assets, loading } = useMarketAssets(type)
  const displayed = filterAssets(assets, 'Hot', query)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500">Available Balance</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          {formatBalance(user?.balance ?? 0)} USDT
        </p>
      </div>

      <AssetTabs active={type} onChange={setType} />

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
        <MarketTable assets={displayed} type={type} />
      )}
    </div>
  )
}
