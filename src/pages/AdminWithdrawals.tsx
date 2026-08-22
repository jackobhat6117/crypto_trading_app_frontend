import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { adminWithdrawalService, AdminWithdrawal } from '../services/adminPanelService'
import { FinanceStatus } from '../services/financeService'

const FILTERS: (FinanceStatus | 'all')[] = ['all', 'pending', 'approved', 'completed', 'rejected']

const STATUS_CLASS: Record<string, string> = {
  pending: 'text-amber-400',
  approved: 'text-sky-400',
  completed: 'text-emerald-400',
  rejected: 'text-red-400',
  cancelled: 'text-slate-400',
}

function shorten(value?: string, head = 10, tail = 8) {
  if (!value) return '—'
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function fakeTxId(id: string) {
  const hex = Array.from(id)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
  return `0x${(hex + hex).slice(0, 64)}`
}

function formatAmount(item: AdminWithdrawal) {
  const network = item.network && item.coin.toUpperCase() === 'USDT' ? ` ${item.network}` : ''
  return `${item.amount} ${item.coin}${network}`
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US')
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function coinLabel(item: AdminWithdrawal) {
  if (item.network && item.coin.toUpperCase() === 'USDT') return `${item.coin} ${item.network}`
  return item.coin
}

export default function AdminWithdrawals() {
  const [status, setStatus] = useState<FinanceStatus | 'all'>('all')
  const [rows, setRows] = useState<AdminWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [active, setActive] = useState<AdminWithdrawal | null>(null)
  const [txHash, setTxHash] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await adminWithdrawalService.list(status === 'all' ? undefined : status))
      setError('')
    } catch {
      setError('Failed to load withdrawal log')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const openManage = (item: AdminWithdrawal) => {
    setActive(item)
    setTxHash(item.txHash || '')
    setNotes(item.adminNotes || '')
  }

  const closeModal = () => {
    setActive(null)
    setTxHash('')
    setNotes('')
  }

  const runAction = async (action: 'approve' | 'reject' | 'complete') => {
    if (!active) return
    setBusy(true)
    try {
      if (action === 'approve') await adminWithdrawalService.approve(active._id, { txHash, notes })
      if (action === 'reject') await adminWithdrawalService.reject(active._id, { notes })
      if (action === 'complete') await adminWithdrawalService.complete(active._id, { txHash, notes })
      setToast(
        action === 'approve'
          ? 'Withdrawal approved'
          : action === 'reject'
            ? 'Withdrawal rejected'
            : 'Withdrawal completed'
      )
      window.setTimeout(() => setToast(''), 2800)
      closeModal()
      await load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const completeRow = async (item: AdminWithdrawal) => {
    setBusy(true)
    try {
      await adminWithdrawalService.complete(item._id)
      setToast('Withdrawal completed')
      window.setTimeout(() => setToast(''), 2800)
      await load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Failed to complete withdrawal')
    } finally {
      setBusy(false)
    }
  }

  const filtered = useMemo(() => rows, [rows])

  return (
    <div className="p-8">
      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <h1 className="mb-6 text-3xl font-bold text-white">Withdrawal Log</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              status === filter
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Coin</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
                  Loading withdrawals…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
                  No withdrawal requests
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.user?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{item.user?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{formatAmount(item)}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{coinLabel(item)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{shorten(item.address)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium capitalize ${STATUS_CLASS[item.status] || 'text-slate-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => openManage(item)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        Manage
                      </button>
                    )}
                    {item.status === 'approved' && (
                      <button
                        disabled={busy}
                        onClick={() => completeRow(item)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#151b2b] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{active.user?.name || 'User'}</p>
                <p className="text-sm text-slate-400">{active.user?.email}</p>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-2xl font-bold text-white">{formatAmount(active)}</p>

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Wallet Address</label>
            <input
              readOnly
              value={active.address}
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Deposit Address
            </label>
            <input
              readOnly
              value={active.depositAddress || '—'}
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Transaction ID
            </label>
            <textarea
              readOnly
              rows={2}
              value={active.txHash || fakeTxId(active._id)}
              className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  active.status === 'pending'
                    ? 'bg-amber-500/15 text-amber-400'
                    : STATUS_CLASS[active.status]
                }`}
              >
                {active.status}
              </span>
              <span className="text-xs text-slate-500">Created At: {formatDateTime(active.createdAt)}</span>
            </div>

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Transaction Hash (Optional)
            </label>
            <input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter transaction hash"
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Admin Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="mb-5 w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
            />

            {active.status === 'pending' && (
              <div className="mb-3 grid grid-cols-2 gap-3">
                <button
                  disabled={busy}
                  onClick={() => runAction('approve')}
                  className="rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
                >
                  {busy ? 'Saving…' : 'Approve'}
                </button>
                <button
                  disabled={busy}
                  onClick={() => runAction('reject')}
                  className="rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            )}

            {active.status === 'approved' && (
              <button
                disabled={busy}
                onClick={() => runAction('complete')}
                className="mb-3 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Complete'}
              </button>
            )}

            <button
              onClick={closeModal}
              className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-slate-200 hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
