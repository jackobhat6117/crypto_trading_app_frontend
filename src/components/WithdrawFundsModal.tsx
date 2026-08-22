import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Eye, EyeOff, Search, X } from 'lucide-react'
import { coinService } from '../services/marketDataService'
import { withdrawalService, WithdrawalSettings } from '../services/financeService'
import { Coin } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { formatBalance } from '../utils/format'
import { mergeCoinCatalog } from '../data/placeholderCoins'
import { useAuth } from '../contexts/AuthContext'

interface WithdrawFundsModalProps {
  open: boolean
  onClose: () => void
  selectedCoin?: Coin | null
  onSuccess?: () => void
}

type Stage = 'select' | 'form'

const TOP_SYMBOLS = ['BTC', 'ETH', 'USDT']

export default function WithdrawFundsModal({
  open,
  onClose,
  selectedCoin,
  onSuccess,
}: WithdrawFundsModalProps) {
  const { user, refreshUser } = useAuth()
  const [coins, setCoins] = useState<Coin[]>(() => mergeCoinCatalog([]))
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<Stage>('select')
  const [coin, setCoin] = useState<Coin | null>(selectedCoin ?? null)
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [fundPassword, setFundPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null)

  const balance = user?.balance ?? 0

  useEffect(() => {
    if (!open) return
    setStage(selectedCoin ? 'form' : 'select')
    setCoin(selectedCoin ?? null)
    setAmount('')
    setAddress('')
    setFundPassword('')
    setShowPassword(false)
    setError('')
    setMessage('')
    setQuery('')
    setLoading(true)
    Promise.all([
      coinService.getCoins().catch(() => [] as Coin[]),
      withdrawalService.getSettings().catch(() => null),
    ])
      .then(([list, nextSettings]) => {
        setCoins(mergeCoinCatalog(list))
        setSettings(nextSettings)
      })
      .finally(() => setLoading(false))
  }, [open, selectedCoin])

  const topCoins = useMemo(
    () =>
      TOP_SYMBOLS.map((symbol) => coins.find((item) => item.symbol.toUpperCase() === symbol)).filter(
        (item): item is Coin => Boolean(item)
      ),
    [coins]
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return coins
    return coins.filter(
      (item) =>
        item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
    )
  }, [coins, query])

  const minAmount = coin?.minWithdraw ?? settings?.minWithdrawal ?? 1
  const maxAmount = coin?.maxWithdraw ?? settings?.maxWithdrawal ?? 0
  const netAmount = Math.max(0, Number(amount) || 0)

  const chooseCoin = (item: Coin) => {
    setCoin(item)
    setStage('form')
    setError('')
  }

  const submit = async () => {
    if (!coin) return
    const value = Number(amount)
    if (!value || value < minAmount) {
      setError(`Please enter a valid amount (minimum ${minAmount} ${coin.symbol})`)
      return
    }
    if (maxAmount > 0 && value > maxAmount) {
      setError(`Maximum withdrawal is ${maxAmount} ${coin.symbol}`)
      return
    }
    if (value > balance) {
      setError('Amount exceeds available balance')
      return
    }
    if (!address.trim()) {
      setError('Please enter a destination wallet address')
      return
    }
    if (!fundPassword.trim()) {
      setError('Fund password is required for withdrawals')
      return
    }
    if (settings?.allowWithdraw === false) {
      setError('Withdrawals are currently unavailable')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await withdrawalService.create({
        coinId: coin._id,
        coinSymbol: coin.symbol,
        amount: value,
        address: address.trim(),
        network: coin.network,
        fundPassword,
      })
      setMessage('Withdrawal request submitted successfully! Waiting for admin approval.')
      await refreshUser()
      onSuccess?.()
      setTimeout(onClose, 1200)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={onClose} />
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:h-auto sm:max-h-[90vh] sm:min-h-[28rem] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 sm:rounded-t-2xl sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white sm:text-xl">Withdraw Funds</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white hover:bg-white/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white p-4 dark:bg-gray-900 sm:p-6">
          {stage === 'select' ? (
            <>
              {loading && coins.length === 0 && (
                <div className="mb-4 flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
                  <span className="ml-3 text-sm text-gray-500">Loading coins...</span>
                </div>
              )}

              <div className="relative mb-4 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search coins..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
              </div>

              {topCoins.length > 0 && (
                <div className="mb-4 flex-shrink-0">
                  <h4 className="mb-2 text-xs font-semibold text-gray-500 sm:text-sm">Top Coins</h4>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {topCoins.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => chooseCoin(item)}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-left hover:border-indigo-500 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-indigo-900/20 sm:p-3"
                      >
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          {item.image ? (
                            <img src={resolveMediaUrl(item.image)} alt="" className="h-8 w-8 rounded-full sm:h-10 sm:w-10" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold dark:bg-gray-700 sm:h-10 sm:w-10">
                              {item.symbol.charAt(0)}
                            </div>
                          )}
                          <div className="w-full text-center">
                            <div className="truncate text-xs font-semibold sm:text-sm">{item.symbol}</div>
                            <div className="text-xs text-gray-500">${formatBalance(item.price)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col">
                <h4 className="mb-2 flex-shrink-0 text-xs font-semibold text-gray-500 sm:text-sm">
                  All Coins {filtered.length > 0 && `(${filtered.length})`}
                </h4>
                <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                  {filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">No coins found</p>
                  ) : (
                    filtered.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => chooseCoin(item)}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 hover:border-indigo-500 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-indigo-900/20 sm:p-3"
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          {item.image ? (
                            <img src={resolveMediaUrl(item.image)} alt="" className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold dark:bg-gray-600 sm:h-8 sm:w-8">
                              {item.symbol.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 text-left">
                            <div className="truncate text-xs font-semibold sm:text-sm">{item.symbol}</div>
                            <div className="truncate text-xs text-gray-500">{item.name}</div>
                          </div>
                        </div>
                        <div className="text-xs font-semibold sm:text-sm">${formatBalance(item.price)}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            coin && (
              <div className="flex h-full flex-col space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {coin.image ? (
                      <img src={resolveMediaUrl(coin.image)} alt="" className="h-12 w-12 rounded-full" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold dark:bg-gray-700">
                        {coin.symbol.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold">{coin.name}</p>
                      <p className="text-sm text-gray-500">{coin.symbol}</p>
                    </div>
                  </div>
                  <button onClick={() => setStage('select')} className="text-gray-400 hover:text-gray-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Available balance</p>
                  <p className="text-lg font-semibold">{formatBalance(balance)} USDT</p>
                </div>

                {(minAmount > 0 || maxAmount > 0) && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="mb-1 font-semibold text-blue-900 dark:text-blue-200">Withdrawal limits</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {minAmount > 0 && `Minimum: ${minAmount} ${coin.symbol}`}
                      {maxAmount > 0 && `  Maximum: ${maxAmount} ${coin.symbol}`}
                    </p>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium">
                      Amount ({coin.symbol}) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmount(String(balance))}
                      className="text-xs font-semibold text-indigo-600"
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min={minAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base font-semibold dark:border-gray-600 dark:bg-gray-800"
                  />
                  {Number(amount) > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      You will receive {formatBalance(netAmount)} {coin.symbol}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Wallet address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`Enter ${coin.symbol} destination address`}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                  {coin.network && <p className="mt-1 text-xs text-gray-500">Network: {coin.network}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Fund password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={fundPassword}
                      onChange={(e) => setFundPassword(e.target.value)}
                      placeholder="Enter fund password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={showPassword ? 'Hide fund password' : 'Show fund password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Required for all withdrawals</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="mb-1.5 font-semibold text-amber-900 dark:text-amber-200">Important notes</p>
                  <ul className="list-inside list-disc space-y-1 text-amber-800 dark:text-amber-300">
                    <li>Only send {coin.symbol} to a matching network address</li>
                    <li>Double-check the address before submitting</li>
                    <li>Withdrawals are reviewed by admin before processing</li>
                  </ul>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {message && <p className="text-sm text-emerald-500">{message}</p>}

                <button
                  onClick={submit}
                  disabled={submitting || !amount || !address || !fundPassword}
                  className="w-full rounded-lg bg-indigo-600 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
                </button>
                <button
                  onClick={() => setStage('select')}
                  className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium dark:bg-gray-700"
                >
                  ← Back to Coin Selection
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
