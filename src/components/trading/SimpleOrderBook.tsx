import { useMemo } from 'react'
import { formatPrice } from '../../utils/format'

interface SimpleOrderBookProps {
  symbol: string
  currentPrice: number
  compact?: boolean
}

export default function SimpleOrderBook({ symbol, currentPrice, compact = false }: SimpleOrderBookProps) {
  const { asks, bids, bidShare } = useMemo(() => {
    const base = currentPrice || 78000
    const asks = Array.from({ length: compact ? 7 : 8 }, (_, i) => ({
      price: base + (8 - i) * (base * 0.00001),
      amount: Math.random() * 2 + 0.1,
    }))
    const bids = Array.from({ length: compact ? 7 : 8 }, (_, i) => ({
      price: base - (i + 1) * (base * 0.00001),
      amount: Math.random() * 2 + 0.1,
    }))
    const bidVolume = bids.reduce((sum, row) => sum + row.amount, 0)
    const askVolume = asks.reduce((sum, row) => sum + row.amount, 0)
    return { asks, bids, bidShare: Math.round((bidVolume / (bidVolume + askVolume)) * 100) }
  }, [currentPrice, compact])

  const row = (
    entry: { price: number; amount: number },
    key: string,
    tone: 'text-red-500' | 'text-green-500'
  ) => (
    <div key={key} className="grid grid-cols-2 text-[10px] sm:grid-cols-3 sm:text-xs">
      <span className={tone}>{formatPrice(entry.price)}</span>
      <span className="text-right text-gray-500">{entry.amount.toFixed(4)}</span>
      <span className="hidden text-right text-gray-400 sm:inline">{formatPrice(entry.price * entry.amount, 0)}</span>
    </div>
  )

  return (
    <div className={compact ? 'flex h-full flex-col' : 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'}>
      {!compact && <h3 className="mb-3 font-semibold">Order Book</h3>}
      <div className="mb-1 grid grid-cols-2 text-[10px] text-gray-500 sm:grid-cols-3 sm:text-xs">
        <span>Price</span>
        <span className="text-right">Amt</span>
        <span className="hidden text-right sm:inline">Total</span>
      </div>
      <div className="space-y-0.5">{asks.map((entry, i) => row(entry, `ask-${i}`, 'text-red-500'))}</div>
      <div className="my-2 py-1.5 text-center">
        <p className="text-sm font-bold sm:text-lg">{formatPrice(currentPrice || 0)}</p>
        <p className="text-[10px] text-gray-500 sm:text-xs">{symbol}</p>
      </div>
      <div className="space-y-0.5">{bids.map((entry, i) => row(entry, `bid-${i}`, 'text-green-500'))}</div>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full sm:h-2">
        <div className="bg-green-500/60" style={{ width: `${bidShare}%` }} />
        <div className="bg-red-500/60" style={{ width: `${100 - bidShare}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>{bidShare}%</span>
        <span>{100 - bidShare}%</span>
      </div>
    </div>
  )
}
