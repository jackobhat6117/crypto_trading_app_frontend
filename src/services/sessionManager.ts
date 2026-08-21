import { User } from '../types'

export const SESSION_STORAGE_KEY = 'crypto_auth_session'
const SESSION_CHANNEL = 'crypto_auth_channel'
const LEGACY_TOKEN_KEY = 'token'
const LEGACY_USER_KEY = 'user'

/** Refresh access token this many ms before JWT expiry. */
export const REFRESH_THRESHOLD_MS = 60_000
/** Sign out after this idle period (no user interaction). */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000
/** Hard cap on session lifetime from initial sign-in. */
export const ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000

export type SessionEvent = 'updated' | 'cleared' | 'expired'

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  expiresAt: number | null
  issuedAt: number
  lastActivityAt: number
  user: User | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number | null
  user: User
}

type SessionListener = (event: SessionEvent, session: AuthSession | null) => void

let cachedSession: AuthSession | null = null
const listeners = new Set<SessionListener>()
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SESSION_CHANNEL) : null

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

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as User
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return migrateLegacySession()
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.accessToken) return null
    return {
      ...parsed,
      user: normalizeUser(parsed.user),
    }
  } catch {
    return null
  }
}

function migrateLegacySession(): AuthSession | null {
  const accessToken = localStorage.getItem(LEGACY_TOKEN_KEY)?.trim()
  if (!accessToken) return null

  let user: User | null = null
  try {
    const legacyUser = localStorage.getItem(LEGACY_USER_KEY)
    user = legacyUser ? normalizeUser(JSON.parse(legacyUser)) : null
  } catch {
    user = null
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)

  const session: AuthSession = {
    accessToken,
    expiresAt: decodeJwtExp(accessToken),
    issuedAt: Date.now(),
    lastActivityAt: Date.now(),
    user,
  }
  persistSession(session)
  return session
}

function persistSession(session: AuthSession | null) {
  cachedSession = session
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
    return
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

function notify(event: SessionEvent, session: AuthSession | null) {
  listeners.forEach((listener) => listener(event, session))
}

function postChannel(event: SessionEvent) {
  channel?.postMessage({ type: event, at: Date.now() })
}

export const sessionManager = {
  getSession(): AuthSession | null {
    if (!cachedSession) cachedSession = readStoredSession()
    return cachedSession
  },

  getAccessToken(): string | null {
    const token = this.getSession()?.accessToken?.trim()
    return token || null
  },

  getRefreshToken(): string | null {
    const token = this.getSession()?.refreshToken?.trim()
    return token || null
  },

  getUser(): User | null {
    return this.getSession()?.user ?? null
  },

  hasAccessToken(): boolean {
    return Boolean(this.getAccessToken())
  },

  isAccessTokenExpired(thresholdMs = REFRESH_THRESHOLD_MS): boolean {
    const session = this.getSession()
    if (!session?.accessToken) return true
    if (!session.expiresAt) return false
    return Date.now() >= session.expiresAt - thresholdMs
  },

  isIdleExpired(): boolean {
    const session = this.getSession()
    if (!session) return false
    return Date.now() - session.lastActivityAt > IDLE_TIMEOUT_MS
  },

  isAbsoluteExpired(): boolean {
    const session = this.getSession()
    if (!session) return false
    return Date.now() - session.issuedAt > ABSOLUTE_TIMEOUT_MS
  },

  isSessionExpired(): boolean {
    return this.isIdleExpired() || this.isAbsoluteExpired()
  },

  touchActivity() {
    const session = this.getSession()
    if (!session) return
    const next = { ...session, lastActivityAt: Date.now() }
    persistSession(next)
  },

  buildSession(tokens: AuthTokens): AuthSession {
    const expiresAt = tokens.expiresAt ?? decodeJwtExp(tokens.accessToken)
    return {
      accessToken: tokens.accessToken.trim(),
      refreshToken: tokens.refreshToken?.trim() || undefined,
      expiresAt,
      issuedAt: Date.now(),
      lastActivityAt: Date.now(),
      user: tokens.user,
    }
  },

  saveSession(tokens: AuthTokens) {
    const session = this.buildSession(tokens)
    persistSession(session)
    notify('updated', session)
    postChannel('updated')
    return session
  },

  updateUser(user: User) {
    const session = this.getSession()
    if (!session) return
    const next = { ...session, user, lastActivityAt: Date.now() }
    persistSession(next)
    notify('updated', next)
  },

  updateTokens(partial: Pick<AuthTokens, 'accessToken' | 'refreshToken' | 'expiresAt'>) {
    const session = this.getSession()
    if (!session) return null
    const next: AuthSession = {
      ...session,
      accessToken: partial.accessToken.trim(),
      refreshToken: partial.refreshToken?.trim() || session.refreshToken,
      expiresAt: partial.expiresAt ?? decodeJwtExp(partial.accessToken) ?? session.expiresAt,
      lastActivityAt: Date.now(),
    }
    persistSession(next)
    notify('updated', next)
    postChannel('updated')
    return next
  },

  clearSession(reason: SessionEvent = 'cleared') {
    persistSession(null)
    notify(reason, null)
    postChannel(reason === 'expired' ? 'expired' : 'cleared')
  },

  subscribe(listener: SessionListener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  initCrossTabSync(onExternalChange: (event: SessionEvent) => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return
      cachedSession = readStoredSession()
      onExternalChange(event.newValue ? 'updated' : 'cleared')
    }

    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type as SessionEvent | undefined
      if (!type) return
      cachedSession = readStoredSession()
      onExternalChange(type)
    }

    window.addEventListener('storage', onStorage)
    channel?.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('storage', onStorage)
      channel?.removeEventListener('message', onMessage)
    }
  },

  redirectToSignIn() {
    const path = window.location.pathname || '/'
    const isAdmin = path.startsWith('/admin') || path.startsWith('/subadmin')
    if (path.includes('/signin') || path.includes('/signup') || path === '/') return
    window.location.href = isAdmin ? '/admin/signin' : '/signin'
  },
}
