import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { formatChange, formatPrice } from '../../utils/format'
import { AssetType, MarketAsset } from '../../types'
import clsx from 'clsx'
import { resolveMediaUrl } from '../../utils/mediaUrl'

interface MarketTableProps {
  assets: MarketAsset[]
  type: AssetType
  showRank?: boolean
  onSelect?: (asset: MarketAsset) => void
  /** Renders a "Popular" divider above the first N rows. */
  popularCount?: number
  isFavourite?: (symbol: string) => boolean
  onToggleFavourite?: (symbol: string) => void
}

export default function MarketTable({
  assets,
  type,
  showRank = true,
  onSelect,
  popularCount = 0,
  isFavourite,
  onToggleFavourite,
}: MarketTableProps) {
  const navigate = useNavigate()

  const handleClick = (asset: MarketAsset) => {
    if (onSelect) {
      onSelect(asset)
      return
    }
    navigate(`/trade/${type}/${asset.symbol}`)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-12 gap-2 border-b border-gray-200 px-4 py-3 text-xs font-medium text-gray-500 dark:border-gray-800">
        {showRank && <div className="col-span-1">#</div>}
        <div className={showRank ? 'col-span-5 sm:col-span-4' : 'col-span-6 sm:col-span-4'}>Name</div>
        <div className="col-span-3 text-right">Last Price</div>
        <div className="col-span-3 text-right">24h Change</div>
      </div>
      {assets.map((asset, index) => (
        <div key={`${asset.symbol}-${index}`}>
          {popularCount > 0 && index === 0 && (
            <div className="flex items-center gap-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 dark:border-indigo-900 dark:bg-indigo-900/20">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Popular
            </div>
          )}
          {popularCount > 0 && index === popularCount && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
              All Assets
            </div>
          )}
          <div
            onClick={() => handleClick(asset)}
            className="grid cursor-pointer grid-cols-12 gap-2 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
          >
          {showRank && <div className="col-span-1 text-sm text-gray-400">{index + 1}</div>}
          <div className={showRank ? 'col-span-5 sm:col-span-4' : 'col-span-6 sm:col-span-4'}>
            <div className="flex items-center gap-2">
              {onToggleFavourite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavourite(asset.symbol)
                  }}
                  aria-label={isFavourite?.(asset.symbol) ? 'Remove from favourites' : 'Add to favourites'}
                  className="shrink-0"
                >
                  <Star
                    className={clsx(
                      'h-4 w-4',
                      isFavourite?.(asset.symbol) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    )}
                  />
                </button>
              )}
              {asset.image ? (
                <img src={resolveMediaUrl(asset.image)} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900">
                  {asset.symbol.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</p>
                <p className="text-xs text-gray-500">
                  {asset.pair || `${asset.symbol}/USDT`}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-3 text-right text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(asset.price, asset.price < 1 ? 4 : 2)}
          </div>
          <div
            className={clsx(
              'col-span-3 text-right text-sm font-medium',
              asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {formatChange(asset.change24h)}
          </div>
          </div>
        </div>
      ))}
      {assets.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-gray-500">No data available</div>
      )}
    </div>
  )
}
