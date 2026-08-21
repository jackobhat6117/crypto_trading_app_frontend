import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import {
  AdminUserSummary,
  adminNotificationService,
  adminUserService,
} from '../services/adminPanelService'

export default function AdminNotifyUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    adminUserService
      .list({ limit: 200 })
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])

  const allSelected = users.length > 0 && selected.length === users.length

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Please fill in title and message')
      return
    }
    setError('')
    setSending(true)
    try {
      await adminNotificationService.send({
        title: title.trim(),
        message: message.trim(),
        // An empty selection broadcasts to every user.
        userIds: selected.length > 0 ? selected : undefined,
      })
      setNotice(
        selected.length > 0
          ? `Notification sent to ${selected.length} user(s)`
          : 'Notification broadcast to all users'
      )
      setTitle('')
      setMessage('')
      setSelected([])
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Notify Users</h1>
      <p className="mb-6 text-sm text-slate-400">
        Send an in-app notification to selected users, or to everyone at once
      </p>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#111827] p-6">
          <div className="mb-3">
            <label className="mb-1 block text-xs text-slate-400">Notification Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-slate-400">Notification Message</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            onClick={send}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <Send size={15} />
            {sending ? 'Sending...' : selected.length > 0 ? `Send to ${selected.length} user(s)` : 'Send to all users'}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <p className="text-sm font-medium text-white">Recipients</p>
            <button
              onClick={() => setSelected(allSelected ? [] : users.map((u) => u._id))}
              className="text-xs text-red-400"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No users found</p>
            ) : (
              users.map((user) => (
                <label
                  key={user._id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-5 py-3 last:border-0 hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(user._id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, user._id]
                          : selected.filter((id) => id !== user._id)
                      )
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{user.name || user.email}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
