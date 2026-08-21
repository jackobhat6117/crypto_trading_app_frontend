import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { formatBalance } from '../utils/format'

const SUPPORT_LINKS = [
  { label: 'Help & Support', to: '/help-support' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'About Us', to: '/' },
  { label: 'Terms of Service', to: '/privacy-policy' },
]

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (newPassword.length < 8) {
      setError('Enter new password (min 8 characters)')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setNotice('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const passwordFields = [
    { label: 'Current Password', value: currentPassword, set: setCurrentPassword },
    { label: 'New Password', value: newPassword, set: setNewPassword },
    { label: 'Confirm New Password', value: confirmPassword, set: setConfirmPassword },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Account</p>
        <p className="font-medium">{user?.email}</p>
        <p className="mt-1 text-sm text-gray-500">
          Balance: {formatBalance(user?.balance ?? 0)} USDT
        </p>
      </div>

      <form
        onSubmit={changePassword}
        className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <h2 className="font-semibold">Change Password</h2>
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}
        {notice && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
            {notice}
          </div>
        )}
        {passwordFields.map((field) => (
          <div key={field.label}>
            <label className="mb-1 block text-sm text-gray-500">{field.label}</label>
            <input
              type="password"
              required
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Change Password'}
        </button>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Security</h2>
        <button
          onClick={() => navigate('/settings/2fa')}
          className="flex w-full items-center justify-between py-2 text-left"
        >
          Two-Factor Authentication
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
        <button
          onClick={() => navigate('/kyc/verify')}
          className="flex w-full items-center justify-between py-2 text-left"
        >
          KYC Verification
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Support &amp; Information</h2>
        {SUPPORT_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
          >
            {link.label}
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">App Information</h2>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500">Version</span>
          <span>1.0.0</span>
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500">Support</span>
          <a href="mailto:support@basetradedex.com" className="text-indigo-600">
            support@basetradedex.com
          </a>
        </div>
      </div>
    </div>
  )
}
