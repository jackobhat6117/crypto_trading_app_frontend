import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { KycStatus, kycService } from '../services/kycService'
import { formatBalance } from '../utils/format'

const KYC_LABELS: Record<KycStatus, { label: string; tone: string }> = {
  not_submitted: { label: 'Not Verified', tone: 'text-gray-500' },
  pending: { label: 'Pending', tone: 'text-amber-500' },
  under_review: { label: 'Under Review', tone: 'text-amber-500' },
  approved: { label: 'Verified', tone: 'text-emerald-500' },
  rejected: { label: 'Rejected', tone: 'text-red-500' },
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [kycStatus, setKycStatus] = useState<KycStatus>('not_submitted')

  useEffect(() => {
    kycService
      .getStatus()
      .then((record) => setKycStatus(record?.status ?? 'not_submitted'))
      .catch(() => setKycStatus('not_submitted'))
  }, [])

  const kyc = KYC_LABELS[kycStatus]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name || user?.username || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400">ID: {user?.uniqueId || user?._id}</p>
          </div>
        </div>

        {[
          { label: 'Phone', value: user?.phone || '—' },
          {
            label: 'Balance',
            value: user?.balance != null ? `${formatBalance(user.balance)} USDT` : '—',
          },
          { label: 'Email Verified', value: user?.emailVerified ? 'Yes' : 'No' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between border-b border-gray-100 py-3 last:border-0 dark:border-gray-800">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">KYC Verification</h3>
          <span className={`text-sm font-medium ${kyc.tone}`}>{kyc.label}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {kycStatus === 'approved'
            ? 'Your identity is verified and all account features are unlocked.'
            : 'Complete verification to unlock full features.'}
        </p>
        {kycStatus !== 'approved' && (
          <button
            onClick={() => navigate('/kyc/verify')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            {kycStatus === 'not_submitted' ? 'Verify Now' : 'View Status'}
          </button>
        )}
      </div>
    </div>
  )
}
