import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { FilterTabs } from '../components/market/AssetTabs'
import MarketTable from '../components/market/MarketTable'
import { filterAssets, useMarketAssets } from '../hooks/useMarketAssets'
import MarketSection from '../components/market/MarketSection'
import { useFavourites } from '../hooks/useFavourites'
import { formatBalance } from '../utils/format'

const news = [
  { title: 'Bitcoin Reaches New All-Time High Amid Institutional Adoption', source: 'CryptoNews', time: '2h ago' },
  { title: 'Ethereum 2.0 Upgrade Completes Successfully', source: 'Blockchain Daily', time: '5h ago' },
  { title: 'Major Banks Announce Crypto Trading Services', source: 'Finance Times', time: '8h ago' },
  { title: 'New DeFi Protocol Launches with $100M TVL', source: 'DeFi Times', time: '12h ago' },
  { title: 'Regulatory Clarity Improves Crypto Market Sentiment', source: 'CryptoWatch', time: '1d ago' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Hot')
  const [hidden, setHidden] = useState(false)
  const { assets, loading } = useMarketAssets('crypto')
  const { toggle, isFavourite, favourites } = useFavourites('crypto')
  const displayed = filterAssets(assets, filter, '', { favourites }).slice(0, 5)
  const balance = user?.balance ?? 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">Estimated Total Value (USDT)</p>
          <button onClick={() => setHidden(!hidden)} className="text-gray-400">
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          {hidden ? '******' : `$${formatBalance(balance)}`}
        </p>
        <button
          onClick={() => navigate('/profile/deposits')}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Add Funds
        </button>
      </div>

      <div>
        <FilterTabs
          active={filter}
          onChange={setFilter}
          filters={['Favourites', 'Hot', 'Alpha', 'New', 'Gainers', 'Losers']}
        />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <MarketTable
            assets={displayed}
            type="crypto"
            showRank={false}
            isFavourite={isFavourite}
            onToggleFavourite={toggle}
          />
        )}
        <button
          onClick={() => navigate(`/crypto/${filter.toLowerCase()}`)}
          className="mt-3 w-full text-center text-sm font-medium text-indigo-600"
        >
          View More
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-1 text-lg font-semibold">Discover</h3>
        <p className="mb-4 text-sm text-gray-500">Crypto News & Updates</p>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.title} className="border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-xs text-gray-500">
                {item.source} · {item.time}
              </p>
            </div>
          ))}
        </div>
      </div>

      <MarketSection type="stocks" title="Stocks" viewMorePath="/stocks" />
      <MarketSection type="forex" title="Forex" viewMorePath="/forex" />
      <MarketSection
        type="metals"
        title="Precious Metals"
        subtitle="Gold, Silver & More"
        viewMorePath="/metals"
      />
    </div>
  )
}
