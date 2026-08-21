import api from './api'
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

export const authService = {
  async signin(credentials: SignInCredentials): Promise<{ token: string; user: User }> {
    const response = await api.post('/api/auth/signin', credentials)
    return { token: response.data.token, user: response.data.user }
  },

  async signup(data: SignUpData): Promise<{ token: string; user: User }> {
    const response = await api.post('/api/auth/signup', data)
    return { token: response.data.token, user: response.data.user }
  },

  async getMe(): Promise<User> {
    const response = await api.get('/api/auth/me')
    return response.data.user
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

  async verifyEmail(token: string): Promise<{ message?: string }> {
    const response = await api.post('/api/auth/verify-email', { token })
    return response.data
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

  async getNotifications() {
    const response = await api.get('/api/auth/notifications')
    return response.data
  },

  async markNotificationsRead(): Promise<void> {
    await api.post('/api/auth/notifications/read-all')
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.post(`/api/auth/notifications/${encodeURIComponent(id)}/read`)
  },

  async setFundPassword(_fundPassword: string) {
    return { success: true }
  },

  async updateFundPassword(_currentPassword: string, _newPassword: string) {
    return { success: true }
  },
}
