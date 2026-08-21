import api from './api'

export type TicketStatus = 'open' | 'pending' | 'closed' | 'archived'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TicketMessage {
  _id: string
  ticketId?: string
  message: string
  attachment?: string
  isAdmin?: boolean
  senderName?: string
  createdAt: string
}

export interface Ticket {
  _id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  lastMessage?: string
  unreadCount?: number
  createdAt: string
  updatedAt?: string
}

export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']

export const supportService = {
  async getTickets(): Promise<Ticket[]> {
    const response = await api.get('/api/chat/tickets')
    return response.data?.tickets ?? response.data?.data ?? []
  },

  async createTicket(subject: string, message: string, priority: TicketPriority = 'medium') {
    const response = await api.post('/api/chat/tickets', { subject, message, priority })
    return response.data?.ticket ?? response.data
  },

  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const response = await api.get(`/api/chat/tickets/${ticketId}/messages`)
    return response.data?.messages ?? response.data?.data ?? []
  },

  async sendMessage(ticketId: string, message: string, attachment?: File) {
    if (attachment) {
      const form = new FormData()
      form.append('message', message)
      form.append('attachment', attachment)
      const response = await api.post(`/api/chat/tickets/${ticketId}/messages`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    const response = await api.post(`/api/chat/tickets/${ticketId}/messages`, { message })
    return response.data
  },

  async contact(payload: { name: string; email: string; subject: string; message: string }) {
    const response = await api.post('/api/support/contact', payload)
    return response.data
  },
}
