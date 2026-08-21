import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Upload } from 'lucide-react'
import { coinService } from '../services/marketDataService'
import { DepositRecord, depositService } from '../services/financeService'
import { Coin } from '../types'
import { resolveMediaUrl } from '../utils/mediaUrl'
import PageHeader from '../components/layout/PageHeader'
import { formatBalance } from '../utils/format'
import StatusBadge from '../components/admin/StatusBadge'

type Stage = 'select' | 'submit'

export default function DepositsPage() {
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit')
  const [coins, setCoins] = useState<Coin[]>([])
  const [selected, setSelected] = useState<Coin | null>(null)
  const [amount, setAmount] = useState('')
  const [stage, setStage] = useState<Stage>('select')
  const [deposit, setDeposit] = useState<DepositRecord | null>(null)
  const [txHash, setTxHash] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [history, setHistory] = useState<DepositRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<number>()

  useEffect(() => {
    coinService.getCoins().then(setCoins).catch(() => setCoins([]))
  }, [])

  const loadHistory = useCallback(() => {
    depositService.getHistory().then(setHistory).catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  // A hosted-checkout deposit settles out of band, so poll until the provider confirms.
  useEffect(() => {
    if (!deposit?.paymentId) return
    pollRef.current = window.setInterval(async () => {
      try {
        const status = await depositService.getPaymentStatus(deposit.paymentId!)
        if (status?.status === 'completed' || status?.status === 'approved') {
          setMessage('Payment confirmed! Your balance has been updated.')
          window.clearInterval(pollRef.current)
        }
      } catch {
        // Transient polling failures are expected; the next tick retries.
      }
    }, 10000)
    return () => window.clearInterval(pollRef.current)
  }, [deposit?.paymentId])

  const minDeposit = selected?.minDeposit ?? 10
  const maxDeposit = selected?.maxDeposit ?? 0

  const createDeposit = async () => {
    if (!selected) return
    const value = Number(amount)
    if (!value || value < minDeposit) {
      setError(`Minimum deposit is ${minDeposit} USDT`)
      return
    }
    if (maxDeposit > 0 && value > maxDeposit) {
      setError(`Maximum deposit is ${maxDeposit} USDT`)
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await depositService.create(selected._id, value)
      const record: DepositRecord = response.deposit ?? response.payment ?? response
      setDeposit(record)

      const paymentUrl = record.paymentUrl ?? response.paymentUrl ?? response.invoice_url
      if (paymentUrl) {
        const popup = window.open(paymentUrl, '_blank')
        if (!popup && window.confirm('Popup blocked. Redirect to payment page in this window?')) {
          window.location.href = paymentUrl
          return
        }
      }
      setStage('submit')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Error creating payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitDeposit = async () => {
    if (!deposit) return
    setError('')
    setLoading(true)
    try {
      await depositService.submit(deposit._id, txHash || undefined, screenshot ?? undefined)
      setMessage('Your deposit will be reviewed by admin after submission')
      setStage('select')
      setDeposit(null)
      setAmount('')
      setTxHash('')
      setScreenshot(null)
      loadHistory()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to submit deposit request')
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = async () => {
    const address = deposit?.address ?? selected?.address
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const address = deposit?.address ?? selected?.address

  return (
    <div className="space-y-4">
      <PageHeader title="Deposits" />

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['deposit', 'history'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === value ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'
            }`}
          >
            {value === 'deposit' ? 'Deposit' : 'Deposit History'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
      )}
      {message && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
          {message}
        </div>
      )}

      {tab === 'history' ? (
        history.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            No deposits found
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record) => (
              <div
                key={record._id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {formatBalance(record.amount)} {record.coin ?? 'USDT'}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                {record.txHash && (
                  <p className="mt-2 break-all font-mono text-xs text-gray-500">{record.txHash}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : stage === 'select' ? (
        <>
          <div className="grid gap-3">
            {coins.map((coin) => (
              <button
                key={coin._id}
                onClick={() => setSelected(coin)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left ${selected?._id === coin._id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800'}`}
              >
                <div className="flex items-center gap-3">
                  {coin.image && <img src={resolveMediaUrl(coin.image)} alt="" className="h-8 w-8 rounded-full" />}
                  <div>
                    <p className="font-medium">{coin.symbol}</p>
                    <p className="text-xs text-gray-500">
                      Min: {coin.minDeposit ?? 10}
                      {coin.maxDeposit ? ` · Max: ${coin.maxDeposit}` : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-1 block text-sm text-gray-500">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${minDeposit}`}
                className="mb-4 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                disabled={loading}
                onClick={createDeposit}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Creating Payment...' : 'Continue to Payment'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-1 font-semibold">Complete Your Payment</h2>
            <p className="text-sm text-gray-500">
              Send exactly {formatBalance(Number(amount))} {selected?.symbol} to the address below.
            </p>

            {address && (
              <>
                <div className="my-4 flex justify-center rounded-xl bg-white p-4">
                  <QRCodeSVG value={address} size={180} />
                </div>
                <p className="mb-1 text-center text-xs text-gray-500">Scan QR Code to Deposit</p>
                <label className="mb-1 mt-4 block text-sm text-gray-500">Deposit Address</label>
                <button
                  onClick={copyAddress}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-left font-mono text-xs dark:border-gray-700 dark:bg-gray-800"
                >
                  <span className="break-all">{address}</span>
                  <Copy className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
                {copied && <p className="mt-1 text-xs text-emerald-500">Copied to clipboard</p>}
              </>
            )}

            {deposit?.network && (
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-500">Network</span>
                <span className="font-medium">{deposit.network}</span>
              </div>
            )}
            {deposit?.paymentId && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono text-xs">{deposit.paymentId}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 font-semibold">Submit Deposit Request</h2>
            <label className="mb-1 block text-sm text-gray-500">Transaction Hash</label>
            <input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste the transaction hash"
              className="mb-3 w-full rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
            />

            <label className="mb-1 block text-sm text-gray-500">Payment Screenshot</label>
            <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-700">
              {screenshot ? (
                <img src={URL.createObjectURL(screenshot)} alt="" className="h-24 rounded-lg object-cover" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Tap to upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              />
            </label>

            <p className="mb-3 text-xs text-gray-500">
              Your deposit will be reviewed by admin after submission
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStage('select')
                  setDeposit(null)
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold dark:border-gray-700"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={submitDeposit}
                className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
