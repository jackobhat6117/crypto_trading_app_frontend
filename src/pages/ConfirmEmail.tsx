import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react'
import { authService } from '../services/authService'
import AuthLayout from '../components/auth/AuthLayout'

type State = 'pending' | 'verifying' | 'success' | 'failed'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const pending = searchParams.get('pending') === '1'
  const emailFailed = searchParams.get('emailFailed') === '1'

  const [state, setState] = useState<State>(() => {
    if (token) return 'verifying'
    if (pending) return 'pending'
    return 'failed'
  })
  const [message, setMessage] = useState('')
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)
  // React 18 StrictMode double-invokes effects; verification tokens are single-use.
  const verified = useRef(false)

  useEffect(() => {
    if (!token || verified.current) return
    verified.current = true
    authService
      .verifyEmail(token)
      .then((data) => {
        setState('success')
        setMessage(data?.message ?? '')
      })
      .catch((err: unknown) => {
        const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setState('failed')
        setMessage(detail || 'Verification failed. The link may have expired.')
      })
  }, [token])

  const handleResend = async () => {
    if (!email) {
      setMessage('Enter your email on the sign-in page, then try signing in to resend verification.')
      return
    }
    setResending(true)
    try {
      await authService.resendVerification(email)
      setResent(true)
      setMessage('')
    } catch {
      setMessage('Could not resend the verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title={
        state === 'success'
          ? 'Email Verified'
          : state === 'pending'
            ? 'Check Your Email'
            : 'Confirm Email'
      }
      subtitle={
        state === 'verifying'
          ? 'Verifying your email address'
          : state === 'pending'
            ? 'We sent you a verification link'
            : undefined
      }
      footer={
        <Link to="/signin" className="font-medium text-indigo-600">
          Continue to Sign In
        </Link>
      }
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        {state === 'pending' && (
          <>
            <Mail className="mx-auto h-12 w-12 text-indigo-500" />
            {emailFailed && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                We could not deliver the verification email yet. Try resend below once email delivery is configured, or contact support.
              </p>
            )}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              We sent a verification link to{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{email || 'your email'}</span>.
              Click the link in that email to activate your account.
            </p>
            <p className="mt-2 text-xs text-gray-500">The link expires in 24 hours.</p>
            {resent ? (
              <p className="mt-4 text-sm text-emerald-500">A new verification email has been sent.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {resending ? 'Sending…' : 'Resend Verification Email'}
              </button>
            )}
            {message && <p className="mt-3 text-sm text-red-500">{message}</p>}
          </>
        )}
        {state === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
            <p className="mt-4 text-sm text-gray-500">Authenticating...</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-sm text-gray-500">
              {message || 'Your email address has been confirmed. You can now sign in.'}
            </p>
          </>
        )}
        {state === 'failed' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-2 font-medium text-gray-900 dark:text-white">Verification Failed</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
            {resent ? (
              <p className="mt-4 text-sm text-emerald-500">A new verification email has been sent.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {resending ? 'Sending…' : 'Resend Verification Email'}
              </button>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
