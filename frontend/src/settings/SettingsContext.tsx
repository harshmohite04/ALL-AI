import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Accent = 'default' | 'blue' | 'green' | 'purple' | 'pink' | 'orange'

export type Settings = {
  theme: Theme
  accent: Accent
  language: 'auto' | string
  spokenLanguage: 'auto' | string
  voice: string | null
  notifications: {
    desktop: boolean
    sound: boolean
  }
}

type SettingsContextType = {
  settings: Settings
  setSettings: (s: Partial<Settings>) => void
  isOpen: boolean
  openSettings: (section?: SettingsSection) => void
  closeSettings: () => void
  activeSection: SettingsSection
}

export type SettingsSection = 'general' | 'notifications' | 'personalization' | 'connected' | 'data' | 'security' | 'account'

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: 'default',
  language: 'auto',
  spokenLanguage: 'auto',
  voice: null,
  notifications: {
    desktop: false,
    sound: false,
  },
}

const TOKEN_COOKIE = 'allai_settings'

function setCookie(name: string, value: string, days: number) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1)
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length))
    }
    return null
  } catch {
    return null
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const raw = getCookie(TOKEN_COOKIE)
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {}
    return DEFAULT_SETTINGS
  })

  // persist on change
  useEffect(() => {
    try { setCookie(TOKEN_COOKIE, JSON.stringify(settings), 365) } catch {}
  }, [settings])

  // apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)
    root.classList.toggle('dark', shouldDark)
  }, [settings.theme])

  const setSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState(prev => ({ ...prev, ...partial }))
  }, [])

  const openSettings = useCallback((section: SettingsSection = 'general') => {
    setActiveSection(section)
    setOpen(true)
  }, [])

  const closeSettings = useCallback(() => setOpen(false), [])

  const value = useMemo<SettingsContextType>(() => ({
    settings,
    setSettings,
    isOpen,
    openSettings,
    closeSettings,
    activeSection,
  }), [settings, setSettings, isOpen, openSettings, closeSettings, activeSection])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
