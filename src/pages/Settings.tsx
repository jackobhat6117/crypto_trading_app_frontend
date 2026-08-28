import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  KeyRound,
  ShieldCheck,
  BadgeCheck,
  HelpCircle,
  FileText,
  Info,
  ScrollText,
  Mail,
  Tag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { formatBalance } from '../utils/format'

const SUPPORT_LINKS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Help & Support', to: '/help-support', icon: HelpCircle },
  { label: 'Privacy Policy', to: '/privacy-policy', icon: FileText },
  { label: 'About Us', to: '/', icon: Info },
  { label: 'Terms of Service', to: '/privacy-policy', icon: ScrollText },
]

const SECURITY_LINKS: { label: string; path: string; icon: LucideIcon }[] = [
  { label: 'Change Password', path: '/settings/change-password', icon: KeyRound },
  { label: 'Two-Factor Authentication', path: '/settings/2fa', icon: ShieldCheck },
  { label: 'KYC Verification', path: '/kyc/verify', icon: BadgeCheck },
]

function SettingsRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-gray-100 py-3 text-left last:border-0 dark:border-gray-800"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
    </button>
  )
}

function SettingsLink({
  icon: Icon,
  label,
  to,
}: {
  icon: LucideIcon
  label: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
    </Link>
  )
}

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
    if (!newPassword.trim()) {
      setError('Please enter a new password')
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
        <h2 className="mb-1 font-semibold">Security</h2>
        {SECURITY_LINKS.map((item) => (
          <SettingsRow
            key={item.path}
            icon={item.icon}
            label={item.label}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 font-semibold">Support &amp; Information</h2>
        {SUPPORT_LINKS.map((link) => (
          <SettingsLink key={link.label} icon={link.icon} label={link.label} to={link.to} />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 font-semibold">App Information</h2>
        <div className="flex items-center justify-between border-b border-gray-100 py-3 dark:border-gray-800">
          <span className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <Tag className="h-4 w-4" />
            </span>
            Version
          </span>
          <span className="text-sm">1.0.0</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            Support
          </span>
          <a href="mailto:support@basetradedex.com" className="text-sm text-indigo-600">
            support@basetradedex.com
          </a>
        </div>
      </div>
    </div>
  )
}
