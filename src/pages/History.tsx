import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Check, ChevronLeft, Clock, Search, TrendingDown, TrendingUp, X } from 'lucide-react'
import { tradeService } from '../services/tradeService'
import { Trade } from '../types'

type ResultFilter = 'all' | 'win' | 'loss'
type SideFilter = 'all' | 'buy' | 'sell'
type SortKey = 'date' | 'profit' | 'symbol'

function isWin(trade: Trade) {
  if (trade.result === 'win') return true
  if (trade.result === 'loss') return false
  return (trade.profit || 0) > 0
}

function changePercent(trade: Trade) {
  const win = isWin(trade)
  const provided = win ? trade.profitPercent : trade.lossPercent
  if (provided != null && Number.isFinite(provided)) return Math.abs(Number(provided))

  const entry = Number(trade.entryPrice || 0)
  const exit = Number(trade.exitPrice || 0)
  if (entry > 0 && exit > 0) {
    const move = ((exit - entry) / entry) * 100
    return Math.abs(trade.side === 'sell' ? -move : move)
  }

  const stake = Number(trade.marginUsed || trade.amount || 0)
  if (stake > 0 && trade.profit != null) return Math.abs((trade.profit / stake) * 100)
  return 0
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0)
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const selectClass =
  'rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
  const [sideFilter, setSideFilter] = useState<SideFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('date')

  useEffect(() => {
    let cancelled = false

    const load = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const list = await tradeService.getHistory()
        if (!cancelled) setTrades(list)
      } catch {
        if (!cancelled) setTrades([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const timer = window.setInterval(() => void load(true), 5_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const stats = useMemo(() => {
    const closed = trades.filter((trade) => trade.status === 'closed' || trade.result || trade.closedAt)
    const source = closed.length > 0 ? closed : trades
    const wins = source.filter(isWin)
    const losses = source.filter((trade) => !isWin(trade) && (trade.profit || 0) < 0)
    const totalPl = source.reduce((sum, trade) => sum + (trade.profit || 0), 0)
    const winProfit = wins.reduce((sum, trade) => sum + (trade.profit || 0), 0)
    const lossAmount = losses.reduce((sum, trade) => sum + Math.abs(trade.profit || 0), 0)
    const winRate = source.length ? (wins.length / source.length) * 100 : 0
    const avgWin = wins.length ? winProfit / wins.length : 0
    const avgLoss = losses.length ? lossAmount / losses.length : 0
    return {
      totalTrades: source.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalPl,
      avgWin,
      avgLoss,
    }
  }, [trades])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = trades.filter((trade) => {
      if (term && !trade.symbol.toLowerCase().includes(term)) return false
      if (resultFilter === 'win' && !isWin(trade)) return false
      if (resultFilter === 'loss' && isWin(trade)) return false
      if (sideFilter !== 'all' && trade.side !== sideFilter) return false
      return true
    })

    return list.sort((a, b) => {
      if (sortBy === 'profit') return (b.profit || 0) - (a.profit || 0)
      if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol)
      const aDate = new Date(a.closedAt || a.createdAt || 0).getTime()
      const bDate = new Date(b.closedAt || b.createdAt || 0).getTime()
      return bDate - aDate
    })
  }, [trades, query, resultFilter, sideFilter, sortBy])

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="mb-3 flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 sm:p-2"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 sm:h-6 sm:w-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Trade History</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{stats.totalTrades} Trades</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
                className={selectClass}
                aria-label="Filter by result"
              >
                <option value="all">All</option>
                <option value="win">Wins</option>
                <option value="loss">Loss</option>
              </select>
              <select
                value={sideFilter}
                onChange={(e) => setSideFilter(e.target.value as SideFilter)}
                className={selectClass}
                aria-label="Filter by side"
              >
                <option value="all">All</option>
                <option value="buy">Long</option>
                <option value="sell">Short</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className={selectClass}
                aria-label="Sort trades"
              >
                <option value="date">Date</option>
                <option value="profit">Profit</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-3">
            <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Total P/L</p>
            <div className="flex flex-wrap items-baseline space-x-1">
              <p
                className={`text-sm font-bold sm:text-lg ${
                  stats.totalPl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.totalPl >= 0 ? '+' : ''}
                {formatMoney(stats.totalPl)}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">USDT</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-3">
            <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Win Rate</p>
            <div className="flex flex-wrap items-baseline space-x-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white sm:text-lg">
                {stats.winRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                ({stats.wins}W / {stats.losses}L)
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-3">
            <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Avg Win</p>
            <div className="flex flex-wrap items-baseline space-x-1">
              <p className="text-sm font-bold text-green-600 dark:text-green-400 sm:text-lg">
                +{formatMoney(stats.avgWin)}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">USDT</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-3">
            <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">Avg Loss</p>
            <div className="flex flex-wrap items-baseline space-x-1">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 sm:text-lg">
                -{formatMoney(stats.avgLoss)}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">USDT</p>
            </div>
          </div>
        </div>

        {loading && trades.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Clock className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
            <p className="font-medium text-gray-500 dark:text-gray-400">No trades found</p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {query || resultFilter !== 'all' || sideFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your completed trades will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((trade) => {
              const win = isWin(trade)
              const percent = changePercent(trade)
              const when = trade.closedAt || trade.createdAt
              const TrendIcon = win ? TrendingUp : TrendingDown
              return (
                <button
                  key={trade._id}
                  onClick={() => navigate(`/order/${trade._id}`, { state: { trade } })}
                  className={`w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                    win ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                  }`}
                >
                  <div className="p-2.5 sm:p-3">
                    <div className="mb-2.5 flex items-start justify-between">
                      <div className="flex min-w-0 flex-1 items-center space-x-2">
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                            win ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {win ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {trade.symbol}
                          </p>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                trade.side === 'buy'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {trade.side === 'buy' ? 'BUY' : 'SELL'}
                            </span>
                            {trade.leverage != null && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">{trade.leverage}x</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 text-right">
                        <div
                          className={`mb-1 flex items-center justify-end space-x-1 ${
                            win ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          <TrendIcon className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">
                            {win ? '+' : '-'}
                            {percent.toFixed(2)}%
                          </span>
                        </div>
                        <p
                          className={`mb-1.5 text-xs font-bold ${
                            win ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {(trade.profit || 0) >= 0 ? '+' : ''}
                          {formatMoney(trade.profit)}
                        </p>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white ${
                            win ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {win ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2.5 flex items-center justify-between border-b border-gray-200 pb-2.5 dark:border-gray-700">
                      <div className="flex-1 text-center">
                        <p className="mb-0.5 text-[9px] text-gray-500 dark:text-gray-400">Entry</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          ${formatMoney(trade.entryPrice || trade.price)}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 text-center">
                        <p className="mb-0.5 text-[9px] text-gray-500 dark:text-gray-400">Exit</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          ${formatMoney(trade.exitPrice)}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 text-center">
                        <p className="mb-0.5 text-[9px] text-gray-500 dark:text-gray-400">Trade Amount</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          ${formatMoney(trade.marginUsed || trade.amount)}
                        </p>
                        <p className="mt-0.5 text-[8px] text-gray-400 dark:text-gray-500">USDT</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400">{formatDate(when)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400">{formatTime(when)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
