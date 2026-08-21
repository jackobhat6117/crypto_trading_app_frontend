import clsx from 'clsx'
import { BarChart3, CircleDollarSign, Sparkles } from 'lucide-react'
import { AssetType } from '../../types'

const tabs: { id: AssetType; label: string; icon: typeof CircleDollarSign }[] = [
  { id: 'crypto', label: 'Crypto', icon: CircleDollarSign },
  { id: 'stocks', label: 'Stocks', icon: BarChart3 },
  { id: 'forex', label: 'Forex', icon: CircleDollarSign },
  { id: 'metals', label: 'Metals', icon: Sparkles },
]

interface AssetTabsProps {
  active: AssetType
  onChange: (type: AssetType) => void
  variant?: 'pill' | 'underline'
}

export default function AssetTabs({ active, onChange, variant = 'pill' }: AssetTabsProps) {
  if (variant === 'underline') {
    return (
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'flex items-center space-x-1 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-xs font-medium transition active:scale-95 sm:space-x-2 sm:px-4 sm:py-3 sm:text-sm',
              active === id
                ? 'border-b-2 border-indigo-600 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition',
            active === id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function FilterTabs({
  active,
  onChange,
  filters = ['Hot', 'Gainers', 'Losers', 'New', 'Alpha', 'Favourites'],
  variant = 'pill',
}: {
  active: string
  onChange: (f: string) => void
  filters?: string[]
  variant?: 'pill' | 'segment' | 'chip'
}) {
  return (
    <div
      className={clsx(
        'flex overflow-x-auto scrollbar-hide',
        variant === 'pill' ? 'gap-2 pb-2' : variant === 'chip' ? 'space-x-1.5 sm:space-x-2' : 'space-x-1'
      )}
    >
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={clsx(
            'whitespace-nowrap font-medium transition',
            variant === 'pill' &&
              clsx(
                'rounded-full px-3 py-1.5 text-xs',
                active === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              ),
            variant === 'segment' &&
              clsx(
                'rounded-lg px-4 py-2 text-sm',
                active === filter
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              ),
            variant === 'chip' &&
              clsx(
                'rounded-lg px-2.5 py-1.5 text-xs active:scale-95 sm:px-3',
                active === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              )
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
