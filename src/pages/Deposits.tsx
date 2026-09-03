import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronLeft, Clock, Plus, X } from 'lucide-react'
import { DepositRecord, depositService, FinanceStatus } from '../services/financeService'

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'custom', label: 'Custom' },
]

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-GB', { hour12: false })
}

function formatDateTime(value: string) {
  return `${formatDate(value)}, ${formatTime(value)}`
}

function displayStatus(status: FinanceStatus) {
  if (status === 'approved' || status === 'completed') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'cancelled') return 'Cancelled'
  return 'Pending'
}

function statusClass(status: FinanceStatus) {
  if (status === 'approved' || status === 'completed') {
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  }
  if (status === 'rejected' || status === 'cancelled') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
  }
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
}

function inDateRange(createdAt: string, filter: DateFilter, from: string, to: string) {
  const created = new Date(createdAt)
  const today = startOfDay(new Date())
  if (filter === 'today') return created >= today
  if (filter === 'week') {
    const week = new Date(today)
    week.setDate(week.getDate() - 7)
    return created >= week
  }
  if (filter === 'month') {
    const month = new Date(today)
    month.setMonth(month.getMonth() - 1)
    return created >= month
  }
  if (filter === 'custom') {
    if (from && created < startOfDay(new Date(from))) return false
    if (to) {
      const end = startOfDay(new Date(to))
      end.setDate(end.getDate() + 1)
      if (created >= end) return false
    }
  }
  return true
}

export default function DepositsPage() {
  const navigate = useNavigate()
  const [deposits, setDeposits] = useState<DepositRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selected, setSelected] = useState<DepositRecord | null>(null)

  useEffect(() => {
    depositService
      .getHistory()
      .then((list) => setDeposits(Array.isArray(list) ? list : []))
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return deposits.filter((item) => {
      if (!inDateRange(item.createdAt, dateFilter, customFrom, customTo)) return false
      if (!term) return true
      return (
        item.coin?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        String(item.amount).includes(term) ||
        displayStatus(item.status).toLowerCase().includes(term) ||
        item.address?.toLowerCase().includes(term) ||
        item.txHash?.toLowerCase().includes(term)
      )
    })
  }, [deposits, query, dateFilter, customFrom, customTo])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="text-gray-500">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <Plus className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Deposit History</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deposits..."
          className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700"
        />
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${
                dateFilter === item.id
                  ? 'bg-green-600 text-white dark:bg-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {dateFilter === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </label>
            <label className="text-xs text-gray-500">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </label>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="px-2 text-xs text-gray-500 sm:text-sm">
            Showing {filtered.length} of {deposits.length} deposits
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-sm text-gray-500 dark:border-gray-700">
              No deposits found
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelected(item)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-green-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700 sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 sm:h-12 sm:w-12">
                      <Plus className="h-5 w-5 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-base font-bold sm:text-lg">
                        <span className="text-green-600 dark:text-green-400">+{formatAmount(item.amount)}</span> USDT
                      </p>
                      <p className="truncate text-xs text-gray-500 sm:text-sm">
                        {item.description || `Deposit ${item.amount} USDT via ${item.coin ?? 'USDT'} - Pending approval`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {displayStatus(item.status)}
                    </span>
                    <span className="whitespace-nowrap rounded-md bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      deposit
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 sm:gap-4">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTime(item.createdAt)}</span>
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selected &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                <h3 className="text-lg font-bold">Deposit Details</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <p className="mb-1 text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +{formatAmount(selected.amount)} USDT
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Type</p>
                  <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    deposit
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Description</p>
                  <p className="text-sm">
                    {selected.description ||
                      `Deposit ${selected.amount} USDT via ${selected.coin ?? 'USDT'} - Pending approval`}
                  </p>
                </div>
                {selected.address && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Deposit Address</p>
                    <p className="break-all rounded bg-gray-50 p-2 font-mono text-xs dark:bg-gray-700">
                      {selected.address}
                    </p>
                  </div>
                )}
                {selected.txHash && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Transaction ID</p>
                    <p className="break-all rounded bg-gray-50 p-2 font-mono text-xs dark:bg-gray-700">
                      {selected.txHash}
                    </p>
                  </div>
                )}
                {selected.balanceBefore != null && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Balance Before</p>
                    <p className="text-sm">{formatAmount(selected.balanceBefore)} USDT</p>
                  </div>
                )}
                {selected.balanceAfter != null && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Balance After</p>
                    <p className="text-sm">{formatAmount(selected.balanceAfter)} USDT</p>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-sm text-gray-500">Status</p>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(selected.status)}`}>
                    {displayStatus(selected.status)}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Created At</p>
                  <p className="text-sm">{formatDateTime(selected.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
