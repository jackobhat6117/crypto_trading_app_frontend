import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Paperclip, Send, X } from 'lucide-react'
import {
  TICKET_PRIORITIES,
  Ticket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  supportService,
} from '../services/supportService'
import { resolveMediaUrl } from '../utils/mediaUrl'

const POLL_MS = 5000

function statusLabel(status: TicketStatus) {
  if (status === 'closed' || status === 'archived') return 'resolved'
  return 'in progress'
}

function statusClass(status: TicketStatus) {
  return status === 'closed' || status === 'archived'
    ? 'bg-emerald-500 text-white'
    : 'bg-sky-500 text-white'
}

function formatCardDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US')
}

function formatDayLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatBubbleTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function dayKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toDateString()
}

function NewTicketModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (ticket: Ticket) => void
}) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in title and message')
      return
    }
    setError('')
    setBusy(true)
    try {
      onCreated(await supportService.createTicket(subject.trim(), message.trim(), priority))
    } catch {
      setError('Failed to create ticket')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-[#1a1d26] p-5 text-white sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Create New Ticket</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>}

        <div>
          <label className="mb-1 block text-sm text-slate-300">Subject *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
            className="w-full rounded-xl border border-white/10 bg-[#11141c] px-4 py-3 text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {TICKET_PRIORITIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPriority(level)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize ${
                  priority === level
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Message *</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what happened"
            className="w-full resize-none rounded-xl border border-white/10 bg-[#11141c] px-4 py-3 text-white outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Submitting...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}

function ChatPane({
  ticket,
  onTicketChange,
}: {
  ticket: Ticket
  onTicketChange: (ticket: Ticket) => void
}) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageCountRef = useRef(0)

  const loadMessages = useCallback(async () => {
    try {
      const next = await supportService.getMessages(ticket._id)
      setMessages(next)
      setError('')
      return next
    } catch {
      setError('Failed to load messages')
      return []
    }
  }, [ticket._id])

  const refreshTicket = useCallback(async () => {
    const latest = await supportService.findTicket(ticket._id)
    if (latest) onTicketChange(latest)
  }, [onTicketChange, ticket._id])

  const load = useCallback(async () => {
    await Promise.all([loadMessages(), refreshTicket()])
  }, [loadMessages, refreshTicket])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(interval)
  }, [load])

  useEffect(() => {
    const container = scrollRef.current
    const prevCount = messageCountRef.current
    messageCountRef.current = messages.length
    if (messages.length === 0) return
    const nearBottom =
      !container || container.scrollHeight - container.scrollTop - container.clientHeight < 140
    if (messages.length > prevCount && nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() && !attachment) {
      setError('Please enter a message or attach a file')
      return
    }
    setError('')
    setSending(true)
    try {
      await supportService.sendMessage(ticket._id, draft.trim(), attachment ?? undefined)
      setDraft('')
      setAttachment(null)
      await load()
    } catch {
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const grouped = useMemo(() => {
    const rows: Array<{ key: string; label: string; items: TicketMessage[] }> = []
    for (const msg of messages) {
      const key = dayKey(msg.createdAt)
      const last = rows[rows.length - 1]
      if (!last || last.key !== key) {
        rows.push({ key, label: formatDayLabel(msg.createdAt), items: [msg] })
      } else {
        last.items.push(msg)
      }
    }
    return rows
  }, [messages])

  const readOnly = ticket.status === 'closed' || ticket.status === 'archived'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No messages yet. Send the first one below.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.key} className="space-y-4">
              <div className="flex justify-center">
                <span className="rounded-full bg-[#2a303c] px-3 py-1 text-[11px] text-slate-300">
                  {group.label}
                </span>
              </div>
              {group.items.map((msg) => (
                <div key={msg._id} className={`flex items-end gap-2 ${msg.isAdmin ? '' : 'justify-end'}`}>
                  {msg.isAdmin && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                      {(msg.senderName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                      msg.isAdmin ? 'bg-[#2a303c] text-white' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {msg.isAdmin && (
                      <p className="mb-1 text-xs font-medium text-slate-300">{msg.senderName || 'Admin User'}</p>
                    )}
                    {msg.attachment && (
                      <a href={resolveMediaUrl(msg.attachment)} target="_blank" rel="noreferrer">
                        <img src={resolveMediaUrl(msg.attachment)} alt="" className="mb-2 max-h-40 rounded-lg" />
                      </a>
                    )}
                    {msg.message && <p className="whitespace-pre-wrap text-sm">{msg.message}</p>}
                    <p className="mt-1 text-[10px] text-white/60">{formatBubbleTime(msg.createdAt)}</p>
                  </div>
                  {!msg.isAdmin && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-sm text-red-400">{error}</p>}

      {readOnly ? (
        <p className="border-t border-white/5 px-4 py-4 text-center text-sm text-slate-500">
          This ticket is {statusLabel(ticket.status)}. Create a new ticket if you need more help.
        </p>
      ) : (
        <form onSubmit={send} className="border-t border-white/5 px-3 py-3 sm:px-4">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <Paperclip className="h-3 w-3" />
              {attachment.name}
              <button type="button" onClick={() => setAttachment(null)} className="text-red-400">
                remove
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label aria-label="Attach file" className="cursor-pointer p-2 text-slate-400 hover:text-white">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
            </label>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-white/10 bg-[#11141c] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function CustomerServicePage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Ticket | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const list = await supportService.getTickets()
      setTickets(list)
      setActive((current) => {
        if (!current) return current
        return list.find((item) => item._id === current._id) ?? current
      })
      setError('')
    } catch {
      if (!silent) setError('Failed to load tickets')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
    const interval = window.setInterval(() => void load(true), POLL_MS)
    return () => window.clearInterval(interval)
  }, [load])

  return (
    <div className="-mx-3 flex min-h-[calc(100dvh-6.5rem)] flex-col bg-[#11141c] text-white sm:-mx-4 lg:-mx-6">
      <header className="flex items-center gap-3 border-b border-white/5 px-3 py-3 sm:px-4">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="text-slate-400 hover:text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-lg font-semibold">Customer Service</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          New Ticket
        </button>
      </header>

      {error && <div className="mx-3 mt-3 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-full shrink-0 overflow-y-auto border-white/5 md:w-72 md:border-r lg:w-80 ${
            active ? 'hidden md:block' : 'block'
          }`}
        >
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">No tickets yet</p>
              <button
                onClick={() => setCreating(true)}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {tickets.map((ticket) => {
                const selected = active?._id === ticket._id
                return (
                  <button
                    key={ticket._id}
                    onClick={() => setActive(ticket)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selected
                        ? 'border-indigo-500/50 bg-[#1c2230]'
                        : 'border-white/5 bg-[#1a1d26] hover:border-white/10'
                    }`}
                  >
                    <p className="truncate font-medium text-white">{ticket.subject}</p>
                    {ticket.lastMessage && (
                      <p className="mt-1 truncate text-xs text-slate-500">{ticket.lastMessage}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${statusClass(ticket.status)}`}>
                        {statusLabel(ticket.status)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatCardDate(ticket.lastMessageAt || ticket.createdAt)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className={`min-w-0 flex-1 ${active ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 md:hidden">
                <button onClick={() => setActive(null)} className="text-slate-400" aria-label="Back to tickets">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="truncate text-sm font-medium">{active.subject}</p>
              </div>
              <ChatPane ticket={active} onTicketChange={setActive} />
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center text-sm text-slate-500 md:flex">
              Select a ticket to view the conversation
            </div>
          )}
        </section>
      </div>

      {creating && (
        <NewTicketModal
          onClose={() => setCreating(false)}
          onCreated={(ticket) => {
            setCreating(false)
            setTickets((prev) => [ticket, ...prev.filter((item) => item._id !== ticket._id)])
            setActive(ticket)
          }}
        />
      )}
    </div>
  )
}
