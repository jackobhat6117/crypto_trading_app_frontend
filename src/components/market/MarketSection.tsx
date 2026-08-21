import { useNavigate } from 'react-router-dom'
import MarketTable from './MarketTable'
import { filterAssets, useMarketAssets } from '../../hooks/useMarketAssets'
import { AssetType } from '../../types'

interface MarketSectionProps {
  type: AssetType
  title: string
  subtitle?: string
  viewMorePath: string
  limit?: number
}

export default function MarketSection({
  type,
  title,
  subtitle,
  viewMorePath,
  limit = 5,
}: MarketSectionProps) {
  const navigate = useNavigate()
  const { assets, loading } = useMarketAssets(type)
  const displayed = filterAssets(assets, 'Hot', '').slice(0, limit)

  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mb-2 text-sm text-gray-500">{subtitle}</p>}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <MarketTable assets={displayed} type={type} showRank={false} />
      )}
      <button
        onClick={() => navigate(viewMorePath)}
        className="mt-3 w-full text-center text-sm font-medium text-indigo-600"
      >
        View More
      </button>
    </div>
  )
}
