import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WithdrawalRecord, WithdrawalSettings, withdrawalService } from '../services/financeService'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/layout/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import { formatBalance } from '../utils/format'

export default function WithdrawalsPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState<'withdraw' | 'history'>('withdraw')
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null)
  const [history, setHistory] = useState<WithdrawalRecord[]>([])
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    withdrawalService
      .getSettings()
      .then(setSettings)
      .catch(() => setError('Unable to verify withdrawal eligibility. Please try again.'))
  }, [])

  const loadHistory = useCallback(() => {
    withdrawalService.getHistory().then(setHistory).catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  const value = Number(amount) || 0
  const fee = settings
    ? settings.feeType === 'percentage'
      ? (value * settings.fee) / 100
      : settings.fee
    : 0
  const netAmount = Math.max(0, value - fee)
  const balance = user?.balance ?? 0

  const handleWithdraw = async () => {
    if (!settings?.allowWithdraw) {
      setError('Withdrawals are currently disabled on your account.')
      return
    }
    if (settings.minWithdrawal && value < settings.minWithdrawal) {
      setError(`Minimum Withdrawal Amount (USDT): ${settings.minWithdrawal}`)
      return
    }
    if (settings.maxWithdrawal && value > settings.maxWithdrawal) {
      setError(`Maximum Withdrawal Amount (USDT): ${settings.maxWithdrawal}`)
      return
    }
    if (value > balance) {
      setError('Amount exceeds your available balance.')
      return
    }
    if (!address.trim()) {
      setError('Enter your wallet address')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await withdrawalService.create({ amount: value, address: address.trim() })
      setMessage('Withdrawal request submitted successfully!')
      setAmount('')
      setAddress('')
      await refreshUser()
      const id = response?.withdrawal?._id ?? response?._id
      if (id) navigate(`/withdrawal/${id}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to create withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Withdrawals" />

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['withdraw', 'history'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === option ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'
            }`}
          >
            {option === 'withdraw' ? 'Withdraw Funds' : 'Withdrawal History'}
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
            No withdrawals found
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record) => (
              <button
                key={record._id}
                onClick={() => navigate(`/withdrawal/${record._id}`)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{formatBalance(record.amount)} USDT</p>
                    <p className="truncate text-xs text-gray-500">{record.address}</p>
                    <p className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold">{formatBalance(balance)} USDT</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm text-gray-500">Amount (USDT)</label>
                <button onClick={() => setAmount(String(balance))} className="text-xs text-indigo-600">
                  Max
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={settings ? `Min ${settings.minWithdrawal}` : '0.00'}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm text-gray-500">Wallet Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your wallet address"
                className="w-full rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {settings && (
              <div className="mb-4 space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Withdrawal (USDT)</span>
                  <span>{formatBalance(settings.minWithdrawal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Withdrawal (USDT)</span>
                  <span>{settings.maxWithdrawal ? formatBalance(settings.maxWithdrawal) : 'No limit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Withdrawal Fee</span>
                  <span>
                    {settings.feeType === 'percentage'
                      ? `${settings.fee}% (${formatBalance(fee)} USDT)`
                      : `${formatBalance(settings.fee)} USDT`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-medium dark:border-gray-700">
                  <span>You Receive</span>
                  <span>{formatBalance(netAmount)} USDT</span>
                </div>
              </div>
            )}

            <button
              disabled={loading || !settings?.allowWithdraw}
              onClick={handleWithdraw}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
            {settings && !settings.allowWithdraw && (
              <p className="mt-2 text-center text-xs text-red-500">
                Withdrawals are currently disabled on your account.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
