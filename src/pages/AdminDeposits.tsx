import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { adminDepositService, AdminDeposit } from '../services/adminPanelService'
import { FinanceStatus } from '../services/financeService'

const FILTERS: (FinanceStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected']

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-slate-500/15 text-slate-400',
}

function formatAmount(value?: number) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US')
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function AdminDeposits() {
  const [status, setStatus] = useState<FinanceStatus | 'all'>('all')
  const [rows, setRows] = useState<AdminDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [active, setActive] = useState<AdminDeposit | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await adminDepositService.list(status === 'all' ? undefined : status))
      setError('')
    } catch {
      setError('Failed to load deposit log')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const openDetails = (item: AdminDeposit) => {
    setActive(item)
    setNotes(item.adminNotes || '')
  }

  const closeModal = () => {
    setActive(null)
    setNotes('')
  }

  const runAction = async (action: 'approve' | 'reject') => {
    if (!active) return
    setBusy(true)
    try {
      if (action === 'approve') await adminDepositService.approve(active._id, { notes })
      if (action === 'reject') await adminDepositService.reject(active._id, { notes })
      setToast(
        action === 'approve'
          ? 'Deposit approved — user balance credited'
          : 'Deposit rejected'
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

      <h1 className="mb-6 text-3xl font-bold text-white">Deposit Log</h1>

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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
                  Loading deposits…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
                  No deposit requests
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.user?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{item.user?.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-400">
                    +{formatAmount(item.amount)} USDT
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        STATUS_CLASS[item.status] || 'text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium lowercase text-emerald-400">{item.type}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-300">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetails(item)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      View
                    </button>
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{active.description}</h2>
              <button onClick={closeModal} className="shrink-0 text-slate-500 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-white">{active.user?.name || '—'}</p>
              <p className="text-xs text-slate-500">{active.user?.email || '—'}</p>
            </div>

            <p className="mb-4 text-2xl font-bold text-emerald-400">+{formatAmount(active.amount)} USDT</p>

            <div className="mb-3">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold lowercase text-emerald-400">
                {active.type}
              </span>
            </div>

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Deposit Address (Fake)
            </label>
            <input
              readOnly
              value={active.depositAddress || '—'}
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Transaction ID (Fake)
            </label>
            <textarea
              readOnly
              rows={2}
              value={active.transactionId || active.txHash || '—'}
              className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Wallet Address</label>
            <input
              readOnly
              value={active.walletAddress || '—'}
              className="mb-3 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 font-mono text-xs text-slate-200"
            />

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Balance Before</p>
                <p className="text-sm text-white">{formatAmount(active.balanceBefore)} USDT</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Balance After</p>
                <p className="text-sm text-white">{formatAmount(active.balanceAfter)} USDT</p>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  STATUS_CLASS[active.status] || 'text-slate-400'
                }`}
              >
                {active.status}
              </span>
              <span className="text-xs text-slate-500">Created At: {formatDateTime(active.createdAt)}</span>
            </div>

            {active.screenshot && (
              <div className="mb-4">
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Proof</p>
                <img
                  src={active.screenshot}
                  alt="Deposit proof"
                  className="max-h-48 rounded-lg border border-white/10"
                />
              </div>
            )}

            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Admin Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              readOnly={active.status !== 'pending'}
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
