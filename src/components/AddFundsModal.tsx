import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Plus, Search, Upload, X } from 'lucide-react'
import { depositService } from '../services/financeService'
import { walletService } from '../services/walletService'
import { Coin } from '../types'
import { createPortal } from 'react-dom'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { formatBalance } from '../utils/format'

interface AddFundsModalProps {
  open: boolean
  onClose: () => void
  selectedCoin?: Coin | null
  onSuccess?: () => void
}

type Stage = 'select' | 'address'

export default function AddFundsModal({ open, onClose, selectedCoin, onSuccess }: AddFundsModalProps) {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<Stage>('select')
  const [coin, setCoin] = useState<Coin | null>(selectedCoin ?? null)
  const [amount, setAmount] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setStage(selectedCoin ? 'address' : 'select')
    setCoin(selectedCoin ?? null)
    setAmount('')
    setScreenshot(null)
    setPreview(null)
    setError('')
    setMessage('')
    setQuery('')
    setLoading(true)
    walletService
      .getDepositCoins()
      .then((list) => {
        setCoins(list)
        if (selectedCoin) {
          const match = list.find((item) => item.symbol.toUpperCase() === selectedCoin.symbol.toUpperCase())
          if (match) setCoin(match)
        }
      })
      .catch(() => setCoins([]))
      .finally(() => setLoading(false))
  }, [open, selectedCoin])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return coins
    return coins.filter(
      (item) =>
        item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
    )
  }, [coins, query])

  const chooseCoin = (item: Coin) => {
    if (!item.address?.trim()) {
      setError(`Deposits for ${item.symbol} are not available yet. Admin has not configured a deposit address.`)
      return
    }
    setCoin(item)
    setStage('address')
    setError('')
  }

  const copyAddress = async () => {
    if (!coin?.address) return
    await navigator.clipboard.writeText(coin.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submit = async () => {
    if (!coin) return
    if (!coin?.address?.trim()) {
      setError(`Deposits for ${coin.symbol} are not available yet. Admin has not configured a deposit address.`)
      return
    }
    const value = Number(amount)
    const min = coin.minDeposit ?? 1
    if (!value || value < min) {
      setError(`Please enter a valid amount (minimum ${min} USDT)`)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await depositService.submitRequest({
        coinSymbol: coin.symbol,
        amount: value,
        screenshot: screenshot ?? undefined,
      })
      setMessage('Deposit request submitted successfully! Waiting for admin approval.')
      onSuccess?.()
      setTimeout(onClose, 1200)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to submit deposit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={onClose} />
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:h-auto sm:max-h-[90vh] sm:min-h-[28rem] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-4 sm:rounded-t-2xl sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white sm:text-xl">Add Funds</h3>
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
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
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

              <div className="mb-2 flex-shrink-0">
                <h4 className="text-xs font-semibold text-gray-500 sm:text-sm">
                  Deposit with BTC, ETH or USDT
                </h4>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                  {!loading && filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">No deposit methods available</p>
                  ) : (
                    filtered.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => chooseCoin(item)}
                        disabled={!item.address?.trim()}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 hover:border-green-500 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-green-900/20 sm:p-3"
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
                            <div className="truncate text-xs text-gray-500">
                              {item.address?.trim()
                                ? item.network || item.name
                                : 'Not configured by admin'}
                            </div>
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

                {(Number(coin.minDeposit) > 0 || Number(coin.maxDeposit) > 0) && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="mb-1 font-semibold text-blue-900 dark:text-blue-200">Deposit Limits</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {Number(coin.minDeposit) > 0 && `Minimum: ${coin.minDeposit} USDT`}
                      {Number(coin.maxDeposit) > 0 && `  Maximum: ${coin.maxDeposit} USDT`}
                    </p>
                  </div>
                )}

                {coin.address && (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-semibold">Scan QR Code to Deposit</p>
                      <div className="rounded-xl border-2 border-gray-200 bg-white p-3 dark:border-gray-700">
                        <QRCodeSVG value={coin.address} size={200} level="H" includeMargin />
                      </div>
                      <p className="text-xs text-gray-500">Scan with your wallet app</p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Wallet Address</label>
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                        <input
                          readOnly
                          value={coin.address}
                          className="flex-1 bg-transparent font-mono text-xs outline-none"
                        />
                        <button
                          onClick={copyAddress}
                          className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                          title="Copy address"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {coin.network && (
                        <p className="mt-1 text-xs text-gray-500">Network: {coin.network}</p>
                      )}
                      {copied && <p className="mt-1 text-xs text-emerald-500">Address copied to clipboard</p>}
                    </div>
                  </>
                )}

                {!coin.address && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    Deposit address is not configured for {coin.symbol} yet. Please try another coin or contact support.
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount (USDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount in USDT"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base font-semibold dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Payment Screenshot <span className="text-xs text-gray-400">(Optional)</span>
                  </label>
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 hover:border-green-500 dark:border-gray-600">
                    <Upload className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-sm">{screenshot ? screenshot.name : 'Click to upload screenshot'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        setScreenshot(file)
                        setPreview(file ? URL.createObjectURL(file) : null)
                      }}
                    />
                  </label>
                  {preview && (
                    <img src={preview} alt="" className="mt-2 max-h-48 w-full rounded-lg object-contain" />
                  )}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="mb-1.5 font-semibold text-amber-900 dark:text-amber-200">Important Notes</p>
                  <ul className="list-inside list-disc space-y-1 text-amber-800 dark:text-amber-300">
                    <li>Only send <strong>{coin.symbol}</strong> to this address</li>
                    <li>Double-check the address before sending</li>
                    <li>Your deposit will be reviewed by admin after submission</li>
                    <li>Processing may take a few minutes</li>
                  </ul>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {message && <p className="text-sm text-emerald-500">{message}</p>}

                <button
                  onClick={submit}
                  disabled={submitting || !amount || Number(amount) < 1}
                  className="w-full rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-md hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Deposit Request'}
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
