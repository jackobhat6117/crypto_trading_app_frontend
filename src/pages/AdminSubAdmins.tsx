import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { SubAdmin, subAdminService } from '../services/adminPanelService'
import StatusBadge from '../components/admin/StatusBadge'
import ConfirmModal from '../components/admin/ConfirmModal'
import { isProtectedOwnerEmail } from '../utils/protectedOwner'

type AccessLevel = 'full' | 'support'

const emptyDraft = {
  name: '',
  email: '',
  password: '',
  accessLevel: 'support' as AccessLevel,
}

const accessLabel = (admin?: SubAdmin) =>
  admin?.adminRole === 'SUPER_ADMIN' ? 'Full Access' : 'Support Only'

export default function AdminSubAdmins() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState<SubAdmin | null>(null)
  const [resetting, setResetting] = useState<SubAdmin | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetError, setResetError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const admins = await subAdminService.list()
      setSubAdmins(admins.filter((admin) => !isProtectedOwnerEmail(admin.email)))
    } catch {
      setError('Failed to fetch admin accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setCreateError('')
    setCreating(true)
  }

  const closeCreate = () => {
    setCreating(false)
    setDraft(emptyDraft)
    setCreateError('')
  }

  const closeReset = () => {
    setResetting(null)
    setNewPassword('')
    setConfirmPassword('')
    setResetError('')
  }

  const create = async () => {
    if (!draft.email.trim()) {
      setCreateError('Email is required')
      return
    }
    if (draft.password.length < 8) {
      setCreateError('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    setCreateError('')
    try {
      await subAdminService.create(draft)
      setNotice(
        draft.accessLevel === 'full'
          ? 'Full-access admin created successfully'
          : 'Sub-admin created successfully'
      )
      closeCreate()
      await load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(detail || 'Failed to create admin account')
    } finally {
      setSaving(false)
    }
  }

  const isLocked = (admin?: SubAdmin | null) =>
    Boolean(admin?.isProtected || isProtectedOwnerEmail(admin?.email))

  const confirmDelete = async () => {
    if (!deleting || isLocked(deleting)) return
    try {
      await subAdminService.remove(deleting._id)
      setNotice('Admin account deleted successfully')
      setDeleting(null)
      await load()
    } catch {
      setError('Failed to delete admin account')
    }
  }

  const confirmReset = async () => {
    if (!resetting || isLocked(resetting)) return
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    setSaving(true)
    setResetError('')
    try {
      await subAdminService.resetPassword(resetting._id, newPassword)
      setNotice('Password reset successfully')
      closeReset()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setResetError(detail || 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (subAdmin: SubAdmin) => {
    if (isLocked(subAdmin)) return
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
          <h1 className="text-2xl font-bold text-white">Admin Management</h1>
          <p className="text-sm text-slate-400">
            Create full-access admins or limited support sub-admins. All sign in at /admin/signin.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} /> Create Admin
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
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Assigned Users</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : subAdmins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  No admin accounts yet
                </td>
              </tr>
            ) : (
              subAdmins.map((subAdmin) => {
                const locked = isLocked(subAdmin)
                return (
                <tr key={subAdmin._id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-white">{subAdmin.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{subAdmin.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={subAdmin.adminRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SUPPORT_ADMIN'}
                      />
                      {locked && <StatusBadge status="PROTECTED" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{subAdmin.assignedUsers?.length ?? 0}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleStatus(subAdmin)}
                      disabled={locked}
                      title={locked ? 'Owner account cannot be changed' : undefined}
                      className={locked ? 'cursor-not-allowed opacity-70' : ''}
                    >
                      <StatusBadge status={subAdmin.isActive === false ? 'DISABLED' : 'ACTIVE'} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    {locked ? (
                      <p className="text-right text-xs text-slate-500">Locked</p>
                    ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setResetting(subAdmin)}
                        aria-label="Reset password"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => setDeleting(subAdmin)}
                        aria-label="Delete admin"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    )}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Create Admin</h2>

            <div className="mb-4">
              <label className="mb-2 block text-xs text-slate-400">Access Level</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, accessLevel: 'support' })}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                    draft.accessLevel === 'support'
                      ? 'border-red-500/40 bg-red-500/10 text-white'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="font-medium">Support</p>
                  <p className="mt-1 text-xs text-slate-500">Limited day-to-day access</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, accessLevel: 'full' })}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                    draft.accessLevel === 'full'
                      ? 'border-purple-500/40 bg-purple-500/10 text-white'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="font-medium">Full Access</p>
                  <p className="mt-1 text-xs text-slate-500">Same power as super admin</p>
                </button>
              </div>
            </div>

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

            {draft.accessLevel === 'full' && (
              <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Full-access admins can manage site settings, balances, sub-admins, and all platform controls.
              </p>
            )}

            {createError && (
              <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {createError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeCreate}
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

      {resetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111827] p-6">
            <h2 className="mb-1 text-lg font-bold text-white">Reset Password</h2>
            <p className="mb-4 text-sm text-slate-400">
              Set a new password for {resetting.name || resetting.email}.
            </p>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-slate-400">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-slate-400">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
              />
            </div>

            {resetError && (
              <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {resetError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeReset}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={saving}
                className="flex-1 rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete Admin"
        message={
          deleting
            ? `This will permanently delete the ${accessLabel(deleting)} account for ${deleting.email}. This cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
