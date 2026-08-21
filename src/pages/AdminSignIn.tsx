import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_ROLES = ['superadmin', 'super_admin', 'admin', 'subadmin', 'sub_admin']

export default function AdminSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signin, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await signin(email, password)
      if (!ADMIN_ROLES.includes(user.role?.toLowerCase() ?? '')) {
        await logout()
        setError('Access denied. Admin or Sub-admin privileges required.')
        return
      }
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/5 bg-[#111827] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/20">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Admin Portal</h1>
            <p className="text-xs text-slate-500">Operations Center</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 pr-10 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Access Admin Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
