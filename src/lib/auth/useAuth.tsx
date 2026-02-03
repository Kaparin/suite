'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

// Storage keys
const AUTH_TOKEN_KEY = 'axiome_auth_token'
const AUTH_USER_KEY = 'axiome_auth_user'

export interface AuthUser {
  id: string
  telegramId: string | null
  telegramUsername: string | null
  telegramPhotoUrl: string | null
  telegramFirstName: string | null
  walletAddress: string | null
  isVerified: boolean
  plan: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
  refreshSession: () => Promise<boolean>
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session from storage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
        const storedUser = localStorage.getItem(AUTH_USER_KEY)

        if (storedToken && storedUser) {
          // Temporarily set user from storage for fast UI render
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Verify token with server
          try {
            const res = await fetch('/api/auth/session', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            })

            if (res.ok) {
              const data = await res.json()
              if (data.user) {
                setUser(data.user)
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
              }
            } else {
              // Token invalid, clear session
              console.log('Session invalid, clearing...')
              setToken(null)
              setUser(null)
              localStorage.removeItem(AUTH_TOKEN_KEY)
              localStorage.removeItem(AUTH_USER_KEY)
            }
          } catch (fetchError) {
            // Network error - keep local session for now
            console.warn('Could not verify session with server:', fetchError)
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  const login = useCallback((user: AuthUser, token: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }, [])

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!token) return false

    try {
      const res = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        logout()
        return false
      }

      const data = await res.json()
      if (data.user) {
        updateUser(data.user)
      }
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      return false
    }
  }, [token, logout, updateUser])

  const getToken = useCallback((): string | null => {
    return token || localStorage.getItem(AUTH_TOKEN_KEY)
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
        refreshSession,
        getToken
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Utility function to get auth headers
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) return {}

  return {
    'Authorization': `Bearer ${token}`
  }
}

// Hook for authenticated API calls
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth()

  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle 401 by logging out
    if (response.status === 401) {
      logout()
    }

    return response
  }, [token, logout])
}
