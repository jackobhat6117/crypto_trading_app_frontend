import api from './api'
import { Coin } from '../types'
import { KycRecord, KycSettings } from './kycService'
import { Ticket, TicketMessage, TicketStatus } from './supportService'

export interface AdminSiteSettings {
  siteName: string
  logo?: string
  favicon?: string
  supportEmail?: string
  currency?: string
  maintenanceMode?: boolean
}

export interface SubAdmin {
  _id: string
  name?: string
  email: string
  isActive?: boolean
  assignedUsers?: string[]
  createdAt?: string
}

export interface AdminUserSettings {
  allowWithdraw?: boolean
  allowTrade?: boolean
  noticeMessage?: string
}

export const siteSettingsService = {
  async get(): Promise<AdminSiteSettings> {
    const response = await api.get('/api/admin/settings')
    return response.data?.settings ?? response.data ?? {}
  },

  async update(payload: Partial<AdminSiteSettings>) {
    const response = await api.put('/api/admin/settings', payload)
    return response.data
  },

  async uploadLogo(file: File) {
    const form = new FormData()
    form.append('logo', file)
    const response = await api.post('/api/admin/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async uploadFavicon(file: File) {
    const form = new FormData()
    form.append('favicon', file)
    const response = await api.post('/api/admin/settings/favicon', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export const adminCoinService = {
  async getAll(): Promise<Coin[]> {
    const response = await api.get('/api/coins/admin/all')
    return response.data?.coins ?? response.data?.data ?? []
  },

  async create(payload: Partial<Coin>) {
    const response = await api.post('/api/coins/admin/create', payload)
    return response.data
  },

  async update(id: string, payload: Partial<Coin>) {
    const response = await api.put(`/api/coins/admin/${id}`, payload)
    return response.data
  },

  async remove(id: string) {
    const response = await api.delete(`/api/coins/admin/${id}`)
    return response.data
  },
}

export const adminKycService = {
  async list(status?: string): Promise<KycRecord[]> {
    const response = await api.get('/api/admin/kyc', { params: status ? { status } : undefined })
    return response.data?.kyc ?? response.data?.data ?? []
  },

  async approve(id: string) {
    const response = await api.post(`/api/admin/kyc/${id}/approve`)
    return response.data
  },

  async reject(id: string, reason: string) {
    const response = await api.post(`/api/admin/kyc/${id}/reject`, { reason })
    return response.data
  },

  async getSettings(): Promise<KycSettings> {
    const response = await api.get('/api/kyc/settings')
    return response.data?.settings ?? response.data ?? {}
  },

  async updateSettings(payload: Partial<KycSettings>) {
    const response = await api.put('/api/kyc/settings', payload)
    return response.data
  },
}

export const subAdminService = {
  async list(): Promise<SubAdmin[]> {
    const response = await api.get('/api/admin/subadmins')
    return response.data?.subadmins ?? response.data?.data ?? []
  },

  async create(payload: { name: string; email: string; password: string }) {
    const response = await api.post('/api/admin/subadmins', payload)
    return response.data
  },

  async remove(id: string) {
    const response = await api.delete(`/api/admin/subadmins/${id}`)
    return response.data
  },

  async resetPassword(id: string, password: string) {
    const response = await api.post(`/api/admin/subadmins/${id}/reset-password`, { password })
    return response.data
  },

  async setStatus(id: string, isActive: boolean) {
    const response = await api.post(`/api/admin/subadmins/${id}/status`, { isActive })
    return response.data
  },

  async assignUsers(id: string, userIds: string[]) {
    const response = await api.post(`/api/admin/subadmins/${id}/assign-users`, { userIds })
    return response.data
  },
}

export const adminNotificationService = {
  async send(payload: { title: string; message: string; userIds?: string[] }) {
    const response = await api.post('/api/admin/notifications/send', payload)
    return response.data
  },
}

export interface AdminUserSummary {
  _id: string
  email: string
  name?: string
  username?: string
  uniqueId?: string
  balance?: number
  isActive?: boolean
}

export const adminUserService = {
  async list(params?: { search?: string; limit?: number }): Promise<AdminUserSummary[]> {
    const response = await api.get('/api/admin/users', { params })
    return response.data?.users ?? response.data?.data ?? []
  },

  async adjustBalance(id: string, amount: number, operation: 'add' | 'subtract', note?: string) {
    const response = await api.post(`/api/admin/users/${id}/balance`, { amount, operation, note })
    return response.data
  },

  async resetPassword(id: string, password: string) {
    const response = await api.post(`/api/admin/users/${id}/password`, { password })
    return response.data
  },

  async updateSettings(id: string, settings: AdminUserSettings) {
    const response = await api.put(`/api/admin/users/${id}/settings`, settings)
    return response.data
  },

  async getLogs(id: string) {
    const response = await api.get(`/api/admin/users/${id}/logs`)
    return response.data?.logs ?? response.data?.data ?? []
  },

  // Returns a user token so an admin can reproduce an issue from the user's session.
  async loginAs(id: string): Promise<{ token: string }> {
    const response = await api.post(`/api/admin/users/${id}/login-as`)
    return response.data
  },

  async loginAsByEmail(email: string): Promise<{ token: string }> {
    const response = await api.post('/api/admin/login-as-user-by-email', { email })
    return response.data
  },
}

export const adminChatService = {
  async getStats() {
    const response = await api.get('/api/chat/admin/stats')
    return response.data?.stats ?? response.data ?? {}
  },

  async getTickets(params?: { status?: string; priority?: string }): Promise<Ticket[]> {
    const response = await api.get('/api/chat/admin/tickets', { params })
    return response.data?.tickets ?? response.data?.data ?? []
  },

  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const response = await api.get(`/api/chat/admin/tickets/${ticketId}/messages`)
    return response.data?.messages ?? response.data?.data ?? []
  },

  async sendMessage(ticketId: string, message: string) {
    const response = await api.post(`/api/chat/admin/tickets/${ticketId}/messages`, { message })
    return response.data
  },

  async updateTicket(ticketId: string, payload: { status?: TicketStatus; priority?: string }) {
    const response = await api.put(`/api/chat/admin/tickets/${ticketId}`, payload)
    return response.data
  },
}
