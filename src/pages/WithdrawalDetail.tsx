import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { FinanceStatus, WithdrawalRecord, withdrawalService } from '../services/financeService'
import PageHeader from '../components/layout/PageHeader'
import { formatBalance } from '../utils/format'

const STATUS_COPY: Record<FinanceStatus, { title: string; body: string; tone: 'pending' | 'good' | 'bad' }> = {
  pending: {
    title: 'Withdrawal Pending',
    body: 'Your withdrawal request is being reviewed by our team.',
    tone: 'pending',
  },
  approved: {
    title: 'Withdrawal Approved',
    body: 'Your withdrawal has been approved and is being processed.',
    tone: 'good',
  },
  completed: {
    title: 'Withdrawal Completed',
    body: 'Your withdrawal has been completed successfully.',
    tone: 'good',
  },
  rejected: {
    title: 'Withdrawal Rejected',
    body: 'This withdrawal was rejected and the amount has been refunded to your balance.',
    tone: 'bad',
  },
  cancelled: {
    title: 'Withdrawal Cancelled',
    body: 'You cancelled this withdrawal request.',
    tone: 'bad',
  },
}

const TIMELINE: FinanceStatus[] = ['pending', 'approved', 'completed']

export default function WithdrawalDetail() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<WithdrawalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    withdrawalService
      .getById(id)
      .then(setRecord)
      .catch(() => setError('Failed to load withdrawal details'))
      .finally(() => setLoading(false))
  }, [id])

  const cancel = async () => {
    if (!id || !window.confirm('Cancel this withdrawal request?')) return
    setBusy(true)
    try {
      await withdrawalService.cancel(id)
      setRecord(await withdrawalService.getById(id))
    } catch {
      setError('Failed to cancel withdrawal')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Withdrawal Details" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Loading withdrawal details...
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <PageHeader title="Withdrawal Details" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          {error || 'Withdrawal not found'}
        </div>
      </div>
    )
  }

  const copy = STATUS_COPY[record.status]
  const currentStep = TIMELINE.indexOf(record.status)
  const terminated = record.status === 'rejected' || record.status === 'cancelled'
  const fee = record.fee ?? 0
  const netAmount = record.netAmount ?? record.amount - fee

  return (
    <div className="space-y-4">
      <PageHeader title="Withdrawal Details" />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        {copy.tone === 'good' && <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />}
        {copy.tone === 'pending' && <Clock className="mx-auto h-14 w-14 text-amber-500" />}
        {copy.tone === 'bad' && <XCircle className="mx-auto h-14 w-14 text-red-500" />}
        <h2 className="mt-4 text-lg font-bold">{copy.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{copy.body}</p>
        <p className="mt-4 text-3xl font-bold">{formatBalance(netAmount)} USDT</p>
      </div>

      {!terminated && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          {TIMELINE.map((stage, index) => {
            const reached = index <= currentStep
            return (
              <div key={stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      reached ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800'
                    }`}
                  >
                    {reached && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  {index < TIMELINE.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 ${
                        index < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-6 ${index === TIMELINE.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`font-medium capitalize ${reached ? '' : 'text-gray-400'}`}>{stage}</p>
                  <p className="text-xs text-gray-500">
                    {stage === 'pending' && new Date(record.createdAt).toLocaleString()}
                    {stage === 'approved' && record.approvedAt && new Date(record.approvedAt).toLocaleString()}
                    {stage === 'completed' && record.completedAt && new Date(record.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 font-semibold">Withdrawal Information</h3>
        {[
          { label: 'Amount', value: `${formatBalance(record.amount)} USDT` },
          { label: 'Withdrawal Fee', value: `${formatBalance(fee)} USDT` },
          { label: 'You Receive', value: `${formatBalance(netAmount)} USDT` },
          { label: 'Network', value: record.network || '—' },
          { label: 'Requested', value: new Date(record.createdAt).toLocaleString() },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
          >
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        <div className="pt-3">
          <p className="text-gray-500">Address</p>
          <p className="mt-1 break-all font-mono text-sm">{record.address}</p>
        </div>
      </div>

      {record.adminNotes && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-1 font-semibold">Admin Notes</h3>
          <p className="text-sm text-gray-500">{record.adminNotes}</p>
        </div>
      )}

      {record.status === 'pending' && (
        <button
          onClick={cancel}
          disabled={busy}
          className="w-full rounded-xl border border-red-200 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-900/20"
        >
          {busy ? 'Submitting...' : 'Cancel Withdrawal'}
        </button>
      )}
    </div>
  )
}
