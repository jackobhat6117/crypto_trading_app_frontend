import clsx from 'clsx'
import { AssetType } from '../../types'

const tabs: { id: AssetType; label: string }[] = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'forex', label: 'Forex' },
  { id: 'metals', label: 'Metals' },
]

interface AssetTabsProps {
  active: AssetType
  onChange: (type: AssetType) => void
}

export default function AssetTabs({ active, onChange }: AssetTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={clsx(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            active === id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
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
}: {
  active: string
  onChange: (f: string) => void
  filters?: string[]
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={clsx(
            'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium',
            active === filter
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
