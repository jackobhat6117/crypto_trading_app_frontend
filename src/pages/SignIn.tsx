import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex justify-end p-4">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-gray-600 dark:text-gray-300">
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>
      <div className="mx-auto max-w-md px-4 pb-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <div className="h-3 w-3 rounded-sm bg-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Base
          </span>
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="mb-8 text-gray-500">Sign in to your account</p>

        <div className="mb-6 space-y-3">
          <button className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium dark:border-gray-700">
            Continue with Google
          </button>
          <button className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium dark:border-gray-700">
            Continue with Apple
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-sm text-indigo-600">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-indigo-600">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
