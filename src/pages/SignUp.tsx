import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import BrandLogo from '../components/BrandLogo'
import clsx from 'clsx'
import { DEFAULT_PHONE_COUNTRY, findPhoneCountry, PHONE_COUNTRIES } from '../utils/countries'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:px-4 sm:py-3 sm:text-base'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

export default function SignUp() {
  const { signup } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailContinue = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setStep(2)
  }

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const fullPhone = phone.trim() ? `${country.dial}${phone.replace(/\s+/g, '')}` : undefined
      const result = await signup(email.trim(), password, name.trim() || undefined, fullPhone)
      if (result.kind === 'verification') {
        const params = new URLSearchParams({ pending: '1', email: result.email })
        if (result.emailSent === false) params.set('emailFailed', '1')
        navigate(`/confirm-email?${params.toString()}`)
        return
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const socialUnavailable = () => {
    setNotice('Social sign-up is not available yet. Continue with email.')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 px-3 py-8 font-sans antialiased dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40 sm:px-4 sm:py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        <button
          onClick={toggleTheme}
          className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center sm:mb-8">
          <BrandLogo size="lg" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xl shadow-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 sm:rounded-2xl sm:p-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:mb-2 sm:text-3xl">
            Create Account
          </h1>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:mb-6 sm:text-base">
            Sign up to start trading today
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
              {notice}
            </div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleEmailContinue} className="mb-4 space-y-4 sm:mb-6">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:py-3 sm:text-base"
                >
                  Continue
                </button>
              </form>

              <div className="space-y-2 sm:space-y-3">
                <button
                  type="button"
                  onClick={socialUnavailable}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:scale-[1.02] hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:space-x-3 sm:py-3 sm:text-base"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  onClick={socialUnavailable}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-black py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-gray-800 active:scale-[0.98] dark:bg-gray-900 dark:hover:bg-gray-800 sm:space-x-3 sm:py-3 sm:text-base"
                >
                  <AppleIcon />
                  <span>Continue with Apple</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20 sm:mb-6 sm:p-4">
                <p className="text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                  Creating account for{' '}
                  <span className="break-all font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 sm:text-sm"
                >
                  Change email
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Phone number country"
                      value={country.code}
                      onChange={(e) => {
                        const next = findPhoneCountry(e.target.value)
                        if (next) setCountry(next)
                      }}
                      className={clsx(inputClass, 'w-[8.5rem] shrink-0 px-2 sm:w-40')}
                    >
                      {PHONE_COUNTRIES.map((item) => (
                        <option key={item.code} value={item.code} title={item.name}>
                          {item.flag} {item.dial} {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={country.dial}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className={clsx(inputClass, 'pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((open) => !open)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={clsx(inputClass, 'pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((open) => !open)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password.trim() || password !== confirmPassword}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:py-3 sm:text-base"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-xs text-gray-600 dark:text-gray-400 sm:mt-6 sm:text-sm">
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign In
            </Link>
          </p>
        </div>

        <p className="mt-4 px-4 text-center text-xs text-gray-500 sm:mt-6">
          By continuing, you agree to our Terms of Service and{' '}
          <Link to="/privacy-policy" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
