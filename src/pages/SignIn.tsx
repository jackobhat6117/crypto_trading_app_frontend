import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import BrandLogo from '../components/BrandLogo'
import clsx from 'clsx'

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-gray-50 py-3.5 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-700 dark:focus:ring-indigo-400 sm:text-base'

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

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const { signin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const user = await signin(email, password)
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else if (user.role === 'subadmin') {
        navigate('/subadmin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const socialUnavailable = () => {
    setNotice('Social sign-in is not available yet. Continue with email.')
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
            Welcome Back
          </h1>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:mb-6 sm:text-base">
            Sign in to your account
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

          <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-3">
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

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="bg-white px-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400 sm:px-4">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:mb-3 sm:text-base"
              >
                <AtSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between sm:mb-3">
                <label
                  htmlFor="password"
                  className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:text-base"
                >
                  <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Password</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 sm:text-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={clsx(fieldClass, 'pr-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:py-3 sm:text-base"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-600 dark:text-gray-400 sm:mt-6 sm:text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
