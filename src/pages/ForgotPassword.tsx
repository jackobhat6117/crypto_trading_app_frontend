import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { authService } from '../services/authService'
import AuthLayout from '../components/auth/AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We sent a password reset link to your inbox"
        footer={
          <Link to="/signin" className="font-medium text-indigo-600">
            Back to Sign In
          </Link>
        }
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <MailCheck className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="mt-4 text-sm text-gray-500">
            If an account exists for <span className="font-medium text-gray-900 dark:text-white">{email}</span>, a
            reset link is on its way. The link expires in 1 hour.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remembered it?{' '}
          <Link to="/signin" className="font-medium text-indigo-600">
            Sign In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  )
}
