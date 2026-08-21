import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardAssetList from './DashboardAssetList'
import { FilterTabs } from '../market/AssetTabs'
import { AssetType, MarketAsset } from '../../types'

interface DashboardMarketCardProps {
  title?: string
  subtitle?: string
  assets: MarketAsset[]
  type: AssetType
  loading?: boolean
  viewMorePath?: string
  nameColumnLabel?: 'Name' | 'Pair'
  filter?: string
  onFilterChange?: (value: string) => void
  filters?: string[]
  header?: ReactNode
}

export default function DashboardMarketCard({
  title,
  subtitle,
  assets,
  type,
  loading = false,
  viewMorePath,
  nameColumnLabel = 'Name',
  filter,
  onFilterChange,
  filters,
  header,
}: DashboardMarketCardProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {(title || subtitle || header || (filter != null && onFilterChange && filters)) && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          {header}
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          {filter != null && onFilterChange && filters && (
            <FilterTabs
              active={filter}
              onChange={onFilterChange}
              filters={filters}
              variant="segment"
            />
          )}
        </div>
      )}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <DashboardAssetList assets={assets} type={type} nameColumnLabel={nameColumnLabel} />
        )}
        {viewMorePath && (
          <button
            onClick={() => navigate(viewMorePath)}
            className="mt-4 w-full rounded-lg py-2 text-sm font-medium text-indigo-600 transition hover:bg-gray-50 dark:text-indigo-400 dark:hover:bg-gray-700"
          >
            View More
          </button>
        )}
      </div>
    </div>
  )
}
