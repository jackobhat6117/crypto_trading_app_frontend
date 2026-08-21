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
  description?: string
  balanceBefore?: number
  balanceAfter?: number
  createdAt: string
}

function normalizeStatus(value?: string): FinanceStatus {
  const status = (value || 'pending').toLowerCase()
  if (status === 'approved' || status === 'completed') return status === 'approved' ? 'approved' : 'completed'
  if (status === 'rejected' || status === 'cancelled') return status
  return 'pending'
}

export function normalizeDeposit(raw: Record<string, unknown>): DepositRecord {
  const amount = Number(raw.amount ?? 0)
  const coin = String(raw.coin || raw.coinSymbol || 'USDT')
  const status = normalizeStatus(String(raw.status || ''))
  return {
    _id: String(raw._id || raw.id || ''),
    coin,
    coinId: raw.coinId ? String(raw.coinId) : undefined,
    amount,
    status,
    address: raw.address ? String(raw.address) : undefined,
    network: raw.network ? String(raw.network) : undefined,
    txHash: raw.txHash ? String(raw.txHash) : raw.transactionId ? String(raw.transactionId) : undefined,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    paymentUrl: raw.paymentUrl ? String(raw.paymentUrl) : undefined,
    screenshot: raw.screenshot ? String(raw.screenshot) : undefined,
    adminNotes: raw.adminNotes ? String(raw.adminNotes) : undefined,
    description:
      raw.description
        ? String(raw.description)
        : `Deposit ${amount} USDT via ${coin} - Pending approval`,
    balanceBefore: raw.balanceBefore != null ? Number(raw.balanceBefore) : undefined,
    balanceAfter: raw.balanceAfter != null ? Number(raw.balanceAfter) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  }
}

export interface WithdrawalRecord {
  _id: string
  amount: number
  fee?: number
  netAmount?: number
  coin?: string
  address: string
  network?: string
  status: FinanceStatus
  txHash?: string
  adminNotes?: string
  balanceBefore?: number
  balanceAfter?: number
  createdAt: string
  approvedAt?: string
  completedAt?: string
}

export function normalizeWithdrawal(raw: Record<string, unknown>): WithdrawalRecord {
  const amount = Number(raw.amount ?? 0)
  const fee = raw.fee != null ? Number(raw.fee) : 0
  const netAmount = raw.netAmount != null ? Number(raw.netAmount) : Math.max(0, amount - fee)
  const coin = String(raw.coin || raw.coinSymbol || 'USDT')
  const network = raw.network ? String(raw.network) : undefined
  const coinLabel = network && coin === 'USDT' ? `${coin} ${network}` : coin

  return {
    _id: String(raw._id || raw.id || ''),
    amount,
    fee,
    netAmount,
    coin: coinLabel,
    address: String(raw.address || ''),
    network,
    status: normalizeStatus(String(raw.status || '')),
    txHash: raw.txHash ? String(raw.txHash) : undefined,
    adminNotes: raw.adminNotes ? String(raw.adminNotes) : undefined,
    balanceBefore: raw.balanceBefore != null ? Number(raw.balanceBefore) : undefined,
    balanceAfter: raw.balanceAfter != null ? Number(raw.balanceAfter) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    approvedAt: raw.approvedAt ? String(raw.approvedAt) : undefined,
    completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
  }
}

export interface WithdrawalSettings {
  minWithdrawal: number
  maxWithdrawal: number
  fee: number
  feeType: 'fixed' | 'percentage'
  allowWithdraw: boolean
}

export interface TransferCounterparty {
  _id?: string
  id?: string
  email?: string
  name?: string
  username?: string
  uniqueId?: string
}

export interface TransferRecord {
  _id: string
  amount: number
  fee?: number
  netAmount?: number
  status: FinanceStatus
  direction?: 'in' | 'out'
  coin?: string
  note?: string
  recipientEmail?: string
  senderEmail?: string
  counterparty?: TransferCounterparty
  description?: string
  balanceBefore?: number
  balanceAfter?: number
  createdAt: string
}

export function normalizeTransfer(raw: Record<string, unknown>): TransferRecord {
  const amount = Number(raw.amount ?? 0)
  const fee = raw.fee != null ? Number(raw.fee) : 0
  const netAmount = raw.netAmount != null ? Number(raw.netAmount) : Math.max(0, amount - fee)
  const coin = String(raw.coin || raw.coinSymbol || 'USDT')
  const status = normalizeStatus(String(raw.status || ''))
  const direction = raw.direction === 'in' || raw.direction === 'out' ? raw.direction : undefined
  const counterparty = (raw.counterparty || raw.recipient || raw.sender) as TransferCounterparty | undefined
  const counterpartyEmail = counterparty?.email
  const recipient = raw.recipient as TransferCounterparty | undefined
  const sender = raw.sender as TransferCounterparty | undefined

  const description =
    raw.description
      ? String(raw.description)
      : direction === 'in'
        ? `Received ${amount} ${coin} from ${counterpartyEmail || sender?.email || 'user'}`
        : `Transfer ${amount} ${coin} to ${counterpartyEmail || recipient?.email || 'user'}`

  return {
    _id: String(raw._id || raw.id || ''),
    amount,
    fee,
    netAmount,
    status,
    direction,
    coin,
    note: raw.note ? String(raw.note) : undefined,
    recipientEmail: raw.recipientEmail
      ? String(raw.recipientEmail)
      : recipient?.email || (direction === 'out' ? counterpartyEmail : undefined),
    senderEmail: raw.senderEmail
      ? String(raw.senderEmail)
      : sender?.email || (direction === 'in' ? counterpartyEmail : undefined),
    counterparty,
    description,
    balanceBefore: raw.balanceBefore != null ? Number(raw.balanceBefore) : undefined,
    balanceAfter: raw.balanceAfter != null ? Number(raw.balanceAfter) : undefined,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  }
}

export const depositService = {
  async create(coinId: string, amount: number) {
    const response = await api.post('/api/deposits/create', { coinId, amount })
    return response.data
  },

  async submit(depositId: string, txHash?: string, screenshot?: File) {
    return this.submitRequest({ depositId, txHash, screenshot })
  },

  async submitRequest(payload: {
    depositId?: string
    coinId?: string
    coinSymbol?: string
    amount?: number | string
    txHash?: string
    screenshot?: File
  }) {
    const form = new FormData()
    if (payload.depositId) form.append('depositId', payload.depositId)
    if (payload.coinId) form.append('coinId', payload.coinId)
    if (payload.coinSymbol) form.append('coinSymbol', payload.coinSymbol)
    if (payload.amount != null) form.append('amount', String(payload.amount))
    if (payload.txHash) form.append('txHash', payload.txHash)
    if (payload.screenshot) form.append('screenshot', payload.screenshot)
    const response = await api.post('/api/deposits/submit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getPaymentStatus(paymentId: string) {
    const response = await api.get(`/api/deposits/status/${paymentId}`)
    return response.data
  },

  async getHistory(): Promise<DepositRecord[]> {
    const response = await api.get('/api/deposits/history')
    const list = response.data.deposits || response.data.data || []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => normalizeDeposit(item))
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
    const list = response.data.withdrawals || response.data.data || []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => normalizeWithdrawal(item))
  },
}

export const transferService = {
  async create(payload: Record<string, unknown>) {
    const response = await api.post('/api/transfers/create', payload)
    return response.data
  },

  async getHistory(): Promise<TransferRecord[]> {
    const response = await api.get('/api/transfers/history')
    const list = response.data.transfers || response.data.data || []
    return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => normalizeTransfer(item))
  },

  async searchUsers(query: string) {
    const response = await api.get('/api/transfers/search', { params: { query } })
    return response.data.users || []
  },
}
