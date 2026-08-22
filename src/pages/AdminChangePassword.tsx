import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { authService } from '../services/authService'

export default function AdminChangePassword() {
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
      setError('Enter a new password (min 8 characters)')
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
    {
      label: 'Current Password',
      value: currentPassword,
      set: setCurrentPassword,
      placeholder: 'Enter your current password',
    },
    {
      label: 'New Password',
      value: newPassword,
      set: setNewPassword,
      placeholder: 'Enter new password (min 8 characters)',
    },
    {
      label: 'Confirm New Password',
      value: confirmPassword,
      set: setConfirmPassword,
      placeholder: 'Re-enter your new password',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
          <KeyRound size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Change Password</h1>
          <p className="text-sm text-slate-400">Update the password for your admin account</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-xl border border-white/5 bg-[#111827] p-6"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>
        </div>

        {fields.map((field) => (
          <div key={field.label} className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">{field.label}</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/60"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
