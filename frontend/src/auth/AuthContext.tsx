import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type User = {
  id: string
  email: string
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthModalOpen: boolean
  openAuth: (tab?: 'signin' | 'signup') => void
  closeAuth: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  activeTab: 'signin' | 'signup'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const TOKEN_COOKIE = 'allai_token'
const USER_COOKIE = 'allai_user'

// Base URL for API calls. In development, the Vite proxy can be used with empty base.
// In production, set VITE_API_BASE_URL to your backend URL, e.g. https://api.example.com
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

function apiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${cleanPath}`
}

// --- Cookie helpers ---
function setCookie(name: string, value: string, days: number) {
  try {
    const expires = (() => {
      const d = new Date()
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
      return `; expires=${d.toUTCString()}`
    })()
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
    return null
  } catch {
    return null
  }
}

function eraseCookie(name: string) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  } catch {}
}

function loadFromStorage(): { token: string | null; user: User | null } {
  // Read only from cookies
  try {
    const token = getCookie(TOKEN_COOKIE)
    const userRaw = getCookie(USER_COOKIE)
    const user = userRaw ? (JSON.parse(userRaw) as User) : null
    return { token: token || null, user }
  } catch {
    return { token: null, user: null }
  }
}

function saveToStorage(state: { token: string | null; user: User | null }) {
  try {
    // Align cookie max-age with backend token expiry (7d)
    const days = 7
    if (state.token) setCookie(TOKEN_COOKIE, state.token, days)
    else eraseCookie(TOKEN_COOKIE)

    if (state.user) setCookie(USER_COOKIE, JSON.stringify(state.user), days)
    else eraseCookie(USER_COOKIE)
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ token, user }, setAuth] = useState<{ token: string | null; user: User | null }>(() => loadFromStorage())
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    saveToStorage({ token, user })
  }, [token, user])

  const openAuth = useCallback((tab: 'signin' | 'signup' = 'signin') => {
    setActiveTab(tab)
    setAuthModalOpen(true)
  }, [])

  const closeAuth = useCallback(() => setAuthModalOpen(false), [])

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Sign in failed (${res.status})`)
      }
      const data = await res.json().catch(() => ({} as any))
      if (!data?.token || !data?.user) throw new Error('Invalid response from server')
      setAuth({ token: data.token, user: data.user as User })
      setAuthModalOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Sign up failed (${res.status})`)
      }
      const data = await res.json().catch(() => ({} as any))
      if (!data?.token || !data?.user) throw new Error('Invalid response from server')
      setAuth({ token: data.token, user: data.user as User })
      setAuthModalOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      setAuth({ token: null, user: null })
      // Ensure cookies are removed immediately
      eraseCookie(TOKEN_COOKIE)
      eraseCookie(USER_COOKIE)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isLoading,
    isAuthModalOpen,
    openAuth,
    closeAuth,
    signIn,
    signUp,
    signOut,
    activeTab,
  }), [user, token, isLoading, isAuthModalOpen, openAuth, closeAuth, signIn, signUp, signOut, activeTab])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
