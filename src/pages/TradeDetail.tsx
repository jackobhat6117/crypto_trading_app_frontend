import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { tradeService } from '../services/tradeService'
import { useMarketAssets } from '../hooks/useMarketAssets'
import { formatBalance, formatChange } from '../utils/format'
import { AssetType } from '../types'
import SimpleOrderBook from '../components/trading/SimpleOrderBook'
import FundingRate from '../components/trading/FundingRate'

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

  const stepPrice = (direction: 1 | -1) => {
    const next = Math.max(0, (Number(price) || 0) + direction * tickSize)
    setPrice(next.toFixed(tickSize < 1 ? 2 : 0))
  }

  const stepAmount = (direction: 1 | -1) => {
    const next = Math.max(0, (Number(amount) || 0) + direction)
    setAmount(String(next))
  }

  // "Best bid/offer" snaps the limit price back to the live market price.
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
        symbol: symbol.toUpperCase(),
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/trade')} className="text-gray-500">←</button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{symbol.toUpperCase()}</h1>
            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Perp
            </span>
          </div>
          <p className={asset && asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
            {asset ? formatChange(asset.change24h) : '--'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <FundingRate />
          <button
            onClick={() => setShowChart(!showChart)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white"
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
      </div>

      {showChart && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex gap-2">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button key={tf} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                {tf}
              </button>
            ))}
          </div>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500 dark:bg-gray-800">
            TradingView chart · {symbol}/USDT
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Tick size</label>
            <select
              value={tickSize}
              onChange={(e) => setTickSize(Number(e.target.value))}
              aria-label="Order book tick size"
              className="rounded-lg border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {tickSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <SimpleOrderBook symbol={`${symbol}USDT`} currentPrice={asset?.price || 0} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex gap-2">
            {(['cross', 'isolated'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMarginMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${marginMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
              >
                {mode}
              </button>
            ))}
            <select
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="ml-auto rounded-lg border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {leverageOptions.map((x) => (
                <option key={x} value={x}>{x}x</option>
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
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${orderType === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Price (USDT)</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => stepPrice(-1)}
                  aria-label="Decrease price"
                  className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
                >
                  −
                </button>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-800"
                />
                <button
                  onClick={() => stepPrice(1)}
                  aria-label="Increase price"
                  className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
                >
                  +
                </button>
                <button
                  onClick={applyBbo}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium dark:bg-gray-800"
                >
                  BBO
                </button>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">Amount (USDT)</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepAmount(-1)}
                aria-label="Decrease amount"
                className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
              >
                −
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                onClick={() => stepAmount(1)}
                aria-label="Increase amount"
                className="rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setAmount(String((balance * pct) / 100))}
                className="rounded-lg bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800"
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
              className="rounded-lg border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {timeInForceOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">Trade Timer</label>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              {timerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <p className="mb-4 text-xs text-gray-500">Max: {formatBalance(balance)} USDT</p>

          {message && <p className="mb-3 text-sm text-red-500">{message}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => placeOrder('buy')}
              className="rounded-xl bg-green-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              Buy/Long
            </button>
            <button
              disabled={loading}
              onClick={() => placeOrder('sell')}
              className="rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              Sell/Short
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex gap-4 text-sm">
          <button
            onClick={() => setTab('positions')}
            className={tab === 'positions' ? 'font-medium text-indigo-600' : 'text-gray-500'}
          >
            Positions (0)
          </button>
          <button
            onClick={() => setTab('orders')}
            className={tab === 'orders' ? 'font-medium text-indigo-600' : 'text-gray-500'}
          >
            Orders (0)
          </button>
          <button onClick={() => navigate('/history')} className="text-gray-500">History</button>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          {tab === 'positions' ? 'No open positions' : 'No open orders'}
        </p>
      </div>
    </div>
  )
}
