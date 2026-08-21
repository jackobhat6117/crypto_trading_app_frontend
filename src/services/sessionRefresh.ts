import axios from 'axios'
import { API_URL } from './config'
import { AuthTokens, sessionManager } from './sessionManager'
import { User } from '../types'

const bareClient = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

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

function unwrapTokens(payload: Record<string, unknown> | undefined, fallbackUser?: User | null): AuthTokens {
  const nested = (payload?.data && typeof payload.data === 'object' ? payload.data : payload) as
    | Record<string, unknown>
    | undefined

  const accessToken = String(
    payload?.token || payload?.accessToken || nested?.token || nested?.accessToken || ''
  ).trim()

  const refreshToken = String(payload?.refreshToken || nested?.refreshToken || '').trim() || undefined

  const expiresIn = Number(payload?.expiresIn || nested?.expiresIn || 0)
  const user = (payload?.user || nested?.user || fallbackUser) as User | undefined

  if (!accessToken) {
    throw new Error('Invalid refresh response')
  }

  const jwtExp = decodeJwtExp(accessToken)
  const expiresAt = jwtExp ?? (expiresIn > 0 ? Date.now() + expiresIn * 1000 : null)

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user: user && typeof user === 'object' ? user : (fallbackUser as User),
  }
}

const REFRESH_PATHS = ['/api/auth/refresh', '/api/auth/refresh-token'] as const

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const currentUser = sessionManager.getUser()
  let lastError: unknown

  for (const path of REFRESH_PATHS) {
    try {
      const response = await bareClient.post(path, { refreshToken })
      return unwrapTokens(response.data as Record<string, unknown>, currentUser)
    } catch (error: unknown) {
      lastError = error
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) continue
      throw error
    }
  }

  throw lastError ?? new Error('Unable to refresh session')
}

export function shouldAttemptRefresh(url?: string): boolean {
  if (!url) return true
  const blocked = ['/api/auth/signin', '/api/auth/login', '/api/auth/signup', '/api/auth/register', '/api/auth/refresh', '/api/auth/refresh-token', '/api/auth/logout']
  return !blocked.some((segment) => url.includes(segment))
}
