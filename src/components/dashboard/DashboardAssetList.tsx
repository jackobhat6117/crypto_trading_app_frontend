import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { AssetType, MarketAsset } from '../../types'
import { formatChange, formatPrice } from '../../utils/format'

interface DashboardAssetListProps {
  assets: MarketAsset[]
  type: AssetType
  nameColumnLabel?: 'Name' | 'Pair'
}

function assetSubtitle(asset: MarketAsset, type: AssetType) {
  if (type === 'forex') return undefined
  if (type === 'metals') return `${asset.symbol} • USD/oz`
  return asset.symbol
}

function formatAssetPrice(asset: MarketAsset, type: AssetType) {
  if (type === 'forex') {
    return formatPrice(asset.price, asset.price < 10 ? 4 : 2)
  }
  return `$${formatPrice(asset.price, asset.price < 1 ? 4 : 2)}`
}

export default function DashboardAssetList({ assets, type, nameColumnLabel = 'Name' }: DashboardAssetListProps) {
  const navigate = useNavigate()

  if (assets.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-500">No data available</div>
  }

  return (
    <>
      <div className="mb-3 grid grid-cols-3 gap-4 border-b border-gray-200 pb-3 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400">
        <div>{nameColumnLabel}</div>
        <div className="text-right">Last Price</div>
        <div className="text-right">24h Change%</div>
      </div>
      <div className="space-y-3">
        {assets.map((asset) => {
          const subtitle = assetSubtitle(asset, type)
          return (
            <button
              key={asset.symbol}
              type="button"
              onClick={() => navigate(`/trade/${type}/${asset.symbol}`)}
              className="grid w-full grid-cols-3 gap-4 border-b border-gray-100 py-2 text-left last:border-0 dark:border-gray-700"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{asset.name}</div>
                {subtitle && (
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatAssetPrice(asset, type)}</div>
              </div>
              <div className="text-right">
                <span
                  className={clsx(
                    'text-xs font-medium',
                    asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {formatChange(asset.change24h)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
