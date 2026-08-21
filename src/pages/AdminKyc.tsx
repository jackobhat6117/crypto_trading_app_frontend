import { useCallback, useEffect, useState } from 'react'
import { adminKycService } from '../services/adminPanelService'
import { DOCUMENT_TYPE_LABELS, KycRecord, KycSettings, KycStatus } from '../services/kycService'
import { resolveMediaUrl } from '../utils/mediaUrl'
import StatusBadge from '../components/admin/StatusBadge'

const STATUS_FILTERS: (KycStatus | 'all')[] = ['all', 'pending', 'under_review', 'approved', 'rejected']

export default function AdminKyc() {
  const [tab, setTab] = useState<'log' | 'settings'>('log')
  const [status, setStatus] = useState<KycStatus | 'all'>('pending')
  const [records, setRecords] = useState<KycRecord[]>([])
  const [selected, setSelected] = useState<KycRecord | null>(null)
  const [settings, setSettings] = useState<KycSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await adminKycService.list(status === 'all' ? undefined : status))
    } catch {
      setError('Failed to load KYC submissions')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (tab === 'log') load()
  }, [tab, load])

  useEffect(() => {
    if (tab !== 'settings' || settings) return
    adminKycService
      .getSettings()
      .then(setSettings)
      .catch(() => setError('KYC settings not loaded'))
  }, [tab, settings])

  const approve = async (record: KycRecord) => {
    try {
      await adminKycService.approve(record._id)
      setNotice('KYC approved successfully')
      setSelected(null)
      await load()
    } catch {
      setError('Failed to approve KYC')
    }
  }

  const reject = async (record: KycRecord) => {
    const reason = window.prompt('Reason for rejection:')
    if (!reason) return
    try {
      await adminKycService.reject(record._id, reason)
      setNotice('KYC rejected')
      setSelected(null)
      await load()
    } catch {
      setError('Failed to reject KYC')
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    try {
      await adminKycService.updateSettings(settings)
      setNotice('KYC settings updated successfully')
    } catch {
      setError('Failed to update KYC settings')
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">KYC Verification</h1>
      <p className="mb-6 text-sm text-slate-400">Review identity submissions and configure requirements</p>

      <div className="mb-6 flex gap-2 border-b border-white/5">
        {(['log', 'settings'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === value ? 'border-b-2 border-red-400 text-red-400' : 'text-slate-400'
            }`}
          >
            {value === 'log' ? 'KYC Log' : 'KYC Settings'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      {tab === 'log' ? (
        <>
          <div className="mb-4 flex gap-2">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                  status === value ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-slate-400'
                }`}
              >
                {value.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record._id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 font-medium text-white">{record.fullName || '—'}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {record.documentType ? DOCUMENT_TYPE_LABELS[record.documentType] : '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-400">{record.country || '—'}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {record.submittedAt ? new Date(record.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={record.status.replace('_', ' ')} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelected(record)}
                          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                        >
                          KYC Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="max-w-lg rounded-xl border border-white/5 bg-[#111827] p-6">
          {!settings ? (
            <p className="text-sm text-slate-500">Loading settings...</p>
          ) : (
            <>
              <label className="mb-4 flex items-center justify-between text-sm text-slate-300">
                Require KYC verification
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
              </label>
              <label className="mb-4 flex items-center justify-between text-sm text-slate-300">
                Require selfie
                <input
                  type="checkbox"
                  checked={settings.requireSelfie}
                  onChange={(e) => setSettings({ ...settings, requireSelfie: e.target.checked })}
                />
              </label>
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Accepted documents</p>
              <div className="mb-5 space-y-2">
                {(Object.keys(DOCUMENT_TYPE_LABELS) as (keyof typeof DOCUMENT_TYPE_LABELS)[]).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.acceptedDocuments.includes(type)}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          acceptedDocuments: e.target.checked
                            ? [...settings.acceptedDocuments, type]
                            : settings.acceptedDocuments.filter((d) => d !== type),
                        })
                      }
                    />
                    {DOCUMENT_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
              <button
                onClick={saveSettings}
                className="w-full rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white"
              >
                Save Settings
              </button>
            </>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-bold text-white">KYC Details</h2>
            {[
              { label: 'Full Name', value: selected.fullName },
              { label: 'Date of Birth', value: selected.dateOfBirth },
              { label: 'Address', value: selected.address },
              { label: 'City', value: selected.city },
              { label: 'Postal Code', value: selected.postalCode },
              { label: 'Country', value: selected.country },
              {
                label: 'Document Type',
                value: selected.documentType ? DOCUMENT_TYPE_LABELS[selected.documentType] : undefined,
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between border-b border-white/5 py-2 text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-white">{row.value || '—'}</span>
              </div>
            ))}

            <div className="mt-4 flex gap-3">
              {[selected.documentFront, selected.documentBack, selected.selfie]
                .filter(Boolean)
                .map((src) => (
                  <a key={src} href={resolveMediaUrl(src!)} target="_blank" rel="noreferrer">
                    <img src={resolveMediaUrl(src!)} alt="" className="h-24 rounded-lg object-cover" />
                  </a>
                ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-300"
              >
                Close
              </button>
              {selected.status !== 'approved' && (
                <>
                  <button
                    onClick={() => reject(selected)}
                    className="flex-1 rounded-lg bg-red-500/20 py-2.5 text-sm font-medium text-red-400"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approve(selected)}
                    className="flex-1 rounded-lg bg-emerald-500/90 py-2.5 text-sm font-medium text-white"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
