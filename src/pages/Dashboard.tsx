import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DashboardMarketCard from '../components/dashboard/DashboardMarketCard'
import { filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import { useFavourites } from '../hooks/useFavourites'
import { formatBalance } from '../utils/format'
import AddFundsModal from '../components/AddFundsModal'

const news = [
  { title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption', source: 'CryptoNews', time: '2h ago' },
  { title: 'Ethereum 2.0 Upgrade Completes Successfully', source: 'Blockchain Daily', time: '5h ago' },
  { title: 'Major Banks Announce Crypto Trading Services', source: 'Finance Times', time: '8h ago' },
  { title: 'New DeFi Protocol Launches with $100M TVL', source: 'DeFi Times', time: '12h ago' },
  { title: 'Regulatory Clarity Improves Crypto Market Sentiment', source: 'CryptoWatch', time: '1d ago' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('Hot')
  const [hidden, setHidden] = useState(false)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const { assets, loading } = useMarketAssets('crypto')
  const { assets: stocks, loading: stocksLoading } = useMarketAssets('stocks')
  const { assets: forex, loading: forexLoading } = useMarketAssets('forex')
  const { assets: metals, loading: metalsLoading } = useMarketAssets('metals')
  const { favourites } = useFavourites('crypto')
  const displayed = filterAssets(assets, filter, '', { favourites }).slice(0, 5)
  const balance = user?.balance ?? 0

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Total Value (USDT)</span>
          <button
            onClick={() => setHidden(!hidden)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-bold">
            {hidden ? '******' : `$${formatBalance(balance)}`}
          </span>
          <button
            onClick={() => setAddFundsOpen(true)}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Add Funds
          </button>
        </div>
      </div>

      <DashboardMarketCard
        assets={displayed}
        type="crypto"
        loading={loading}
        viewMorePath={`/crypto/${filter.toLowerCase()}`}
        filter={filter}
        onFilterChange={setFilter}
        filters={['Favourites', 'Hot', 'Alpha', 'New', 'Gainers', 'Losers']}
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-bold">Discover</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Crypto News & Updates</p>
        </div>
        <div className="space-y-3 p-4">
          {news.map((item) => (
            <div
              key={item.title}
              className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-700"
            >
              <h4 className="mb-1 text-sm font-semibold">{item.title}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DashboardMarketCard
        title="Stocks"
        assets={filterAssets(stocks, 'Hot', '').slice(0, 5)}
        type="stocks"
        loading={stocksLoading}
        viewMorePath="/stocks"
      />

      <DashboardMarketCard
        title="Forex"
        assets={filterAssets(forex, 'Hot', '').slice(0, 5)}
        type="forex"
        loading={forexLoading}
        viewMorePath="/forex"
        nameColumnLabel="Pair"
      />

      <DashboardMarketCard
        title="Precious Metals"
        subtitle="Gold, Silver & More"
        assets={filterAssets(metals, 'Hot', '').slice(0, 5)}
        type="metals"
        loading={metalsLoading}
        viewMorePath="/metals"
      />

      <AddFundsModal open={addFundsOpen} onClose={() => setAddFundsOpen(false)} />
    </div>
  )
}
