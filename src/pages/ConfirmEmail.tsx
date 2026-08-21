import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { authService } from '../services/authService'
import AuthLayout from '../components/auth/AuthLayout'

type State = 'verifying' | 'success' | 'failed'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [state, setState] = useState<State>(token ? 'verifying' : 'failed')
  const [message, setMessage] = useState('')
  const [resent, setResent] = useState(false)
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
    try {
      await authService.resendVerification(email || undefined)
      setResent(true)
    } catch {
      setMessage('Could not resend the verification email. Please try again.')
    }
  }

  return (
    <AuthLayout
      title={state === 'success' ? 'Email Verified' : 'Confirm Email'}
      subtitle={state === 'verifying' ? 'Verifying your email address' : undefined}
      footer={
        <Link to="/signin" className="font-medium text-indigo-600">
          Continue to Sign In
        </Link>
      }
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
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
                className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Resend Verification Email
              </button>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
