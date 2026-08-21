import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Paperclip, Plus, Send, X } from 'lucide-react'
import {
  TICKET_PRIORITIES,
  Ticket,
  TicketMessage,
  TicketPriority,
  supportService,
} from '../services/supportService'
import PageHeader from '../components/layout/PageHeader'
import { resolveMediaUrl } from '../utils/mediaUrl'

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
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
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }
    if (!message.trim()) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 dark:bg-gray-900 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Create New Ticket</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {TICKET_PRIORITIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPriority(level)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize ${
                  priority === level
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
                    : 'border-gray-200 text-gray-500 dark:border-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what happened"
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Submitting...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}

function ChatView({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      setMessages(await supportService.getMessages(ticket._id))
    } catch {
      setError('Failed to load messages')
    }
  }, [ticket._id])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
        <button onClick={onBack} aria-label="Back to tickets" className="text-gray-500">
          ←
        </button>
        <div className="flex-1">
          <p className="font-semibold">{ticket.subject}</p>
          <p className="text-xs capitalize text-gray-500">
            {ticket.status} · {ticket.priority} priority
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No messages yet. Send the first one below.
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.isAdmin
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {msg.isAdmin && (
                  <p className="mb-1 text-xs font-medium opacity-70">{msg.senderName || 'Support Team'}</p>
                )}
                {msg.attachment && (
                  <a href={resolveMediaUrl(msg.attachment)} target="_blank" rel="noreferrer">
                    <img src={resolveMediaUrl(msg.attachment)} alt="" className="mb-2 max-h-40 rounded-lg" />
                  </a>
                )}
                {msg.message && <p className="whitespace-pre-wrap text-sm">{msg.message}</p>}
                <p className="mt-1 text-right text-[10px] opacity-60">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pb-2 text-sm text-red-600">{error}</p>}

      {ticket.status === 'closed' || ticket.status === 'archived' ? (
        <p className="border-t border-gray-200 pt-3 text-center text-sm text-gray-500 dark:border-gray-800">
          This ticket is {ticket.status}. Create a new ticket if you need more help.
        </p>
      ) : (
        <form onSubmit={send} className="border-t border-gray-200 pt-3 dark:border-gray-800">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
              <Paperclip className="h-3 w-3" />
              {attachment.name}
              <button type="button" onClick={() => setAttachment(null)} className="text-red-500">
                remove
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label
              aria-label="Attach file"
              className="cursor-pointer rounded-xl border border-gray-200 p-3 text-gray-400 dark:border-gray-700"
            >
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
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Send message"
              className="rounded-xl bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function CustomerServicePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Ticket | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setTickets(await supportService.getTickets())
    } catch {
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (active) {
    return <ChatView ticket={active} onBack={() => setActive(null)} />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer Service"
        subtitle={tickets.length > 0 ? `${tickets.length} tickets` : undefined}
        action={
          tickets.length > 0 ? (
            <button
              onClick={() => setCreating(true)}
              aria-label="New Ticket"
              className="rounded-xl bg-indigo-600 p-2 text-white"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 dark:border-gray-700">
          <MessageCircle className="mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-lg font-semibold">No tickets yet</h2>
          <p className="mb-6 text-sm text-gray-500">Create your first support ticket to get started</p>
          <button
            onClick={() => setCreating(true)}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white"
          >
            Create First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket._id}
              onClick={() => setActive(ticket)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ticket.subject}</p>
                  {ticket.lastMessage && (
                    <p className="mt-1 truncate text-sm text-gray-500">{ticket.lastMessage}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_STYLES[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                  <span className="text-xs capitalize text-gray-500">{ticket.status}</span>
                  {!!ticket.unreadCount && (
                    <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {ticket.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <NewTicketModal
          onClose={() => setCreating(false)}
          onCreated={(ticket) => {
            setCreating(false)
            setTickets((prev) => [ticket, ...prev])
            setActive(ticket)
          }}
        />
      )}
    </div>
  )
}
