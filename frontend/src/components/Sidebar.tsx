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
  enabledModels: {[key: string]: boolean}
  onToggleModel: (models: {[key: string]: boolean}) => void
  selectedVersions: {[key: string]: string}
  onVersionChange: (versions: {[key: string]: string}) => void
  enabledCount: number
  conversations: Conversation[]
  activeConversationId: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRenameConversation: (id: string, newTitle: string) => Promise<void>
  onDeleteConversation: (id: string) => Promise<void>
}

export default function Sidebar({ models, enabledModels, onToggleModel, selectedVersions: _selectedVersions, onVersionChange: _onVersionChange, enabledCount, conversations, activeConversationId, onSelectConversation, onNewChat, onRenameConversation, onDeleteConversation }: SidebarProps) {
  const { user, openAuth, signOut, isLoading } = useAuth()

  // Sidebar segmented control: 'chat' | 'model' | 'role'
  const [activeTab, setActiveTab] = useState<'chat' | 'model' | 'role'>('chat')

  // Roles list (simple example)
  const [roles] = useState<string[]>(['General', 'Finance', 'Coder','Image Generation','Marketing','Video Generation'])
  const [activeRole, setActiveRole] = useState<string>('Finance')

  const handleToggleModel = (modelId: string) => {
    onToggleModel({
      ...enabledModels,
      [modelId]: !enabledModels[modelId]
    })
  }

  // Version selection happens in the on-screen model header now

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

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
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
        <div className="mt-3 text-[10px] text-gray-400">{enabledCount} active model{enabledCount !== 1 ? 's' : ''}</div>
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
            {models.filter(m => !enabledModels[m.id]).map((model) => (
              <div key={model.id} className="flex items-center justify-between px-2 py-2 border-b border-gray-700/40">
                <div className="text-sm text-gray-200">{model.name}</div>
                <div className="flex items-center gap-2">
                  {/* Only a toggle in sidebar. Enabling here will move the model to the screen and disappear from sidebar list. */}
                  <button
                    onClick={() => handleToggleModel(model.id)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${enabledModels[model.id] ? 'bg-blue-600' : 'bg-gray-600'}`}
                    aria-label={`Toggle ${model.name}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${enabledModels[model.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            ))}
            {models.filter(m => !enabledModels[m.id]).length === 0 && (
              <div className="text-xs text-gray-400 px-2 py-3">All models are active on screen.</div>
            )}
          </div>
        )}

        {activeTab === 'role' && (
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`w-full text-left p-2 rounded-lg transition-all duration-200 text-sm ${activeRole === role ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
              >
                <div className="truncate">{role}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        {/* Account section */}
        {!user ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">You are not signed in</div>
            <div className="flex gap-2">
              <button
                onClick={() => openAuth('signin')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-2 rounded-lg text-xs transition-all duration-200"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-gray-300 truncate">{user.name || user.email}</div>
            <button
              onClick={() => { if (!isLoading) signOut().catch(()=>{}) }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs transition-all duration-200 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Signing out…' : 'Sign Out'}
            </button>
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
    </div>
  )
}
