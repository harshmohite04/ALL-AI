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

const STORAGE_KEY = 'allai_auth_v1'

// Base URL for API calls. In development, the Vite proxy can be used with empty base.
// In production, set VITE_API_BASE_URL to your backend URL, e.g. https://api.example.com
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

function apiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${cleanPath}`
}

function loadFromStorage(): { token: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    return JSON.parse(raw)
  } catch {
    return { token: null, user: null }
  }
}

function saveToStorage(state: { token: string | null; user: User | null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
