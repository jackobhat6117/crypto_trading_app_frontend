import api from './api'

export type FinanceStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'

export interface DepositRecord {
  _id: string
  coin?: string
  coinId?: string
  amount: number
  status: FinanceStatus
  address?: string
  network?: string
  txHash?: string
  paymentId?: string
  paymentUrl?: string
  screenshot?: string
  adminNotes?: string
  createdAt: string
}

export interface WithdrawalRecord {
  _id: string
  amount: number
  fee?: number
  netAmount?: number
  address: string
  network?: string
  status: FinanceStatus
  adminNotes?: string
  createdAt: string
  approvedAt?: string
  completedAt?: string
}

export interface WithdrawalSettings {
  minWithdrawal: number
  maxWithdrawal: number
  fee: number
  feeType: 'fixed' | 'percentage'
  allowWithdraw: boolean
}

export const depositService = {
  async create(coinId: string, amount: number) {
    const response = await api.post('/api/deposits/create', { coinId, amount })
    return response.data
  },

  async submit(depositId: string, txHash?: string, screenshot?: File) {
    if (screenshot) {
      const form = new FormData()
      form.append('depositId', depositId)
      if (txHash) form.append('txHash', txHash)
      form.append('screenshot', screenshot)
      const response = await api.post('/api/deposits/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    }
    const response = await api.post('/api/deposits/submit', { depositId, txHash })
    return response.data
  },

  async getPaymentStatus(paymentId: string) {
    const response = await api.get(`/api/deposits/status/${paymentId}`)
    return response.data
  },

  async getHistory(): Promise<DepositRecord[]> {
    const response = await api.get('/api/deposits/history')
    return response.data.deposits || []
  },
}

export const withdrawalService = {
  async getSettings(): Promise<WithdrawalSettings> {
    const response = await api.get('/api/withdrawals/settings')
    const data = response.data?.settings ?? response.data ?? {}
    return {
      minWithdrawal: Number(data.minWithdrawal ?? data.minWithdraw ?? 0),
      maxWithdrawal: Number(data.maxWithdrawal ?? data.maxWithdraw ?? 0),
      fee: Number(data.fee ?? data.withdrawalFee ?? 0),
      feeType: data.feeType === 'percentage' ? 'percentage' : 'fixed',
      allowWithdraw: data.allowWithdraw ?? true,
    }
  },

  async create(payload: Record<string, unknown>) {
    const response = await api.post('/api/withdrawals/create', payload)
    return response.data
  },

  async getById(id: string): Promise<WithdrawalRecord | null> {
    const response = await api.get(`/api/withdrawals/${id}`)
    return response.data?.withdrawal ?? response.data?.data ?? null
  },

  async cancel(id: string) {
    const response = await api.post(`/api/withdrawals/${id}/cancel`)
    return response.data
  },

  async getHistory(): Promise<WithdrawalRecord[]> {
    const response = await api.get('/api/withdrawals/history')
    return response.data.withdrawals || []
  },
}

export const transferService = {
  async create(payload: Record<string, unknown>) {
    const response = await api.post('/api/transfers/create', payload)
    return response.data
  },

  async getHistory() {
    const response = await api.get('/api/transfers/history')
    return response.data.transfers || []
  },

  async searchUsers(query: string) {
    const response = await api.get('/api/transfers/search', { params: { query } })
    return response.data.users || []
  },
}
