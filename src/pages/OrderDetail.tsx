import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, HelpCircle } from 'lucide-react'
import { tradeService } from '../services/tradeService'
import { Trade } from '../types'
import { formatBalance } from '../utils/format'
import { useAuth } from '../contexts/AuthContext'

function formatClock(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDay(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

function remainingSeconds(trade?: Trade | null) {
  if (!trade) return 0
  if (trade.expiresAt) {
    const end = new Date(trade.expiresAt).getTime()
    if (!Number.isNaN(end)) return Math.max(0, Math.ceil((end - Date.now()) / 1000))
  }
  if (trade.createdAt && trade.timer) {
    const start = new Date(trade.createdAt).getTime()
    if (!Number.isNaN(start)) {
      return Math.max(0, Math.ceil((start + trade.timer * 1000 - Date.now()) / 1000))
    }
  }
  return 0
}

function expectedPnl(trade?: Trade | null, percent = 0, isWin = true) {
  const stake = Number(trade?.amount || 0)
  const amount = (stake * percent) / 100
  return isWin ? amount : -amount
}

export default function OrderDetailPage() {
  const { tradeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const seeded = (location.state as { trade?: Trade })?.trade
  const [trade, setTrade] = useState<Trade | null>(seeded || null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!tradeId) return
    let cancelled = false

    const load = async () => {
      try {
        const next = await tradeService.getTrade(tradeId)
        if (!cancelled) setTrade(next)
      } catch {
        /* keep seeded trade if fetch fails */
      }
    }

    void load()
    const poll = window.setInterval(() => void load(), 1000)
    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [tradeId])

  const open = trade?.status === 'open' || trade?.status === 'pending' || trade?.result === 'pending'
  const left = remainingSeconds(trade)
  const duration = trade?.timer || 60
  const progress = open ? Math.max(4, Math.min(100, ((duration - left) / duration) * 100)) : 100
  const win = open
    ? trade?.profitPercent != null
    : trade?.result === 'win' || (trade?.profit || 0) > 0
  const settling = open && left <= 0

  useEffect(() => {
    if (open) return
    void refreshUser()
  }, [open, refreshUser])

  useEffect(() => {
    if (!settling || !tradeId) return
    let cancelled = false
    const load = async () => {
      try {
        const next = await tradeService.getTrade(tradeId)
        if (!cancelled) setTrade(next)
      } catch {
        /* keep current trade */
      }
    }
    void load()
    const poll = window.setInterval(() => void load(), 400)
    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [settling, tradeId])

  useEffect(() => {
    if (!open) return
    const tick = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(tick)
  }, [open])

  const percent = useMemo(() => {
    void now
    if (win) return Math.abs(Number(trade?.profitPercent || 0))
    return Math.abs(Number(trade?.lossPercent || 0))
  }, [trade, win, now])

  const pnl = open
    ? expectedPnl(trade, percent, win)
    : Number(trade?.profit || 0)

  const row = (label: string, value: string, valueClass = 'text-gray-900 dark:text-white') => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Order Detail</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <HelpCircle className="h-5 w-5" />
          <span>EN</span>
        </div>
      </header>

      {!trade ? (
        <p className="px-4 py-10 text-center text-sm text-gray-500">Loading order details...</p>
      ) : (
        <div className="space-y-4 px-4 py-4">
          {open ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{trade.symbol} / USDT</p>
                  <p className="text-xs text-gray-500">
                    {trade.side === 'buy' ? 'Long' : 'Short'} • {trade.leverage || 1}x
                  </p>
                </div>
                <span className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white">
                  {settling ? 'SETTLING' : 'PENDING'}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">Time Remaining</span>
                <span className="font-bold text-gray-900 dark:text-white">{settling ? '0s' : `${left}s`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                  style={{ width: `${settling ? 100 : progress}%` }}
                />
              </div>
              {percent > 0 && (
                <div className="mt-3 space-y-1">
                  <p className={`text-sm font-semibold ${win ? 'text-green-500' : 'text-red-400'}`}>
                    Target {win ? 'Win' : 'Loss'}: {win ? '+' : '-'}
                    {formatBalance(Math.abs(pnl))} USDT
                  </p>
                  <p className="text-xs text-gray-500">
                    {percent.toFixed(2)}% of {formatBalance(trade.amount)} USDT
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`rounded-xl border p-3 ${
                win
                  ? 'border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-700/50 dark:bg-red-900/20'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-xs font-semibold ${win ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {win ? 'Profit' : 'Loss'}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${win ? 'bg-green-500' : 'bg-red-500'}`}>
                  {win ? 'WIN' : 'LOSS'}
                </span>
              </div>
              <p className={`text-xl font-bold ${win ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}
                {formatBalance(pnl)} USDT
              </p>
              {percent > 0 && (
                <p className="text-xs text-gray-500">
                  {win ? '+' : '-'}
                  {percent.toFixed(2)}% of {formatBalance(trade.amount)} USDT
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                open ? 'bg-yellow-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {open ? 'PENDING' : 'FILLED 100%'}
            </span>
            <span className="text-sm font-semibold">{trade.symbol} / USDT</span>
          </div>

          <div className="space-y-1 text-sm">
            {row('Order No', trade._id)}
            {row(
              'Type',
              `${(trade.orderType || 'market').toUpperCase()} / ${trade.side.toUpperCase()}`,
              trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
            )}
            {row('Trade Amount', `$${formatBalance(trade.amount)} USDT`)}
            {percent > 0 &&
              row(
                win ? 'Win Percent' : 'Loss Percent',
                `${percent.toFixed(2)}%`,
                win ? 'text-green-500' : 'text-red-500'
              )}
            {percent > 0 &&
              row(
                open ? 'Expected P/L' : 'Profit / Loss',
                `${pnl >= 0 ? '+' : ''}${formatBalance(pnl)} USDT`,
                win ? 'text-green-500' : 'text-red-500'
              )}
            {row(
              'Avg. / Price',
              `${formatBalance(trade.entryPrice || trade.price)} / ${trade.exitPrice ? formatBalance(trade.exitPrice) : '—'}`
            )}
            {row('Create Time', formatClock(trade.createdAt), 'text-sky-400')}
            {row('Update Time', formatClock(trade.closedAt || trade.createdAt), 'text-sky-400')}
          </div>

          <h2 className="pt-2 text-xs font-bold tracking-wider text-gray-500">TRADE DETAILS</h2>
          <div className="space-y-1 text-sm">
            {row('Date', formatDay(trade.createdAt))}
            {row('Open Price', formatBalance(trade.entryPrice || trade.price))}
            {row('Close Price', trade.exitPrice ? formatBalance(trade.exitPrice) : '—')}
            {row('Trade Amount', `$${formatBalance(trade.amount)} USDT`)}
          </div>

          {!open && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 px-3 py-3">
                <span className="text-sm text-gray-500">Result</span>
                <span className={`font-semibold ${win ? 'text-green-500' : 'text-red-500'}`}>{win ? 'Win' : 'Loss'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 px-3 py-3">
                <span className="text-sm text-gray-500">Profit / Loss</span>
                <span className={`font-semibold ${win ? 'text-green-500' : 'text-red-500'}`}>
                  {(trade.profit || 0) >= 0 ? '+' : ''}
                  {formatBalance(trade.profit || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
