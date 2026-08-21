import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { AssetType, MarketAsset } from '../../types'
import { formatChange, formatPrice } from '../../utils/format'

interface TradeAssetTableProps {
  assets: MarketAsset[]
  type: AssetType
}

function lastPrice(asset: MarketAsset, type: AssetType) {
  const decimals = asset.price < 0.01 ? 6 : asset.price < 1 ? 4 : 2
  const formatted = formatPrice(asset.price, decimals)
  if (type === 'forex') return formatted
  return formatted
}

function dollarPrice(value?: number) {
  if (value == null || Number.isNaN(value)) return '—'
  const decimals = value < 0.01 ? 6 : value < 1 ? 4 : 2
  return `$${formatPrice(value, decimals)}`
}

function pairLabel(asset: MarketAsset, type: AssetType) {
  if (asset.pair) return asset.pair
  if (type === 'forex') return asset.name
  if (type === 'stocks' || type === 'metals') return `${asset.symbol}/USD`
  return `${asset.symbol}/USDT`
}

export default function TradeAssetTable({ assets, type }: TradeAssetTableProps) {
  const navigate = useNavigate()

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
        No markets available
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 p-4 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 sm:grid">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-2 text-right">Last Price</div>
        <div className="col-span-2 text-right">24h Change</div>
        <div className="col-span-2 text-right">24h High</div>
        <div className="col-span-2 text-right">24h Low</div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {assets.map((asset, index) => (
          <button
            key={`${asset.symbol}-${index}`}
            type="button"
            onClick={() => navigate(`/trade/${type}/${asset.symbol}`)}
            className="grid w-full grid-cols-12 gap-4 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="hidden text-center sm:col-span-1 sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">{index + 1}</div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="flex items-center space-x-2">
                {asset.image ? (
                  <img src={asset.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    {asset.symbol.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-900 dark:text-white">{asset.name}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">{pairLabel(asset, type)}</div>
                </div>
              </div>
            </div>
            <div className="col-span-6 text-right sm:col-span-2">
              <div className="font-semibold text-gray-900 dark:text-white">{lastPrice(asset, type)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">Price (USDT)</div>
            </div>
            <div className="col-span-6 text-right sm:col-span-2">
              <div
                className={clsx(
                  'font-semibold',
                  asset.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatChange(asset.change24h)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">Change</div>
            </div>
            <div className="hidden text-right sm:col-span-2 sm:block">
              <div className="font-semibold text-gray-900 dark:text-white">{dollarPrice(asset.high24h)}</div>
            </div>
            <div className="hidden text-right sm:col-span-2 sm:block">
              <div className="font-semibold text-gray-900 dark:text-white">{dollarPrice(asset.low24h)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
