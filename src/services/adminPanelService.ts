import api from './api'
import { Coin } from '../types'
import { resolveCoinIcon } from '../utils/coinIcons'
import { KycRecord, KycSettings } from './kycService'
import { Ticket, TicketMessage, TicketStatus } from './supportService'
import { FinanceStatus, normalizeDeposit, normalizeWithdrawal } from './financeService'

export interface AdminSiteSettings {
  siteName: string
  logo?: string
  favicon?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  supportEmail?: string
  currency?: string
  maintenanceMode?: boolean
}

export interface SubAdmin {
  _id: string
  name?: string
  email: string
  role?: string
  adminRole?: string
  isActive?: boolean
  isProtected?: boolean
  assignedUsers?: string[]
  createdAt?: string
}

export interface AdminUserSettings {
  allowWithdraw?: boolean
  allowTrade?: boolean
  noticeMessage?: string
  isActive?: boolean
}

export interface WinTradeSlot {
  timer: number
  side: 'BUY' | 'SELL'
  enabled: boolean
  percent: number
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

function normalizeAdminCoin(raw: unknown): Coin | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const symbol = String(item.symbol || '').toUpperCase()
  if (!symbol) return null
  return {
    _id: String(item._id || item.id || symbol.toLowerCase()),
    symbol,
    name: String(item.name || symbol),
    image: resolveCoinIcon(symbol, item.image ? String(item.image) : undefined),
    price: Number(item.price ?? 0),
    change24h: Number(item.change24h ?? 0),
    high24h: Number(item.high24h ?? item.price ?? 0),
    low24h: Number(item.low24h ?? item.price ?? 0),
    volume: item.volume != null ? Number(item.volume) : undefined,
    marketCap: item.marketCap != null ? Number(item.marketCap) : undefined,
    rank: item.rank != null ? Number(item.rank) : undefined,
    isActive: item.isActive !== false,
    minDeposit: item.minDeposit != null ? Number(item.minDeposit) : undefined,
    maxDeposit: item.maxDeposit != null ? Number(item.maxDeposit) : undefined,
    minWithdraw: item.minWithdraw != null ? Number(item.minWithdraw) : undefined,
    maxWithdraw: item.maxWithdraw != null ? Number(item.maxWithdraw) : undefined,
    address: item.address ? String(item.address) : undefined,
    network: item.network ? String(item.network) : undefined,
  }
}

export const DEPOSIT_ADDRESS_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC20' },
  { symbol: 'USDT', name: 'Tether', network: 'TRC20' },
] as const

export const adminCoinService = {
  async getAll(): Promise<Coin[]> {
    const response = await api.get('/api/coins/admin/all')
    const list = response.data?.coins ?? response.data?.data ?? []
    return (Array.isArray(list) ? list : [])
      .map(normalizeAdminCoin)
      .filter((coin): coin is Coin => Boolean(coin))
  },

  async uploadIcon(file: File, id?: string) {
    const form = new FormData()
    form.append('icon', file)
    const response = await api.post(id ? `/api/coins/admin/${id}/icon` : '/api/coins/admin/icon', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return String(response.data?.image || response.data?.coin?.image || '')
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

  async getDepositAddresses(): Promise<Coin[]> {
    try {
      const response = await api.get('/api/coins/admin/deposit-address')
      const list = response.data?.coins ?? response.data?.data ?? []
      const mapped = (Array.isArray(list) ? list : [])
        .map(normalizeAdminCoin)
        .filter((coin): coin is Coin => Boolean(coin))
      if (mapped.length > 0) return mapped
    } catch {
      // Older APIs only expose the full coin catalog.
    }
    const coins = await this.getAll()
    return DEPOSIT_ADDRESS_COINS.map((item) => {
      const coin = coins.find((entry) => entry.symbol.toUpperCase() === item.symbol)
      return (
        coin || {
          _id: item.symbol.toLowerCase(),
          symbol: item.symbol,
          name: item.name,
          price: 0,
          change24h: 0,
          high24h: 0,
          low24h: 0,
          network: item.network,
        }
      )
    })
  },

  async updateDepositAddress(symbol: string, payload: { address: string; network?: string }) {
    const key = symbol.toUpperCase()
    try {
      const response = await api.put(`/api/coins/admin/deposit-address/${encodeURIComponent(key)}`, payload)
      return response.data
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status !== 404 && status !== 405) throw error
      const coins = await this.getAll()
      const existing = coins.find((coin) => coin.symbol.toUpperCase() === key)
      const defaults = DEPOSIT_ADDRESS_COINS.find((coin) => coin.symbol === key)
      const body = {
        symbol: key,
        name: existing?.name || defaults?.name || key,
        network: payload.network || existing?.network || defaults?.network,
        address: payload.address,
        isActive: existing?.isActive !== false,
        minDeposit: existing?.minDeposit ?? 10,
        minWithdraw: existing?.minWithdraw ?? 20,
      }
      if (existing?._id) return this.update(existing._id, body)
      return this.create(body)
    }
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

  async create(payload: { name: string; email: string; password: string; accessLevel?: 'full' | 'support' }) {
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

export interface AdminWithdrawal {
  _id: string
  amount: number
  fee?: number
  netAmount?: number
  coin: string
  network?: string
  address: string
  depositAddress?: string
  status: FinanceStatus
  txHash?: string
  adminNotes?: string
  createdAt: string
  approvedAt?: string
  completedAt?: string
  user?: { id?: string; _id?: string; name?: string; email?: string; uniqueId?: string }
}

function normalizeAdminWithdrawal(raw: Record<string, unknown>): AdminWithdrawal {
  const user = (raw.user || {}) as Record<string, unknown>
  return {
    ...normalizeWithdrawal(raw),
    coin: String(raw.coin || raw.coinSymbol || 'USDT'),
    depositAddress: raw.depositAddress ? String(raw.depositAddress) : undefined,
    user: {
      id: user.id ? String(user.id) : undefined,
      _id: user._id ? String(user._id) : undefined,
      name: user.name ? String(user.name) : undefined,
      email: user.email ? String(user.email) : undefined,
      uniqueId: user.uniqueId ? String(user.uniqueId) : undefined,
    },
  }
}

export interface AdminDeposit {
  _id: string
  amount: number
  coin: string
  network?: string
  type: string
  status: FinanceStatus
  description: string
  address?: string
  depositAddress?: string
  walletAddress?: string
  txHash?: string
  transactionId?: string
  screenshot?: string
  adminNotes?: string
  balanceBefore?: number
  balanceAfter?: number
  createdAt: string
  user?: { id?: string; _id?: string; name?: string; email?: string; uniqueId?: string }
}

function displayDepositStatus(status: FinanceStatus): FinanceStatus {
  return status === 'completed' ? 'approved' : status
}

function normalizeAdminDeposit(raw: Record<string, unknown>): AdminDeposit {
  const user = (raw.user || {}) as Record<string, unknown>
  const deposit = normalizeDeposit(raw)
  const status = displayDepositStatus(deposit.status)
  const coin = deposit.coin || 'USDT'
  return {
    ...deposit,
    coin,
    type: String(raw.type || 'deposit'),
    status,
    description:
      raw.description
        ? String(raw.description)
        : `Deposit ${deposit.amount} USDT via ${coin} - ${
            status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending approval'
          }`,
    depositAddress: raw.depositAddress ? String(raw.depositAddress) : deposit.address,
    walletAddress: raw.walletAddress ? String(raw.walletAddress) : undefined,
    transactionId: raw.transactionId ? String(raw.transactionId) : deposit.txHash,
    user: {
      id: user.id ? String(user.id) : undefined,
      _id: user._id ? String(user._id) : undefined,
      name: user.name ? String(user.name) : undefined,
      email: user.email ? String(user.email) : undefined,
      uniqueId: user.uniqueId ? String(user.uniqueId) : undefined,
    },
  }
}

export const adminDepositService = {
  async list(status?: string): Promise<AdminDeposit[]> {
    const response = await api.get('/api/admin/deposit-log', {
      params: status && status !== 'all' ? { status } : undefined,
    })
    const list = response.data?.deposits ?? response.data?.data ?? []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) =>
      normalizeAdminDeposit(item)
    )
  },

  async approve(id: string, payload?: { notes?: string }) {
    const response = await api.post(`/api/admin/deposit-log/${id}/approve`, payload)
    return response.data
  },

  async reject(id: string, payload?: { notes?: string }) {
    const response = await api.post(`/api/admin/deposit-log/${id}/reject`, payload)
    return response.data
  },
}

export const adminWithdrawalService = {
  async list(status?: string): Promise<AdminWithdrawal[]> {
    const response = await api.get('/api/admin/withdrawal-log', {
      params: status && status !== 'all' ? { status } : undefined,
    })
    const list = response.data?.withdrawals ?? response.data?.data ?? []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) =>
      normalizeAdminWithdrawal(item)
    )
  },

  async approve(id: string, payload?: { txHash?: string; notes?: string }) {
    const response = await api.post(`/api/admin/withdrawal-log/${id}/approve`, payload)
    return response.data
  },

  async reject(id: string, payload?: { notes?: string }) {
    const response = await api.post(`/api/admin/withdrawal-log/${id}/reject`, payload)
    return response.data
  },

  async complete(id: string, payload?: { txHash?: string; notes?: string }) {
    const response = await api.post(`/api/admin/withdrawal-log/${id}/complete`, payload)
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

  async adjustBalance(
    id: string,
    amount: number,
    operation: 'add' | 'subtract',
    note?: string,
    extras?: { logToDeposit?: boolean; logToWithdrawal?: boolean; notifyEmail?: boolean }
  ) {
    const response = await api.post(`/api/admin/users/${id}/balance`, {
      amount,
      operation,
      note,
      ...extras,
    })
    return response.data
  },

  async resetPassword(id: string, password: string) {
    const response = await api.post(`/api/admin/users/${id}/password`, { password })
    return response.data
  },

  async remove(id: string) {
    const response = await api.delete(`/api/admin/users/${id}`)
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
  async loginAs(id: string): Promise<{ token: string; user?: { id: string; email: string; name?: string } }> {
    const response = await api.post(`/api/admin/users/${id}/login-as`)
    return response.data
  },

  async loginAsByEmail(email: string): Promise<{ token: string; user?: { id: string; email: string; name?: string } }> {
    const response = await api.post('/api/admin/login-as-user-by-email', { email })
    return response.data
  },

  async updateProfile(
    id: string,
    payload: Partial<{ email: string; name: string; uniqueId: string; phone: string; isVerified: boolean }>
  ) {
    const response = await api.put(`/api/admin/users/${id}/profile`, payload)
    return response.data
  },

  async getWinTrade(id: string): Promise<WinTradeSlot[]> {
    const response = await api.get(`/api/admin/users/${id}/win-trade`)
    return response.data?.configs ?? response.data?.data ?? []
  },

  async saveWinTrade(id: string, configs: WinTradeSlot[]) {
    const response = await api.put(`/api/admin/users/${id}/win-trade`, { configs })
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
