import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { transferService } from '../services/financeService'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/layout/PageHeader'
import StatusBadge from '../components/admin/StatusBadge'
import { formatBalance } from '../utils/format'

interface RecipientMatch {
  _id: string
  email: string
  name?: string
  username?: string
  uniqueId?: string
}

interface TransferRecord {
  _id: string
  amount: number
  fee?: number
  status: string
  recipientEmail?: string
  createdAt: string
}

export default function TransfersPage() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState<'transfer' | 'history'>('transfer')
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<RecipientMatch[]>([])
  const [recipient, setRecipient] = useState<RecipientMatch | null>(null)
  const [amount, setAmount] = useState('')
  const [history, setHistory] = useState<TransferRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadHistory = useCallback(() => {
    transferService.getHistory().then(setHistory).catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  // Debounced so typing an email doesn't fire a request per keystroke.
  useEffect(() => {
    if (recipient || query.trim().length < 3) {
      setMatches([])
      return
    }
    const timeout = setTimeout(() => {
      transferService
        .searchUsers(query.trim())
        .then(setMatches)
        .catch(() => setMatches([]))
    }, 400)
    return () => clearTimeout(timeout)
  }, [query, recipient])

  const balance = user?.balance ?? 0
  const value = Number(amount) || 0

  const handleTransfer = async () => {
    if (!recipient) {
      setError('Select a recipient first')
      return
    }
    if (value <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (value > balance) {
      setError('Amount exceeds your available balance.')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await transferService.create({ recipientId: recipient._id, recipient: recipient.email, amount: value })
      setMessage('Transfer completed successfully')
      setAmount('')
      setRecipient(null)
      setQuery('')
      await refreshUser()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Transfers" />

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['transfer', 'history'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === option ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'
            }`}
          >
            {option === 'transfer' ? 'Transfer' : 'Transfer History'}
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
            No transfers found
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record) => (
              <div
                key={record._id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{formatBalance(record.amount)} USDT</p>
                    {record.recipientEmail && (
                      <p className="truncate text-xs text-gray-500">To {record.recipientEmail}</p>
                    )}
                    <p className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
              </div>
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
            <label className="mb-1 block text-sm text-gray-500">Recipient ID or Email</label>
            {recipient ? (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-indigo-600 bg-indigo-50 px-3 py-3 dark:bg-indigo-900/20">
                <div>
                  <p className="font-medium">{recipient.name || recipient.username || recipient.email}</p>
                  <p className="text-xs text-gray-500">{recipient.email}</p>
                </div>
                <button onClick={() => setRecipient(null)} className="text-xs text-red-500">
                  Change
                </button>
              </div>
            ) : (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by email or user ID"
                  className="w-full rounded-lg border py-2 pl-10 pr-3 dark:border-gray-700 dark:bg-gray-800"
                />
                {matches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {matches.map((match) => (
                      <button
                        key={match._id}
                        onClick={() => {
                          setRecipient(match)
                          setMatches([])
                        }}
                        className="block w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <p className="text-sm font-medium">{match.name || match.username || match.email}</p>
                        <p className="text-xs text-gray-500">
                          {match.email}
                          {match.uniqueId ? ` · ID: ${match.uniqueId}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
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
                placeholder="0.00"
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="mb-4 flex justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <span className="text-gray-500">Transfer Fee</span>
              <span className="font-medium">0.00 USDT</span>
            </div>

            <button
              disabled={loading}
              onClick={handleTransfer}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
