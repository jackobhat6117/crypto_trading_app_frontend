import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { authService } from '../services/authService'
import { sessionManager } from '../services/sessionManager'
import { refreshAccessToken } from '../services/sessionRefresh'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<User>
  signup: (email: string, password: string, name?: string, phone?: string) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const
const SESSION_CHECK_MS = 60_000

async function restoreSession(): Promise<User | null> {
  if (!sessionManager.hasAccessToken()) return null

  if (sessionManager.isSessionExpired()) {
    sessionManager.clearSession('expired')
    return null
  }

  if (sessionManager.isAccessTokenExpired() && sessionManager.getRefreshToken()) {
    try {
      const tokens = await refreshAccessToken(sessionManager.getRefreshToken()!)
      sessionManager.saveSession(tokens)
    } catch {
      sessionManager.clearSession('expired')
      return null
    }
  }

  try {
    const profile = await authService.getMe()
    sessionManager.updateUser(profile)
    return profile
  } catch {
    sessionManager.clearSession('expired')
    return null
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => sessionManager.getUser())
  const [loading, setLoading] = useState(true)

  const syncFromSession = useCallback(() => {
    setUser(sessionManager.getUser())
  }, [])

  useEffect(() => {
    let active = true

    const init = async () => {
      const profile = await restoreSession()
      if (active) {
        setUser(profile)
        setLoading(false)
      }
    }

    init()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return sessionManager.subscribe((event) => {
      if (event === 'cleared' || event === 'expired') {
        setUser(null)
        return
      }
      syncFromSession()
    })
  }, [syncFromSession])

  useEffect(() => {
    return sessionManager.initCrossTabSync((event) => {
      if (event === 'cleared' || event === 'expired') {
        setUser(null)
        return
      }
      syncFromSession()
    })
  }, [syncFromSession])

  useEffect(() => {
    const onActivity = () => sessionManager.touchActivity()
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }))
    return () => ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, onActivity))
  }, [])

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (!sessionManager.hasAccessToken()) return

      if (sessionManager.isSessionExpired()) {
        sessionManager.clearSession('expired')
        sessionManager.redirectToSignIn()
        return
      }

      if (sessionManager.isAccessTokenExpired() && sessionManager.getRefreshToken()) {
        try {
          const tokens = await refreshAccessToken(sessionManager.getRefreshToken()!)
          sessionManager.updateTokens(tokens)
          if (tokens.user) sessionManager.updateUser(tokens.user)
          syncFromSession()
        } catch {
          sessionManager.clearSession('expired')
          sessionManager.redirectToSignIn()
        }
      }
    }, SESSION_CHECK_MS)

    return () => window.clearInterval(interval)
  }, [syncFromSession])

  const signin = async (email: string, password: string) => {
    const tokens = await authService.signin({ email, password })
    sessionManager.saveSession(tokens)
    setUser(tokens.user)
    return tokens.user
  }

  const signup = async (email: string, password: string, name?: string, phone?: string) => {
    const result = await authService.signup({ email, password, name, phone })
    if (result.tokens) {
      sessionManager.saveSession(result.tokens)
      setUser(result.tokens.user)
      return result.tokens.user
    }
    throw new Error(result.message || 'Please verify your email to continue')
  }

  const refreshUser = async () => {
    const profile = await authService.getMe()
    sessionManager.updateUser(profile)
    setUser(profile)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Server-side invalidation is best-effort; always clear local session.
    } finally {
      sessionManager.clearSession()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signin,
        signup,
        logout,
        refreshUser,
        isAuthenticated: Boolean(user && sessionManager.hasAccessToken()),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
