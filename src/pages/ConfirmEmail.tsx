import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'

const CODE_LENGTH = 6

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const email = searchParams.get('email') ?? ''
  const emailFailed = searchParams.get('emailFailed') === '1'

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (value: string) => {
    if (!email) {
      setError('We could not determine your email. Please sign in to resend a code.')
      return
    }
    if (value.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email.`)
      return
    }
    setError('')
    setVerifying(true)
    try {
      const signedIn = await verifyEmail(email, value)
      setSuccess(true)
      // Newly verified users are already signed in — drop them on the dashboard.
      // Already-verified accounts fall back to the sign-in page.
      setMessage(signedIn ? 'Email verified. Taking you to your dashboard…' : '')
      setTimeout(() => navigate(signedIn ? '/dashboard' : '/signin', { replace: true }), 1200)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'That code is invalid or has expired. Request a new one below.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(code)
  }

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    setError('')
    if (digits.length === CODE_LENGTH) submit(digits)
  }

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email on the sign-in page, then try signing in to resend a code.')
      return
    }
    setResending(true)
    setError('')
    try {
      await authService.resendVerification(email)
      setResent(true)
      setCode('')
    } catch {
      setError('Could not resend the verification code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title={success ? 'Email Verified' : 'Confirm Email'}
      subtitle={success ? undefined : 'Enter the code we emailed you'}
      footer={
        <Link to="/signin" className="font-medium text-indigo-600">
          Continue to Sign In
        </Link>
      }
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        {success ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-sm text-gray-500">
              {message || 'Your email address has been confirmed. Redirecting to sign in…'}
            </p>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-12 w-12 text-indigo-500" />
            {emailFailed && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                We could not deliver the verification email yet. Use resend below, or contact support.
              </p>
            )}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              We sent a {CODE_LENGTH}-digit code to{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{email || 'your email'}</span>.
            </p>
            <p className="mt-1 text-xs text-gray-500">The code expires in 20 minutes.</p>

            <form onSubmit={handleSubmit} className="mt-5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                maxLength={CODE_LENGTH}
              />
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={verifying || code.length !== CODE_LENGTH}
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {verifying ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              {resent ? (
                <p className="text-emerald-500">A new verification code has been sent.</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                >
                  {resending ? 'Sending…' : "Didn't get a code? Resend"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
