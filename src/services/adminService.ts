import api from './api'

// ─────────────────────────────────────────── Types ──────────────────────────────────────────

export interface DashboardMetrics {
    totalBalances: Record<string, { balance: number; locked: number; total: number }>
    netExposure: Record<string, number>
    totalFeesEarned: { total: number }
    pendingCounts: { deposits: number; withdrawals: number; trades: number }
    systemStatus: { tradingEnabled: boolean; withdrawalsEnabled: boolean; maintenanceMode: boolean; lastUpdated: string }
    userStats: { total: number; active: number }
}

export interface PlatformStats {
    trades: { count: number; volume: number }
    deposits: { count: number; amount: number }
    withdrawals: { count: number; amount: number }
    users: { newUsers: number }
    fees: { total: number }
    period: { startDate?: string; endDate?: string }
}

export interface SystemHealth {
    failedTransactions24h: number
    failedTrades24h: number
    frozenUsers: number
    exposureLimitsConfigured: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    timestamp: string
}

export interface ActivityItem {
    type: 'TRADE' | 'TRANSACTION' | 'ADMIN_ACTION'
    id: string
    userId?: string
    adminId?: string
    user?: { id: string; email: string; name: string }
    admin?: { id: string; email: string; name: string; adminRole: string }
    details: Record<string, any>
    timestamp: string
}

export interface AdminUser {
    id: string
    _id?: string
    email: string
    name: string
    uniqueId?: string | null
    phone?: string | null
    role: string
    adminRole?: string
    isActive: boolean
    isVerified: boolean
    allowTrade?: boolean
    allowWithdraw?: boolean
    noticeMessage?: string
    createdAt: string
    lastLoginAt?: string | null
    wallets: Array<{ asset: string; balance: number; lockedBalance: number }>
    flags?: {
        tradingFrozen: boolean
        withdrawalsFrozen: boolean
        flagReason?: string
        internalNotes?: string
    } | null
    recentTrades?: Array<{ id: string; symbol: string; side: string; amount: number; status: string; createdAt: string }>
    recentTransactions?: Array<{ id: string; type: string; amount: number; status: string; createdAt: string }>
}

export interface AdminTransaction {
    id: string
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'SPOT_BUY' | 'SPOT_SELL' | string
    amount: number
    asset: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
    txHash?: string
    address?: string
    userId: string
    user?: { email: string }
    notes?: string
    createdAt: string
}

export interface SpotTrade {
    id: string
    userId: string
    user?: { id: string; email: string; name: string }
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    price: number
    quoteAmount: number
    fee: number
    status: string
    createdAt: string
}

export interface OrderItem {
    id: string
    userId: string
    user?: { id: string; email: string; name: string }
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    limitPrice?: number
    triggerPrice?: number
    stopPrice?: number
    lockedAmount?: number
    status: string
    createdAt: string
}

export interface TradeSummary {
    spotTrades: Record<string, number>
    pendingOrders: { limitOrders: number; stopOrders: number; stopLimitOrders: number; total: number }
    volume24h: number
    fees24h: number
}

export interface ExposureReport {
    exposures: Array<{ asset: string; netExposure: number; totalBuy: number; totalSell: number }>
}

export interface PlatformBalance {
    asset: string
    totalBalance: number
    totalLocked: number
    available: number
}

export interface AuditLog {
    id: string
    adminId: string
    admin?: { email: string; name: string; adminRole: string }
    actionType: string
    targetType: string
    targetId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    createdAt: string
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

// ─────────────────────────────────────────── Service ──────────────────────────────────────────

export const adminService = {
    // ── Dashboard ──────────────────────────────────────────────────────────────
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const r = await api.get<{ success: boolean; data: DashboardMetrics }>('/api/admin/dashboard')
        return r.data.data
    },

    async getPlatformStats(period?: '24h' | '7d' | '30d'): Promise<PlatformStats> {
        const now = new Date()
        const from = period === '24h'
            ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
            : period === '7d'
                ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const r = await api.get<{ success: boolean; data: PlatformStats }>('/api/admin/dashboard/stats', {
            params: { startDate: from.toISOString(), endDate: now.toISOString() },
        })
        return r.data.data
    },

    async getRecentActivity(limit = 30): Promise<ActivityItem[]> {
        const r = await api.get<{ success: boolean; data: ActivityItem[] }>('/api/admin/dashboard/activity', {
            params: { limit },
        })
        return r.data.data
    },

    async getSystemHealth(): Promise<SystemHealth> {
        const r = await api.get<{ success: boolean; data: SystemHealth }>('/api/admin/dashboard/health')
        return r.data.data
    },

    // ── Users ──────────────────────────────────────────────────────────────────
    async getUsers(opts?: {
        page?: number; limit?: number; search?: string;
        tradingFrozen?: boolean; withdrawalsFrozen?: boolean
    }): Promise<{ users: AdminUser[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminUser[]; pagination: Pagination }>('/api/admin/users', {
            params: opts,
        })
        return { users: r.data.data, pagination: r.data.pagination }
    },

    async getUserDetail(id: string): Promise<AdminUser> {
        const r = await api.get<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`)
        return r.data.data
    },

    async freezeTrading(id: string, reason: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/freeze-trading`, { reason })
    },

    async unfreezeTrading(id: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/unfreeze-trading`)
    },

    async freezeWithdrawals(id: string, reason: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/freeze-withdrawals`, { reason })
    },

    async unfreezeWithdrawals(id: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/unfreeze-withdrawals`)
    },

    async suspendUser(id: string, reason: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/suspend`, { reason })
    },

    async activateUser(id: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/activate`)
    },

    async resetFundPassword(id: string): Promise<void> {
        await api.delete(`/api/admin/users/${id}/fund-password`)
    },

    async adjustUserBalance(id: string, asset: string, amount: number, reason: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/adjust-balance`, { asset, amount, reason })
    },

    async getUserTrades(id: string, params?: { page?: number; limit?: number }): Promise<{ data: SpotTrade[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: SpotTrade[]; pagination: Pagination }>(`/api/admin/users/${id}/trades`, { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getUserTransactions(id: string, params?: { page?: number; limit?: number; type?: string }): Promise<{ data: AdminTransaction[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[]; pagination: Pagination }>(`/api/admin/users/${id}/transactions`, { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async addUserNote(id: string, note: string): Promise<void> {
        await api.post(`/api/admin/users/${id}/notes`, { note })
    },

    // ── Transactions ──────────────────────────────────────────────────────────
    async getPendingDeposits(): Promise<AdminTransaction[]> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[] }>('/api/admin/deposits/pending')
        return r.data.data
    },

    async getPendingWithdrawals(): Promise<AdminTransaction[]> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[] }>('/api/admin/withdrawals/pending')
        return r.data.data
    },

    async approveDeposit(id: string, notes?: string): Promise<void> {
        await api.post(`/api/admin/deposits/${id}/approve`, { notes })
    },

    async rejectDeposit(id: string, reason: string): Promise<void> {
        await api.post(`/api/admin/deposits/${id}/reject`, { reason })
    },

    async approveWithdrawal(id: string, txHash?: string): Promise<void> {
        await api.post(`/api/admin/withdrawals/${id}/approve`, { txHash })
    },

    async rejectWithdrawal(id: string, reason: string): Promise<void> {
        await api.post(`/api/admin/withdrawals/${id}/reject`, { reason })
    },

    // ── Trades & Orders ───────────────────────────────────────────────────────
    async getTradeSummary(): Promise<TradeSummary> {
        const r = await api.get<{ success: boolean; data: TradeSummary }>('/api/admin/trades/summary')
        return r.data.data
    },

    async getSpotTrades(params?: {
        page?: number; limit?: number; userId?: string;
        symbol?: string; side?: string; status?: string; from?: string; to?: string
    }): Promise<{ data: SpotTrade[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: SpotTrade[]; pagination: Pagination }>('/api/admin/trades/spot', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getLimitOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/api/admin/trades/limit-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getStopOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/api/admin/trades/stop-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getStopLimitOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/api/admin/trades/stop-limit-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async cancelLimitOrder(id: string): Promise<void> {
        await api.post(`/api/admin/trades/limit-orders/${id}/cancel`)
    },

    async cancelStopOrder(id: string): Promise<void> {
        await api.post(`/api/admin/trades/stop-orders/${id}/cancel`)
    },

    // ── Risk ──────────────────────────────────────────────────────────────────
    async getExposure(): Promise<ExposureReport> {
        const r = await api.get<{ success: boolean; data: ExposureReport }>('/api/admin/risk/exposure')
        return r.data.data
    },

    async getOpenOrdersSummary() {
        const r = await api.get<{ success: boolean; data: any }>('/api/admin/risk/open-orders')
        return r.data.data
    },

    async getLargeTransactions(threshold = 10000) {
        const r = await api.get<{ success: boolean; data: any }>('/api/admin/risk/large-transactions', {
            params: { threshold },
        })
        return r.data.data
    },

    async getPlatformBalances(): Promise<PlatformBalance[]> {
        const r = await api.get<{ success: boolean; data: PlatformBalance[] }>('/api/admin/risk/balances')
        return r.data.data
    },

    // ── Config ────────────────────────────────────────────────────────────────
    async getSystemConfig(category?: string) {
        const r = await api.get<{ success: boolean; data: any[] }>('/api/admin/config', { params: { category } })
        return r.data.data
    },

    async updateSystemConfig(key: string, value: string, category?: string): Promise<void> {
        await api.put('/api/admin/config', { key, value, category })
    },

    async pauseTrading(reason: string = 'Admin action'): Promise<void> {
        await api.post('/api/admin/trading/pause', { reason })
    },

    async resumeTrading(): Promise<void> {
        await api.post('/api/admin/trading/resume')
    },

    async toggleWithdrawals(enabled: boolean, reason: string = 'Admin action'): Promise<void> {
        await api.post('/api/admin/config/toggle-withdrawals', { enabled, reason })
    },

    async toggleMaintenance(enabled: boolean, reason: string = 'Admin action'): Promise<void> {
        await api.post('/api/admin/config/toggle-maintenance', { enabled, reason })
    },

    async updateSpread(symbol: string, spread: number): Promise<void> {
        await api.post('/api/admin/trading/spread', { symbol, spread })
    },

    async updateFee(fee: number): Promise<void> {
        await api.post('/api/admin/trading/fee', { fee })
    },

    // ── Audit Logs ────────────────────────────────────────────────────────────
    async getAuditLogs(params?: {
        page?: number; limit?: number;
        adminId?: string; actionType?: string; targetType?: string;
        from?: string; to?: string
    }): Promise<{ data: AuditLog[]; pagination?: Pagination }> {
        const r = await api.get<{ success: boolean; data: any }>('/api/admin/audit-logs', { params })
        // The existing service returns an object with logs array and pagination
        if (Array.isArray(r.data.data)) {
            return { data: r.data.data }
        }
        return { data: r.data.data?.logs || [], pagination: r.data.data?.pagination }
    },

    async getTransactionHistory(params?: {
        page?: number; limit?: number; type?: string; status?: string; userId?: string
    }): Promise<{ data: AdminTransaction[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[]; pagination: Pagination }>('/api/admin/transactions/history', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },
}
