import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Calendar, ChevronLeft, Clock, X } from 'lucide-react'
import { FinanceStatus, TransferRecord, transferService } from '../services/financeService'
import { SAMPLE_TRANSFERS } from '../data/placeholderTransfers'

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
  if (status === 'approved' || status === 'completed') return 'Completed'
  if (status === 'rejected') return 'Rejected'
  if (status === 'cancelled') return 'Cancelled'
  return 'Pending'
}

function statusClass(status: FinanceStatus) {
  if (status === 'approved' || status === 'completed') {
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
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

function counterpartyLabel(item: TransferRecord) {
  const cp = item.counterparty
  return cp?.name || cp?.username || cp?.email || item.recipientEmail || item.senderEmail || 'User'
}

export default function TransfersPage() {
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState<TransferRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selected, setSelected] = useState<TransferRecord | null>(null)

  useEffect(() => {
    transferService
      .getHistory()
      .then((list) => setTransfers(list.length > 0 ? list : SAMPLE_TRANSFERS))
      .catch(() => setTransfers(SAMPLE_TRANSFERS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return transfers.filter((item) => {
      if (!inDateRange(item.createdAt, dateFilter, customFrom, customTo)) return false
      if (!term) return true
      return (
        item.description?.toLowerCase().includes(term) ||
        item.recipientEmail?.toLowerCase().includes(term) ||
        item.senderEmail?.toLowerCase().includes(term) ||
        counterpartyLabel(item).toLowerCase().includes(term) ||
        item.counterparty?.uniqueId?.includes(term) ||
        String(item.amount).includes(term) ||
        displayStatus(item.status).toLowerCase().includes(term)
      )
    })
  }, [transfers, query, dateFilter, customFrom, customTo])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="text-gray-500">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Transfer History</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transfers..."
          className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
        />
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${
                dateFilter === item.id
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <ArrowLeftRight className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
          <p className="mb-2 text-base font-semibold sm:text-lg">No transfers found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="px-2 text-xs text-gray-500 sm:text-sm">
            Showing {filtered.length} of {transfers.length} transfers
          </p>
          {filtered.map((item) => {
            const outgoing = item.direction === 'out'
            const amountClass = outgoing
              ? 'text-red-600 dark:text-red-400'
              : 'text-indigo-600 dark:text-indigo-400'
            const amountPrefix = outgoing ? '-' : '+'
            return (
              <button
                key={item._id}
                onClick={() => setSelected(item)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700 sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 sm:h-12 sm:w-12">
                      <ArrowLeftRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-base font-bold sm:text-lg">
                        <span className={amountClass}>
                          {amountPrefix}
                          {formatAmount(item.amount)}
                        </span>{' '}
                        {item.coin ?? 'USDT'}
                      </p>
                      <p className="truncate text-xs text-gray-500 sm:text-sm">{item.description}</p>
                      <p className="truncate text-xs text-gray-400">
                        {outgoing ? 'To' : 'From'} {counterpartyLabel(item)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {displayStatus(item.status)}
                    </span>
                    <span className="whitespace-nowrap rounded-md bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      transfer
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
            )
          })}
        </div>
      )}

      {selected &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                <h3 className="text-lg font-bold">Transfer Details</h3>
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
                  <p
                    className={`text-lg font-semibold ${
                      selected.direction === 'out'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {selected.direction === 'out' ? '-' : '+'}
                    {formatAmount(selected.amount)} {selected.coin ?? 'USDT'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Type</p>
                  <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                    transfer
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Description</p>
                  <p className="text-sm">{selected.description}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">
                    {selected.direction === 'out' ? 'Recipient' : 'Sender'}
                  </p>
                  <p className="text-sm font-medium">{counterpartyLabel(selected)}</p>
                  {selected.counterparty?.email && (
                    <p className="text-xs text-gray-500">{selected.counterparty.email}</p>
                  )}
                  {selected.counterparty?.uniqueId && (
                    <p className="text-xs text-gray-500">ID: {selected.counterparty.uniqueId}</p>
                  )}
                </div>
                {selected.fee != null && selected.fee > 0 && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Transfer Fee</p>
                    <p className="text-sm">{formatAmount(selected.fee)} {selected.coin ?? 'USDT'}</p>
                  </div>
                )}
                {selected.netAmount != null && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Net Amount</p>
                    <p className="text-sm">
                      {formatAmount(selected.netAmount)} {selected.coin ?? 'USDT'}
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
                {selected.note && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Note</p>
                    <p className="text-sm">{selected.note}</p>
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
                  className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
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
