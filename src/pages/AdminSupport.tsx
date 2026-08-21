import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { adminChatService } from '../services/adminPanelService'
import { Ticket, TicketMessage, TicketStatus } from '../services/supportService'
import { resolveMediaUrl } from '../utils/mediaUrl'
import StatusBadge from '../components/admin/StatusBadge'

const STATUS_FILTERS: (TicketStatus | 'all')[] = ['all', 'open', 'pending', 'closed', 'archived']

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [status, setStatus] = useState<TicketStatus | 'all'>('open')
  const [active, setActive] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadTickets = useCallback(async () => {
    try {
      setTickets(await adminChatService.getTickets(status === 'all' ? undefined : { status }))
    } catch {
      setError('Failed to load tickets')
    }
  }, [status])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const loadMessages = useCallback(async () => {
    if (!active) return
    try {
      setMessages(await adminChatService.getMessages(active._id))
    } catch {
      setError('Failed to load messages')
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [active, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || !draft.trim()) return
    setSending(true)
    try {
      await adminChatService.sendMessage(active._id, draft.trim())
      setDraft('')
      await loadMessages()
    } catch {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (next: TicketStatus) => {
    if (!active) return
    try {
      await adminChatService.updateTicket(active._id, { status: next })
      setActive({ ...active, status: next })
      await loadTickets()
    } catch {
      setError('Failed to update ticket')
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-white">Customer Service Chat</h1>
      <p className="mb-6 text-sm text-slate-400">Tickets ({tickets.length})</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              status === value ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-slate-400'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111827]">
          <div className="max-h-[70vh] overflow-y-auto">
            {tickets.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                No support tickets match your current filters
              </p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setActive(ticket)}
                  className={`block w-full border-b border-white/5 px-4 py-3 text-left last:border-0 ${
                    active?._id === ticket._id ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{ticket.subject}</p>
                    <StatusBadge status={ticket.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex h-[70vh] flex-col rounded-xl border border-white/5 bg-[#111827]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Choose a ticket from the list to start chatting
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div>
                  <p className="font-medium text-white">{active.subject}</p>
                  <p className="text-xs capitalize text-slate-500">
                    {active.status} · {active.priority} priority
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus('closed')}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Close ticket
                  </button>
                  <button
                    onClick={() => updateStatus('archived')}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Archive ticket
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">Select a ticket to view messages</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg._id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          msg.isAdmin ? 'bg-red-500/90 text-white' : 'bg-white/5 text-slate-200'
                        }`}
                      >
                        {!msg.isAdmin && (
                          <p className="mb-1 text-xs opacity-70">{msg.senderName || 'User'}</p>
                        )}
                        {msg.attachment && (
                          <a href={resolveMediaUrl(msg.attachment)} target="_blank" rel="noreferrer">
                            <img
                              src={resolveMediaUrl(msg.attachment)}
                              alt=""
                              className="mb-2 max-h-40 rounded-lg"
                            />
                          </a>
                        )}
                        {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                        <p className="mt-1 text-right text-[10px] opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex gap-2 border-t border-white/5 p-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  aria-label="Send message"
                  className="rounded-lg bg-red-500/90 px-4 text-white disabled:opacity-60"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
