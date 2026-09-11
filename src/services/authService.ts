import api from './api'
import { AuthTokens } from './sessionManager'
import { User } from '../types'

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  name?: string
  username?: string
  phone?: string
}

export interface SignUpResult {
  requiresVerification: boolean
  email: string
  message?: string
  emailSent?: boolean
  tokens?: AuthTokens
}

export interface TwoFactorStatus {
  enabled: boolean
}

export interface TwoFactorSetup {
  secret: string
  otpauthUrl: string
  qrCode?: string
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export type NotificationType = 'success' | 'warning' | 'error' | 'info'

export interface AppNotification {
  _id: string
  title: string
  message: string
  read: boolean
  type: NotificationType
  createdAt: string
}

function asNotificationType(value: unknown): NotificationType {
  if (value === 'success' || value === 'warning' || value === 'error' || value === 'info') return value
  return 'info'
}

function extractNotificationList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const data = payload as Record<string, unknown>
  const nested = data.data
  const candidates = [data.notifications, data.items, nested]
  if (nested && typeof nested === 'object') {
    const inner = nested as Record<string, unknown>
    candidates.push(inner.notifications, inner.items, inner.data)
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = String(item._id || item.id || '').trim()
  if (!id) return null
  return {
    _id: id,
    title: String(item.title || item.subject || 'Notification'),
    message: String(item.message || item.body || item.content || ''),
    read: Boolean(item.read ?? item.isRead),
    type: asNotificationType(item.type),
    createdAt: String(item.createdAt || item.created_at || new Date().toISOString()),
  }
}

async function withMethodFallback(request: (method: 'put' | 'post') => Promise<unknown>) {
  try {
    await request('put')
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 405) {
      await request('post')
      return
    }
    throw error
  }
}

function decodeJwtExp(token: string): number | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function unwrapAuth(payload: Record<string, unknown> | undefined): AuthTokens {
  const nested = (payload?.data && typeof payload.data === 'object' ? payload.data : payload) as
    | Record<string, unknown>
    | undefined
  const accessToken = String(payload?.token || payload?.accessToken || nested?.token || nested?.accessToken || '')
  const refreshToken = String(payload?.refreshToken || nested?.refreshToken || '').trim() || undefined
  const expiresIn = Number(payload?.expiresIn || nested?.expiresIn || 0)
  const user = (payload?.user || nested?.user || nested) as User | undefined
  if (!accessToken || !user || typeof user !== 'object') {
    throw new Error('Invalid authentication response')
  }
  const jwtExp = decodeJwtExp(accessToken)
  const expiresAt = jwtExp ?? (expiresIn > 0 ? Date.now() + expiresIn * 1000 : null)
  return {
    accessToken: accessToken.trim(),
    refreshToken,
    expiresAt,
    user,
  }
}

export const authService = {
  async signin(credentials: SignInCredentials): Promise<AuthTokens> {
    try {
      const response = await api.post('/api/auth/signin', credentials)
      return unwrapAuth(response.data)
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status !== 404) throw error
      const response = await api.post('/api/auth/login', credentials)
      return unwrapAuth(response.data)
    }
  },

  async signup(data: SignUpData): Promise<SignUpResult> {
    const postSignup = async (path: string) => {
      const response = await api.post(path, data)
      const payload = response.data as Record<string, unknown>
      if (payload.requiresVerification === true) {
        return {
          requiresVerification: true as const,
          email: String(payload.email || data.email),
          message: typeof payload.message === 'string' ? payload.message : undefined,
          emailSent: payload.emailSent !== false,
        }
      }
      return {
        requiresVerification: false as const,
        email: data.email,
        tokens: unwrapAuth(payload),
      }
    }

    try {
      return await postSignup('/api/auth/signup')
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status !== 404) throw error
      return postSignup('/api/auth/register')
    }
  },

  async getMe(): Promise<User> {
    try {
      const response = await api.get('/api/auth/me')
      return (response.data?.user ?? response.data?.data ?? response.data) as User
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status !== 404) throw error
      const response = await api.get('/api/auth/profile')
      return (response.data?.user ?? response.data?.data ?? response.data) as User
    }
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', { currentPassword, newPassword })
  },

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const response = await api.post('/api/auth/check-email', { email })
    return response.data
  },

  async forgotPassword(email: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword(token: string, password: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/reset-password', { token, password })
    return response.data
  },

  async verifyEmail(email: string, code: string): Promise<{ tokens?: AuthTokens; message?: string }> {
    const response = await api.post('/api/auth/verify-email', { email, code })
    const payload = response.data as Record<string, unknown>
    const message = typeof payload.message === 'string' ? payload.message : undefined
    // Newly verified accounts come back with a session; already-verified ones don't.
    if (payload.token || payload.accessToken) {
      return { tokens: unwrapAuth(payload), message }
    }
    return { message }
  },

  async resendVerification(email?: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/resend-verification', { email })
    return response.data
  },

  async getTwoFactorStatus(): Promise<TwoFactorStatus> {
    const response = await api.get('/api/auth/2fa/status')
    return { enabled: Boolean(response.data?.enabled ?? response.data?.twoFactorEnabled) }
  },

  async setupTwoFactor(): Promise<TwoFactorSetup> {
    const response = await api.post('/api/auth/2fa/setup')
    return {
      secret: response.data?.secret ?? '',
      otpauthUrl: response.data?.otpauthUrl ?? response.data?.otpauth_url ?? '',
      qrCode: response.data?.qrCode,
    }
  },

  async verifyTwoFactor(token: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/2fa/verify', { token })
    return response.data
  },

  async disableTwoFactor(token: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/2fa/disable', { token })
    return response.data
  },

  async setLanguage(language: string): Promise<void> {
    await api.post('/api/auth/language', { language })
  },

  async getNotifications(): Promise<AppNotification[]> {
    const response = await api.get('/api/auth/notifications')
    return extractNotificationList(response.data)
      .map(normalizeNotification)
      .filter((item): item is AppNotification => Boolean(item))
  },

  async markNotificationsRead(): Promise<void> {
    await withMethodFallback((method) => api[method]('/api/auth/notifications/read-all'))
  },

  async markNotificationRead(id: string): Promise<void> {
    const path = `/api/auth/notifications/${encodeURIComponent(id)}/read`
    await withMethodFallback((method) => api[method](path))
  },

  async setFundPassword(_fundPassword: string) {
    return { success: true }
  },

  async updateFundPassword(_currentPassword: string, _newPassword: string) {
    return { success: true }
  },
}
