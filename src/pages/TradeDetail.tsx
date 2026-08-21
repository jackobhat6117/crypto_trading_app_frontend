import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, ChevronLeft, Clock, MoreVertical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tradeService } from '../services/tradeService'
import { useMarketAssets } from '../hooks/useMarketAssets'
import { formatBalance, formatChange } from '../utils/format'
import { AssetType } from '../types'
import SimpleOrderBook from '../components/trading/SimpleOrderBook'
import FundingRate from '../components/trading/FundingRate'
import clsx from 'clsx'

const leverageOptions = [1, 2, 3, 5, 10, 20, 50, 100]
const timeInForceOptions = ['GTC', 'IOC', 'FOK'] as const
const tickSizeOptions = [0.01, 0.1, 1, 10]
const timerOptions = [
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
]

const controlClass =
  'rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
const stepperBtn =
  'flex h-10 w-9 shrink-0 items-center justify-center bg-gray-100 text-lg text-gray-700 dark:bg-gray-700 dark:text-gray-200'

export default function TradeDetail() {
  const { type = 'crypto', symbol = 'BTC' } = useParams<{ type: AssetType; symbol: string }>()
  const assetType = (type as AssetType) || 'crypto'
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { assets } = useMarketAssets(assetType)
  const asset = useMemo(
    () => assets.find((a) => a.symbol.toUpperCase() === symbol.toUpperCase()),
    [assets, symbol]
  )

  const [marginMode, setMarginMode] = useState<'cross' | 'isolated'>('cross')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [leverage, setLeverage] = useState(5)
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [timer, setTimer] = useState(60)
  const [showChart, setShowChart] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tickSize, setTickSize] = useState(0.1)
  const [timeInForce, setTimeInForce] = useState<(typeof timeInForceOptions)[number]>('GTC')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [tab, setTab] = useState<'positions' | 'orders'>('positions')

  const balance = user?.balance ?? 0
  const pair = symbol.toUpperCase()

  const stepPrice = (direction: 1 | -1) => {
    const next = Math.max(0, (Number(price) || 0) + direction * tickSize)
    setPrice(next.toFixed(tickSize < 1 ? 2 : 0))
  }

  const stepAmount = (direction: 1 | -1) => {
    const next = Math.max(0, (Number(amount) || 0) + direction)
    setAmount(String(next))
  }

  const applyBbo = () => {
    if (asset?.price) setPrice(String(asset.price))
  }

  useEffect(() => {
    if (asset?.price) setPrice(String(asset.price))
  }, [asset?.price])

  const placeOrder = async (side: 'buy' | 'sell') => {
    if (!amount || Number(amount) <= 0) {
      setMessage('Enter a valid amount')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const result = await tradeService.placeTrade({
        symbol: pair,
        type: assetType,
        side,
        orderType,
        price: orderType === 'limit' ? Number(price) : undefined,
        amount: Number(amount),
        leverage,
        marginMode,
        timer,
        timeInForce,
        reduceOnly,
      })
      await refreshUser()
      const tradeId = result.trade?._id || result._id
      if (tradeId) navigate(`/order/${tradeId}`, { state: { trade: result.trade || result } })
      else navigate('/history')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMessage(msg || 'Failed to place trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white lg:min-h-[calc(100dvh-4rem)]">
      <header className="sticky top-0 z-40 flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/trade')}
              className="shrink-0 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Back to markets"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowChart((open) => !open)}
              className="shrink-0 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={showChart ? 'Hide Chart' : 'Show Chart'}
              aria-label={showChart ? 'Hide Chart' : 'Show Chart'}
            >
              <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <h1 className="truncate text-base font-bold sm:text-lg">{pair}</h1>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">Perp</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <span className={asset && asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {asset ? formatChange(asset.change24h) : '--'}
                </span>
                <span className="hidden text-gray-500 dark:text-gray-400 sm:inline">Funding (8h) / Countdown</span>
                <FundingRate compact />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => navigate('/history')}
              className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 sm:p-2"
              aria-label="Trade history"
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 sm:p-2" aria-label="More">
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      {showChart && (
        <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex gap-2">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button key={tf} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                {tf}
              </button>
            ))}
          </div>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500 dark:bg-gray-700">
            TradingView chart · {pair}/USDT
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-28 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:w-32 md:w-40 lg:w-64">
          <div className="flex items-center justify-between border-b border-gray-200 p-1.5 dark:border-gray-700 sm:p-3">
            <h3 className="text-xs font-semibold sm:hidden">Book</h3>
            <h3 className="hidden text-sm font-semibold sm:block">Order Book</h3>
            <select
              value={tickSize}
              onChange={(e) => setTickSize(Number(e.target.value))}
              aria-label="Order book tick size"
              className="w-12 rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700"
            >
              {tickSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-3">
            <SimpleOrderBook symbol={`${pair}USDT`} currentPrice={asset?.price || 0} compact />
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto bg-white p-3 dark:bg-gray-800 sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            {(['cross', 'isolated'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMarginMode(mode)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm capitalize',
                  marginMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                {mode}
              </button>
            ))}
            <select
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className={clsx(controlClass, 'ml-auto')}
              aria-label="Leverage"
            >
              {leverageOptions.map((x) => (
                <option key={x} value={x}>
                  {x}x
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Available</span>
            <span className="font-medium">{formatBalance(balance)} USDT</span>
          </div>

          <div className="mb-4 flex gap-2">
            {(['limit', 'market'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm capitalize',
                  orderType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Price (USDT)</label>
              <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                <button type="button" onClick={() => stepPrice(-1)} aria-label="Decrease price" className={stepperBtn}>
                  −
                </button>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="min-w-0 flex-1 border-x border-gray-200 bg-white px-2 py-2 text-center text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <button type="button" onClick={() => stepPrice(1)} aria-label="Increase price" className={stepperBtn}>
                  +
                </button>
                <button
                  type="button"
                  onClick={applyBbo}
                  className="shrink-0 bg-indigo-600 px-3 text-xs font-semibold text-white"
                >
                  BBO
                </button>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">Amount (USDT)</label>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <button type="button" onClick={() => stepAmount(-1)} aria-label="Decrease amount" className={stepperBtn}>
                −
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 border-x border-gray-200 bg-white px-2 py-2 text-center text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <button type="button" onClick={() => stepAmount(1)} aria-label="Increase amount" className={stepperBtn}>
                +
              </button>
              <span className="flex shrink-0 items-center bg-indigo-600 px-3 text-xs font-semibold text-white">USDT</span>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setAmount(String((balance * pct) / 100))}
                className="rounded-lg bg-gray-100 py-1.5 text-xs font-medium dark:bg-gray-700"
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Reduce Only
            </label>
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value as (typeof timeInForceOptions)[number])}
              aria-label="Time in force"
              className={controlClass}
            >
              {timeInForceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">Trade Timer</label>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className={clsx(controlClass, 'w-full py-2')}
            >
              {timerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-4 text-xs text-gray-500">Max: {formatBalance(balance)} USDT</p>
          {message && <p className="mb-3 text-sm text-red-500">{message}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => placeOrder('buy')}
              className="rounded-xl bg-emerald-500 py-3 font-semibold text-white disabled:opacity-60"
            >
              Buy/Long
            </button>
            <button
              disabled={loading}
              onClick={() => placeOrder('sell')}
              className="rounded-xl bg-rose-500 py-3 font-semibold text-white disabled:opacity-60"
            >
              Sell/Short
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-4 text-sm">
          <button
            onClick={() => setTab('positions')}
            className={tab === 'positions' ? 'border-b-2 border-indigo-600 pb-1 font-medium text-indigo-600' : 'text-gray-500'}
          >
            Positions (0)
          </button>
          <button
            onClick={() => setTab('orders')}
            className={tab === 'orders' ? 'border-b-2 border-indigo-600 pb-1 font-medium text-indigo-600' : 'text-gray-500'}
          >
            Orders (0)
          </button>
          <button onClick={() => navigate('/history')} className="text-gray-500">
            History
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          {tab === 'positions' ? 'No open positions' : 'No open orders'}
        </p>
      </div>
    </div>
  )
}
