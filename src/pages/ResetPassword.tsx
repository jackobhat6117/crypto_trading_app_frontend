import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/authService'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordRequirements from '../components/auth/PasswordRequirements'
import { getPasswordValidationError, isStrongPassword } from '../utils/password'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const passwordError = getPasswordValidationError(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      navigate('/signin', { replace: true })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Verification failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Invalid Link"
        subtitle="This password reset link is missing or malformed"
        footer={
          <Link to="/forgot-password" className="font-medium text-indigo-600">
            Request a new link
          </Link>
        }
      >
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">
          Verification failed. The link may have expired.
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <PasswordRequirements password={password} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !isStrongPassword(password) || password !== confirmPassword}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  )
}
