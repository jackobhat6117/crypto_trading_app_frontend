import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { SubAdmin, subAdminService } from '../services/adminPanelService'
import StatusBadge from '../components/admin/StatusBadge'

export default function AdminSubAdmins() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSubAdmins(await subAdminService.list())
    } catch {
      setError('Failed to fetch sub-admins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (draft.password.length < 6) {
      setError('Enter new password (min 6 characters)')
      return
    }
    setSaving(true)
    setError('')
    try {
      await subAdminService.create(draft)
      setNotice('Sub-admin created successfully')
      setCreating(false)
      setDraft({ name: '', email: '', password: '' })
      await load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to create sub-admin')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (subAdmin: SubAdmin) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return
    try {
      await subAdminService.remove(subAdmin._id)
      setNotice('Sub-admin deleted successfully')
      await load()
    } catch {
      setError('Failed to delete sub-admin')
    }
  }

  const resetPassword = async (subAdmin: SubAdmin) => {
    const password = window.prompt('Enter new password (min 6 characters)')
    if (!password) return
    try {
      await subAdminService.resetPassword(subAdmin._id, password)
      setNotice('Password reset successfully')
    } catch {
      setError('Failed to reset password')
    }
  }

  const toggleStatus = async (subAdmin: SubAdmin) => {
    try {
      await subAdminService.setStatus(subAdmin._id, subAdmin.isActive === false)
      await load()
    } catch {
      setError('Failed to update status')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sub-Admin Management</h1>
          <p className="text-sm text-slate-400">
            Sub-admins must sign in through the admin portal.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} /> Create Sub-Admin
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Assigned Users</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : subAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  No sub-admins yet
                </td>
              </tr>
            ) : (
              subAdmins.map((subAdmin) => (
                <tr key={subAdmin._id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-white">{subAdmin.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{subAdmin.email}</td>
                  <td className="px-5 py-3 text-slate-400">{subAdmin.assignedUsers?.length ?? 0}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleStatus(subAdmin)}>
                      <StatusBadge status={subAdmin.isActive === false ? 'DISABLED' : 'ACTIVE'} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => resetPassword(subAdmin)}
                        aria-label="Reset password"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => remove(subAdmin)}
                        aria-label="Delete sub-admin"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Create Sub-Admin</h2>
            {[
              { key: 'name' as const, label: 'Name', type: 'text' },
              { key: 'email' as const, label: 'Email', type: 'email' },
              { key: 'password' as const, label: 'Password', type: 'password' },
            ].map((field) => (
              <div key={field.key} className="mb-3">
                <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
                <input
                  type={field.type}
                  value={draft[field.key]}
                  onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
                />
              </div>
            ))}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={saving}
                className="flex-1 rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
