import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/authService'
import PageHeader from '../components/layout/PageHeader'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

  const fields = [
    { label: 'Current Password', value: currentPassword, set: setCurrentPassword, placeholder: 'Enter your current password' },
    { label: 'New Password', value: newPassword, set: setNewPassword, placeholder: 'Enter new password (min 8 characters)' },
    { label: 'Confirm New Password', value: confirmPassword, set: setConfirmPassword, placeholder: 'Re-enter your new password' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Change Password"
        action={
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
            className="text-gray-400"
          >
            {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}
        {notice && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20">
            {notice}
          </div>
        )}
        {fields.map((field) => (
          <div key={field.label}>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
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
    </div>
  )
}
