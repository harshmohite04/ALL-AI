import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface Model {
  id: string
  name: string
  color: string
  icon: string
  versions: string[]
}

interface SidebarProps {
  models: Model[]
  enabledModels: { [key: string]: boolean }
  onToggleModel: (models: { [key: string]: boolean }) => void
  selectedVersions: { [key: string]: string }
  onVersionChange: (versions: { [key: string]: string }) => void
  enabledCount: number
  conversations: Conversation[]
  activeConversationId: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRenameConversation: (id: string, newTitle: string) => Promise<void>
  onDeleteConversation: (id: string) => Promise<void>
  // role and generation controls
  activeRole: string
  onRoleChange: (role: string) => void
  selectedImageProviders: Array<'Midjourney' | 'DALL·E 3' | 'Stable Diffusion'>
  onToggleImageProvider: (p: 'Midjourney' | 'DALL·E 3' | 'Stable Diffusion', enabled: boolean) => void
  selectedVideoProviders: Array<'Runway Gen-2' | 'Nano Banana' | 'Google Veo'>
  onToggleVideoProvider: (p: 'Runway Gen-2' | 'Nano Banana' | 'Google Veo', enabled: boolean) => void
  plan: 'basic' | 'premium'
  // collapse
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export default function Sidebar({ models, enabledModels, onToggleModel, selectedVersions: _selectedVersions, onVersionChange: _onVersionChange, conversations, activeConversationId, onSelectConversation, onNewChat, onRenameConversation, onDeleteConversation, activeRole, onRoleChange, selectedImageProviders: _selectedImageProviders, onToggleImageProvider: _onToggleImageProvider, selectedVideoProviders: _selectedVideoProviders, onToggleVideoProvider: _onToggleVideoProvider, plan, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const { user, openAuth, signOut, isLoading } = useAuth()

  // Sidebar segmented control: 'chat' | 'model' | 'role'
  const [activeTab, setActiveTab] = useState<'chat' | 'model' | 'role'>('chat')

  // Roles list (simple example)
  const [roles] = useState<string[]>([
    'General',
    'Finance',
    'Coding',
    'Coder',
    'Legal',
    'Doctor',
    'Learning',
    'Marketing',
    'Image Generation',
    'Video Generation',
  ])

  // Basic plan locks (deepseek is allowed for basic)
  const BASIC_LOCKED = new Set(['claude', 'perplexity', 'cohere', 'grok'])

  // Upgrade modal state
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const handleToggleModel = (modelId: string) => {
    if (plan === 'basic' && BASIC_LOCKED.has(modelId)) {
      // Show upgrade modal instead of inline notice
      setShowUpgrade(true)
      return
    }
    onToggleModel({
      ...enabledModels,
      [modelId]: !enabledModels[modelId]
    })
  }

  // Version selection happens in the on-screen model header now

  // Lightweight toast/notice for UX instead of window.alert
  const [notice, setNotice] = useState<{ text: string; kind?: 'info' | 'warning' } | null>(null)
  const showNotice = (text: string, kind: 'info' | 'warning' = 'warning') => {
    setNotice({ text, kind })
    window.clearTimeout((showNotice as any)._t)
    ;(showNotice as any)._t = window.setTimeout(() => setNotice(null), 3500)
  }

  // Resolve logo URLs similar to MultiModelChat
  const logoModules = import.meta.glob('../assets/logos/*.{svg,png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
  const getLogoUrl = (modelId: string): string | null => {
    const entry = Object.entries(logoModules).find(([path]) => path.includes(`/logos/${modelId}.`))
    return entry ? entry[1] : null
  }

  // Manage which conversation menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const toggleMenu = (id: string) => {
    setOpenMenuId(prev => (prev === id ? null : id))
  }

  const handleRename = async (id: string, currentTitle: string) => {
    // Start inline editing mode
    setEditingId(id)
    setEditingTitle(currentTitle)
    setOpenMenuId(null)
  }

  const handleDelete = async (id: string) => {
    // Open custom confirmation modal
    const conv = conversations.find(c => c.id === id)
    setPendingDelete({ id, title: conv?.title || 'this session' })
    setOpenMenuId(null)
  }

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      // Focus and select all text like Windows Explorer
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const saveEdit = async () => {
    if (!editingId) return
    const name = editingTitle.trim()
    if (name) {
      await onRenameConversation(editingId, name)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  // Close three-dot menu on outside click
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Any element that is part of the menu/button should have this attribute
      if (target.closest('[data-menu-container="true"]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  // Delete confirmation modal state
  const [pendingDelete, setPendingDelete] = useState<{ id: string, title: string } | null>(null)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await onDeleteConversation(pendingDelete.id)
    setPendingDelete(null)
  }

  const dismissDelete = () => setPendingDelete(null)

  // Esc to close delete modal
  useEffect(() => {
    if (!pendingDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingDelete(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pendingDelete])

  // User profile menu state (bottom-left like ChatGPT)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userBtnRef = useRef<HTMLButtonElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (userBtnRef.current?.contains(t)) return
      if (userMenuRef.current?.contains(t)) return
      setIsUserMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsUserMenuOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Avatar helpers
  const displayName = user?.name || user?.email || 'Guest'
  const initials = (user?.name || user?.email || '?').split(/\s|@/)[0].slice(0, 2).toUpperCase()
  const avatarUrl = (user as any)?.photoURL || (user as any)?.avatar || ''
  const email = user?.email || ''

  return (
    <div className={`w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col h-full shadow-2xl transform will-change-transform transition-all duration-300 ease-in-out ${collapsed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 relative transition-opacity duration-200">
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => onToggleCollapsed?.()}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="absolute right-2 top-2 p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ease-in-out ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3 mb-4">
          <img src="/allmodels.png" alt="All Models" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-white">
              All Models
            </h1>
          </div>
        </div>
        <button onClick={onNewChat} className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-all duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm">New Chat</span>
        </button>
      </div>

      {/* Segmented Control */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="inline-flex bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${activeTab === 'chat' ? 'bg-gray-700 text-white border-gray-600' : 'text-gray-300 border-transparent hover:bg-gray-700/50'}`}
          >
            CHAT
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${activeTab === 'model' ? 'bg-gray-700 text-white border-gray-600' : 'text-gray-300 border-transparent hover:bg-gray-700/50'}`}
          >
            Model
          </button>
          <button
            onClick={() => setActiveTab('role')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${activeTab === 'role' ? 'bg-gray-700 text-white border-gray-600' : 'text-gray-300 border-transparent hover:bg-gray-700/50'}`}
          >
            Role
          </button>
        </div>
      </div>

      {/* Dynamic List Area */}
      <div className="flex-1 overflow-y-auto p-4 dark-scrollbar">
        {activeTab === 'chat' && (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div key={conversation.id} className={`group relative w-full p-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${
                activeConversationId === conversation.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}>
                <button onClick={() => onSelectConversation(conversation.id)} className="flex-1 text-left min-w-0">
                  {editingId === conversation.id ? (
                    <input
                      ref={inputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="truncate">{conversation.title}</div>
                  )}
                </button>
                <div className="ml-2 relative" data-menu-container="true">
                  <button
                    className="p-1 rounded hover:bg-gray-600/50"
                    aria-label="Conversation menu"
                    onClick={(e) => { e.stopPropagation(); toggleMenu(conversation.id) }}
                    data-menu-container="true"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm0 6a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm0 6a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                    </svg>
                  </button>
                  {openMenuId === conversation.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700/60 rounded-md shadow-lg z-20" data-menu-container="true">
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700"
                        onClick={(e) => { e.stopPropagation(); handleRename(conversation.id, conversation.title) }}
                      >
                        Rename
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-gray-700 hover:text-red-200"
                        onClick={(e) => { e.stopPropagation(); handleDelete(conversation.id) }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'model' && (
          <div className="space-y-2">
            {notice && (
              <div
                role="status"
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${notice.kind === 'warning' ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200' : 'bg-blue-900/30 border-blue-700/50 text-blue-200'}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-black/20">⚠️</span>
                <div className="flex-1 leading-5">{notice.text}</div>
                <button
                  onClick={() => setNotice(null)}
                  className="ml-2 text-[10px] text-gray-300 hover:text-white"
                  aria-label="Dismiss"
                >✕</button>
              </div>
            )}
            {/* Section: Text Generation */}
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400">Text Generation</div>
            {/* Text model toggles */}
            {models.filter(m => !enabledModels[m.id]).map((model) => (
              <div key={model.id} className="flex items-center justify-between px-2 py-2 border-b border-gray-700/40">
                <div className="flex items-center gap-2 min-w-0">
                  {getLogoUrl(model.id) ? (
                    <img src={getLogoUrl(model.id)!} alt={`${model.name} logo`} className="w-7 h-7 object-contain rounded-full" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-600 rounded flex items-center justify-center text-[10px]">
                      <span>{model.icon}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-200 truncate flex items-center gap-1">
                    <span>{model.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* If premium-only and user is on basic plan, show lock instead of toggle */}
                  {plan === 'basic' && BASIC_LOCKED.has(model.id) ? (
                    <button
                      type="button"
                      onClick={() => setShowUpgrade(true)}
                      className="p-1.5 rounded-md bg-gray-700/60 text-gray-300 hover:bg-gray-600/70 hover:text-white transition"
                      aria-label={`${model.name} is premium. Upgrade to unlock.`}
                      title="Premium model — Upgrade to unlock"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V7a4 4 0 10-8 0v4m2 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleModel(model.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${enabledModels[model.id] ? 'bg-blue-600' : 'bg-gray-600'}`}
                      aria-label={`Toggle ${model.name}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${enabledModels[model.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {models.filter(m => !enabledModels[m.id]).length === 0 && (
              <div className="text-xs text-gray-400 px-2 py-3">All models are active on screen.</div>
            )}

            {/* Image/Video Generation sections removed per request */}
          </div>
        )}

        {activeTab === 'role' && (
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                aria-pressed={activeRole === role}
                className={`w-full p-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-between ${activeRole === role ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
              >
                <div className="truncate">{role}</div>
                {activeRole === role && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Profile section (ChatGPT-like) */}
      <div className="p-3 border-t border-gray-700/50 relative bg-gray-900/95">
        {!user ? (
          <div className="flex items-center gap-3">
            {/* Placeholder avatar */}
            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-200">{initials || 'G'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-300 truncate">Guest</div>
              <div className="text-[10px] text-gray-400 truncate">Not signed in</div>
            </div>
            <button
              onClick={() => openAuth('signin')}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              ref={userBtnRef}
              onClick={() => setIsUserMenuOpen(v => !v)}
              className="group w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-150 hover:ring-1 hover:ring-gray-600/70"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-semibold text-white ring-1 ring-white/10">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-white font-medium truncate">{displayName}</div>
                {email ? (
                  <div className="text-[11px] text-gray-300 truncate">{email}</div>
                ) : (
                  <div className="text-[11px] text-gray-300 truncate">Account</div>
                )}
              </div>
              <svg className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div
                ref={userMenuRef}
                role="menu"
                className="absolute bottom-12 left-2 right-2 z-30 origin-bottom rounded-lg border border-gray-700/60 bg-gray-900 shadow-2xl p-1 animate-[fadeIn_.15s_ease-out]"
                style={{
                  // Fallback keyframes in case Tailwind config lacks custom animations
                  animation: 'fadeIn .15s ease-out',
                }}
              >
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-200 rounded-md hover:bg-gray-700/60 transition-colors" role="menuitem">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-700/60 text-[10px]">⚙️</span>
                  Settings
                </button>
                <div className="my-1 h-px bg-gray-700/60" />
                <button
                  onClick={() => { if (!isLoading) signOut().catch(()=>{}) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md text-red-300 hover:bg-gray-700/60 hover:text-red-200 transition-colors disabled:opacity-60"
                  role="menuitem"
                  disabled={isLoading}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-900/30 text-[10px]">⎋</span>
                  {isLoading ? 'Signing out…' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-desc"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={dismissDelete} />
          {/* Panel */}
          <div className="relative mx-4 w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/20 text-red-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="delete-title" className="text-sm font-semibold text-white">Delete session?</h3>
                <p id="delete-desc" className="mt-1 text-xs text-gray-300">
                  You are about to permanently delete “{pendingDelete.title}”.
                  All messages and content in this session will be lost. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={dismissDelete}
                className="px-3 py-2 text-xs rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
          {/* Backdrop with blur and subtle grid */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowUpgrade(false)} />

          {/* Floating decorative orbs */}
          <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-56 w-56 rounded-full bg-cyan-400/10 blur-2xl animate-pulse" />

          {/* Container with animated border glow */}
          <div className="relative mx-4 w-full max-w-xl">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-tr from-emerald-400/50 via-cyan-400/50 to-transparent opacity-60 blur-md" />
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/95 to-gray-950/95 shadow-[0_0_90px_-25px_rgba(16,185,129,0.7)] animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 id="upgrade-title" className="text-sm font-semibold text-white">Upgrade to Premium</h3>
                </div>
                <button onClick={() => setShowUpgrade(false)} className="text-gray-400 hover:text-white" aria-label="Close upgrade dialog">✕</button>
              </div>

              {/* Hero bar shimmer */}
              <div className="mx-5 mt-4 h-2 rounded-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent blur-[2px]" />

              {/* Billing Toggle */}
              <div className="px-5 pt-4">
                <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl p-1 w-fit border border-white/10">
                  <button
                    onClick={() => setBilling('monthly')}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${billing==='monthly' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white'}`}
                  >Monthly</button>
                  <button
                    onClick={() => setBilling('yearly')}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${billing==='yearly' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white'}`}
                  >Yearly <span className="ml-1 text-emerald-300/90">Save 17%</span></button>
                </div>
              </div>

              {/* Pricing */}
              <div className="px-5 pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white tracking-tight">${billing==='monthly' ? '12' : '120'}</span>
                    <span className="text-xs text-gray-300">/{billing==='monthly' ? 'Month' : 'Year'}</span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] tracking-wide text-gray-300 uppercase flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 px-2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Ultimate Promptbook & Community Access</span>
                </div>
              </div>

              {/* Features */}
              <div className="px-5 pt-4 pb-2">
                <ul className="space-y-2 text-sm text-gray-200">
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✔</span> All premium AI models access</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✔</span> Side-by-side comparison</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✔</span> 2-minute listen/speak (Premium models count as 2)</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✔</span> Instant prompt enhancement</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-400">✔</span> Image generation & Audio transcription</li>
                </ul>
              </div>

              {/* CTA */}
              <div className="px-5 pb-6 pt-2">
                <button
                  onClick={() => {
                    setShowUpgrade(false)
                    openAuth?.('signup')
                  }}
                  className="w-full relative text-sm font-medium text-white rounded-xl py-3 shadow-lg overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 group-hover:from-emerald-400 group-hover:via-cyan-300 group-hover:to-emerald-300 transition-colors" />
                  <span className="absolute -inset-[1px] rounded-xl opacity-50 blur-md bg-emerald-400/40 group-hover:bg-emerald-300/40 transition-colors" />
                  <span className="relative">Get Started Now →</span>
                </button>
                <div className="mt-2 text-[10px] text-gray-400 text-center">Secure payments • Cancel anytime</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
