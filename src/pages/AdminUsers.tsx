import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { adminService, AdminUser } from '../services/adminService'
import { adminUserService } from '../services/adminPanelService'
import { sessionManager } from '../services/sessionManager'
import ConfirmModal from '../components/admin/ConfirmModal'
import { isProtectedOwnerEmail } from '../utils/protectedOwner'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function impersonate(user: AdminUser) {
  const result = await adminUserService.loginAs(user.id)
  if (!result?.token) throw new Error('Login-as failed')
  sessionManager.saveSession({
    accessToken: result.token,
    expiresAt: null,
    user: {
      _id: result.user?.id || user.id,
      email: result.user?.email || user.email,
      name: result.user?.name || user.name,
      role: 'user',
    },
  })
  window.location.assign('/dashboard')
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const { users: list, pagination: next } = await adminService.getUsers({
        page,
        limit: 20,
        search: search.trim() || undefined,
      })
      setUsers(list || [])
      setPagination(next || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch {
      setToast('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => fetchUsers(1), 250)
    return () => window.clearTimeout(timer)
  }, [fetchUsers])

  const goEdit = (user: AdminUser, hash = '') => {
    navigate(`/admin/users/${user.id}${hash}`)
  }

  const confirmDelete = async () => {
    if (!deleting || isProtectedOwnerEmail(deleting.email)) return
    setDeleteError('')
    try {
      await adminUserService.remove(deleting.id)
      setDeleting(null)
      await fetchUsers(pagination.page)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(message || 'Failed to delete user')
      throw err
    }
  }

  return (
    <div className="p-8">
      {toast && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            {(pagination.total || 0).toLocaleString()} registered customers
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, email or name"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Unique ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Date Joined</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-600">Loading users…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-600">No users found</td>
                </tr>
              ) : (
                users.map((user) => {
                  const usdt = user.wallets?.find((w) => w.asset === 'USDT')
                  return (
                    <tr key={user.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{user.uniqueId || '—'}</td>
                      <td className="px-4 py-3 text-slate-200">{user.email}</td>
                      <td className="px-4 py-3 text-white">{user.name || '—'}</td>
                      <td className="px-4 py-3 font-medium text-white">{formatMoney(usdt?.balance ?? 0)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            user.isVerified
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {user.isVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => goEdit(user)}
                            className="rounded-md bg-sky-500/90 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-500"
                          >
                            View
                          </button>
                          <button
                            onClick={() => goEdit(user)}
                            className="rounded-md bg-indigo-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => goEdit(user, '#logs')}
                            className="rounded-md bg-violet-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-600"
                          >
                            Logs
                          </button>
                          <button
                            onClick={() => impersonate(user).catch((err) => setToast(err.message || 'Login as failed'))}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-500"
                          >
                            Login As
                          </button>
                          {!isProtectedOwnerEmail(user.email) && (
                            <button
                              onClick={() => {
                                setDeleteError('')
                                setDeleting(user)
                              }}
                              className="rounded-md bg-red-600/90 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-600"
                              aria-label={`Delete ${user.email}`}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <p className="text-xs text-slate-600">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => {
          setDeleting(null)
          setDeleteError('')
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={
          deleting
            ? `This will permanently delete ${deleting.email} and all related data (trades, wallets, transactions). This cannot be undone.${
                deleteError ? `\n\n${deleteError}` : ''
              }`
            : ''
        }
        confirmText="Delete User"
        requireTyped={deleting?.email}
      />
    </div>
  )
}
