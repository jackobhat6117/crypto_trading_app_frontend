import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/authService'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<User>
  signup: (email: string, password: string, name?: string) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const profile = await authService.getMe()
          setUser(profile)
          localStorage.setItem('user', JSON.stringify(profile))
        } catch {
          const stored = localStorage.getItem('user')
          if (stored) {
            try {
              setUser(JSON.parse(stored))
            } catch {
              localStorage.removeItem('user')
              localStorage.removeItem('token')
            }
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signin = async (email: string, password: string) => {
    const { token, user: authUser } = await authService.signin({ email, password })
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(authUser))
    setUser(authUser)
    return authUser
  }

  const signup = async (email: string, password: string, name?: string) => {
    const { token, user: authUser } = await authService.signup({ email, password, name })
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(authUser))
    setUser(authUser)
    return authUser
  }

  const refreshUser = async () => {
    const profile = await authService.getMe()
    setUser(profile)
    localStorage.setItem('user', JSON.stringify(profile))
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
        isAuthenticated: !!user,
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
