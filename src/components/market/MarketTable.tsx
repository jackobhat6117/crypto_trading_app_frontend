import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { formatChange, formatPrice } from '../../utils/format'
import { AssetType, MarketAsset } from '../../types'
import clsx from 'clsx'

interface MarketTableProps {
  assets: MarketAsset[]
  type: AssetType
  showRank?: boolean
  onSelect?: (asset: MarketAsset) => void
  /** Number of leading rows treated as the Popular group. */
  popularCount?: number
}

function displayPrice(asset: MarketAsset, type: AssetType) {
  const decimals = asset.price < 0.01 ? 6 : asset.price < 1 ? 4 : 2
  const formatted = formatPrice(asset.price, decimals)
  if (type === 'forex') return formatted
  return `$${formatted}`
}

function AssetRow({
  asset,
  type,
  popular,
  lastPopular,
  onClick,
}: {
  asset: MarketAsset
  type: AssetType
  popular: boolean
  lastPopular: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'grid cursor-pointer grid-cols-4 gap-2 p-3 transition hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 sm:gap-4 sm:p-4',
        popular && 'bg-indigo-50 dark:bg-indigo-900/20',
        lastPopular && 'mb-2 border-b-2 border-indigo-200 dark:border-indigo-800'
      )}
    >
      <div className="col-span-2 flex min-w-0 items-center">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold sm:text-sm">{asset.name}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</div>
        </div>
      </div>
      <div className="flex flex-col justify-center text-right">
        <div className="text-xs font-semibold sm:text-sm">{displayPrice(asset, type)}</div>
      </div>
      <div className="flex flex-col justify-center text-right">
        <span className={clsx('text-xs sm:text-sm', asset.change24h >= 0 ? 'text-green-500' : 'text-red-500')}>
          {formatChange(asset.change24h)}
        </span>
      </div>
    </div>
  )
}

function AssetCard({
  asset,
  type,
  popular,
  onClick,
}: {
  asset: MarketAsset
  type: AssetType
  popular: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full cursor-pointer rounded-lg border bg-white p-3 text-left transition active:scale-[0.98] dark:bg-gray-800',
        popular
          ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{asset.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</div>
        </div>
        <div className="ml-2 flex flex-shrink-0 flex-col items-end space-y-1">
          <div className="text-sm font-semibold">{displayPrice(asset, type)}</div>
          <span className={clsx('text-xs', asset.change24h >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatChange(asset.change24h)}
          </span>
        </div>
      </div>
    </button>
  )
}

function PopularLabel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Popular</span>
      </div>
    </div>
  )
}

export default function MarketTable({
  assets,
  type,
  onSelect,
  popularCount = 0,
}: MarketTableProps) {
  const navigate = useNavigate()

  const handleClick = (asset: MarketAsset) => {
    if (onSelect) {
      onSelect(asset)
      return
    }
    navigate(`/trade/${type}/${asset.symbol}`)
  }

  if (assets.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-gray-500">No data available</div>
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
        <div className="grid grid-cols-4 gap-4 border-b border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 sm:p-4 sm:text-sm">
          <div className="col-span-2">Name</div>
          <div className="text-right">Price</div>
          <div className="text-right">24h Change</div>
        </div>
        <div className="max-h-[calc(100vh-300px)] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
          {assets.map((asset, index) => (
            <div key={`${asset.symbol}-${index}`}>
              {popularCount > 0 && index === 0 && (
                <PopularLabel className="border-b border-indigo-200 bg-indigo-50 px-4 py-2 dark:border-indigo-800 dark:bg-indigo-900/20" />
              )}
              <AssetRow
                asset={asset}
                type={type}
                popular={index < popularCount}
                lastPopular={popularCount > 0 && index === popularCount - 1}
                onClick={() => handleClick(asset)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 sm:hidden">
        {popularCount > 0 && (
          <PopularLabel className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-800 dark:bg-indigo-900/20" />
        )}
        {assets.map((asset, index) => (
          <AssetCard
            key={`${asset.symbol}-${index}`}
            asset={asset}
            type={type}
            popular={index < popularCount}
            onClick={() => handleClick(asset)}
          />
        ))}
      </div>
    </>
  )
}
