import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import MultiModelChat from './components/MultiModelChat'
import MessageInput from './components/MessageInput'
import { useAuth } from './auth/AuthContext'

// Base URL for FastAPI chat/session service.
// In dev, leave empty so Vite proxy handles relative paths like '/chat', '/session', '/history'.
// In production, set VITE_CHAT_BASE_URL to your backend URL (e.g., https://your-host or http://35.238.224.160:8000).
const CHAT_BASE = ((import.meta as any)?.env?.VITE_CHAT_BASE_URL?.replace(/\/$/, '')) || ''
const chatUrl = (path: string) => `${CHAT_BASE}${path.startsWith('/') ? path : `/${path}`}`

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
}

interface Conversation {
  id: string // UI identifier for the conversation
  title: string
  timestamp: Date
}

interface ModelMessages {
  [key: string]: Message[]
}

const MODELS = [
  { 
    id: 'chatgpt', 
    name: 'ChatGPT 5', 
    color: 'green', 
    icon: '🤖',
    versions: ['gpt-4o', 'gpt-4-turbo', 'gpt-5'],
    // Used to map to backend provider keys
    providerKey: 'OpenAI'
  },
  { 
    id: 'gemini', 
    name: 'Gemini 2.5 Pro', 
    color: 'blue', 
    icon: '💎',
    versions: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    providerKey: 'Google'
  }
  ,
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    color: 'indigo', 
    icon: '🔍',
    versions: ['deepseek-chat', 'deepseek-coder']
  }
  ,
  { 
    id: 'groq', 
    name: 'Groq', 
    color: 'indigo', 
    icon: '🔍',
    versions: ['openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'mixtral-8x7b'],
    providerKey: 'Groq'
  }
  ,
  { 
    id: 'grok', 
    name: 'Grok', 
    color: 'indigo', 
    icon: '🔍',
    versions: ['deepseek-chat', 'deepseek-coder']
  }
  ,
  { 
    id: 'claude', 
    name: 'Claude', 
    color: 'indigo', 
    icon: '🔍',
    versions: ['deepseek-chat', 'deepseek-coder']
  }
]

function App() {
  const { token, user, openAuth } = useAuth()
  const accountId = (user?.email || user?.id || '').trim()
  const [enabledModels, setEnabledModels] = useState<{[key: string]: boolean}>({
    chatgpt: false,
    gemini: true,
    deepseek: false,
    groq: true,
    grok: false,
    claude: false
  })

  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: string}>({
    chatgpt: 'gpt-4o',
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat',
    groq: 'openai/gpt-oss-20b'
  })

  // Conversations and active conversation
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>('')

  // Format a Date as local ISO string with timezone offset, e.g. 2025-09-19T20:29:12.498+05:30
  const toLocalIsoWithOffset = (d: Date) => {
    const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    const seconds = pad(d.getSeconds())
    const ms = pad(d.getMilliseconds(), 3)
    const tz = -d.getTimezoneOffset()
    const sign = tz >= 0 ? '+' : '-'
    const tzAbs = Math.abs(tz)
    const tzH = pad(Math.floor(tzAbs / 60))
    const tzM = pad(tzAbs % 60)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${tzH}:${tzM}`
  }

  // Helper to create a session via backend and return the session_id
  const createSession = async (session_name: string): Promise<string> => {
    const nowLocal = new Date()
    const res = await fetch(chatUrl('/session/create'), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        account_id: accountId,
        session_name,
        time_stamp: toLocalIsoWithOffset(nowLocal),
        last_activity: toLocalIsoWithOffset(nowLocal),
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Session create failed: ${res.status}`)
    }
    const data = await res.json().catch(() => ({}))
    if (!data?.session_id) throw new Error('No session_id in response')
    return data.session_id as string
  }

  // Helper: fetch all sessions for the account and map to conversations
  const fetchSessions = async (): Promise<Conversation[]> => {
    const res = await fetch(chatUrl(`/session/${encodeURIComponent(accountId)}`), { headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    if (res.status === 404) {
      // Account not found yet means no sessions created
      return []
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to load sessions: ${res.status}`)
    }
    const data = await res.json().catch(() => ({} as any))
    const list = Array.isArray(data?.sessions) ? data.sessions : []
    // Robust timestamp parser: if no timezone present, interpret as UTC; otherwise, let Date parse with the included offset
    const parseTs = (v: any): Date => {
      if (!v) return new Date()
      if (v instanceof Date) return v
      if (typeof v === 'string') {
        const s = v.trim()
        // detect explicit timezone or Zulu
        const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s)
        return hasTz ? new Date(s) : new Date(s + 'Z')
      }
      return new Date(v)
    }
    const convs: Conversation[] = list.map((s: any) => ({
      id: s.session_id,
      title: s.session_name || 'New Chat',
      timestamp: parseTs(s.last_activity || s.time_stamp || Date.now()),
    }))
    // Sort by timestamp desc
    convs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return convs
  }

  // Helper: fetch session history and populate sessionModelMessages for that session
  const fetchHistory = async (sessionId: string) => {
    const res = await fetch(chatUrl(`/history/${sessionId}`), { headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to load history: ${res.status}`)
    }
    const data = await res.json().catch(() => ({} as any))
    const history = Array.isArray(data?.history) ? data.history : []

    // Build provider->modelId map from MODELS.providerKey
    const providerToModelId: {[key: string]: string} = {}
    MODELS.forEach(m => { if ((m as any).providerKey) providerToModelId[(m as any).providerKey] = m.id })

    // Map backend keys to provider names
    const keyToProvider: {[key: string]: string} = {
      openai_messages: 'OpenAI',
      google_messages: 'Google',
      groq_messages: 'Groq',
    }

    // Initialize empty per-model messages
    const perModel: ModelMessages = {}

    // Only load the first history turn (index 0) into the UI
    let idx = 0
    const firstTurn = history[0] || {}
    const makeTs = () => new Date(Date.now() - (1 - idx) * 1000)
    Object.keys(keyToProvider).forEach(k => {
      const provider = keyToProvider[k]
      const modelId = providerToModelId[provider]
      if (!modelId) return
      const msgs = Array.isArray(firstTurn[k]) ? firstTurn[k] : []
      msgs.forEach((m: any) => {
        const role = String(m.role || '').toLowerCase() === 'user' ? 'user' : 'assistant'
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        const message: Message = {
          id: `${sessionId}-${modelId}-${idx}-${role}`,
          content,
          role: role as 'user' | 'assistant',
          timestamp: makeTs(),
          model: modelId,
        }
        perModel[modelId] = [...(perModel[modelId] || []), message]
        idx += 1
      })
    })

    setSessionModelMessages(prev => ({ ...prev, [sessionId]: perModel }))
    setSessionLoading(prev => ({ ...prev, [sessionId]: {} }))
  }

  // On mount, load sessions and pick the most recent; if none, create one
  useEffect(() => {
    const init = async () => {
      try {
        if (!accountId) return
        const convs = await fetchSessions()
        if (convs.length === 0) {
          const sessionId = await createSession('New Chat')
          const conv: Conversation = { id: sessionId, title: 'New Chat', timestamp: new Date() }
          setConversations([conv])
          setActiveConversationId(sessionId)
        } else {
          setConversations(convs)
          setActiveConversationId(convs[0].id)
          await fetchHistory(convs[0].id)
        }
      } catch (e) {
        console.error('Initialization failed', e)
      }
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  // Messages and loading state are tracked per session (conversation) and per model
  const [sessionModelMessages, setSessionModelMessages] = useState<{ [sessionId: string]: ModelMessages }>({})
  const [sessionLoading, setSessionLoading] = useState<{ [sessionId: string]: { [modelId: string]: boolean } }>({})

  const activeSessionId = activeConversationId
  const currentModelMessages: ModelMessages = sessionModelMessages[activeSessionId] || {}
  const currentLoading: { [key: string]: boolean } = sessionLoading[activeSessionId] || {}

  const handleNewChat = async () => {
    if (!token || !accountId) {
      openAuth('signin')
      return
    }
    try {
      const title = 'New Chat'
      const newId = await createSession(title)
      const newConv: Conversation = {
        id: newId,
        title,
        timestamp: new Date(),
      }
      setConversations(prev => [newConv, ...prev])
      setActiveConversationId(newId)
    } catch (e) {
      console.error('Failed to create new session', e)
    }
  }

  // Broadcast a user message to all enabled models and fetch backend responses
  const handleSendMessage = async (content: string) => {
    // Soft-guard: require auth to send messages
    if (!token) {
      openAuth('signin')
      return
    }
    const timestamp = new Date()

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp
    }

    // Append user message to all enabled model threads
    setSessionModelMessages(prev => {
      const sessionMsgs = { ...(prev[activeSessionId] || {}) }
      Object.keys(enabledModels).forEach(modelId => {
        if (enabledModels[modelId]) {
          const id = `${userMessage.id}-${modelId}`
          sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), { ...userMessage, id }]
        }
      })
      return { ...prev, [activeSessionId]: sessionMsgs }
    })

    // Set loading only for enabled models
    const loadingState: {[key: string]: boolean} = {}
    Object.keys(enabledModels).forEach(modelId => {
      if (enabledModels[modelId]) loadingState[modelId] = true
    })
    setSessionLoading(prev => ({ ...prev, [activeSessionId]: loadingState }))

    // Build selected_models payload from enabled models that have providerKey mapping
    const providerMap: {[key: string]: string} = {}
    MODELS.forEach(m => { if ((m as any).providerKey) providerMap[m.id] = (m as any).providerKey })

    const selected_models: {[key: string]: string} = {}
    Object.keys(enabledModels).forEach(modelId => {
      if (!enabledModels[modelId]) return
      const providerKey = providerMap[modelId]
      if (!providerKey) return // skip models not supported by backend
      const version = selectedVersions[modelId]
      if (version) selected_models[providerKey] = version
    })

    try {
      const res = await fetch(chatUrl('/chat'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_query: content,
          selected_models,
          session_id: activeSessionId,
          client_time: toLocalIsoWithOffset(timestamp),
        })
      })

      // Attempt to parse JSON; if not ok, throw
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed with status ${res.status}`)
      }
      const data = await res.json().catch(() => ({}))

      // Normalize possible response shapes
      // Shape A: { responses: { OpenAI: '...', Google: '...', Groq: '...' } }
      // Shape B: { OpenAI: '...', Google: '...', Groq: '...' }
      const responsesByProvider: {[key: string]: string} = data?.responses && typeof data.responses === 'object'
        ? data.responses
        : data && typeof data === 'object' ? data : {}

      // Reverse map provider -> modelId
      const providerToModelId: {[key: string]: string} = {}
      Object.entries(providerMap).forEach(([modelId, provider]) => { providerToModelId[provider] = modelId })

      const processed: {[key: string]: boolean} = {}
      Object.keys(responsesByProvider).forEach(provider => {
        const modelId = providerToModelId[provider]
        if (!modelId || !enabledModels[modelId]) return
        const contentText = typeof responsesByProvider[provider] === 'string'
          ? responsesByProvider[provider]
          : JSON.stringify(responsesByProvider[provider])

        const assistantMessage: Message = {
          id: `${Date.now()}-${modelId}`,
          content: contentText,
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setSessionModelMessages(prev => {
          const sessionMsgs = { ...(prev[activeSessionId] || {}) }
          sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), assistantMessage]
          return { ...prev, [activeSessionId]: sessionMsgs }
        })
        processed[modelId] = true
        setSessionLoading(prev => ({ ...prev, [activeSessionId]: { ...(prev[activeSessionId] || {}), [modelId]: false } }))
      })

      // For any enabled model that didn't receive a response, stop loading and show a generic message
      Object.keys(enabledModels).forEach(modelId => {
        if (!enabledModels[modelId]) return
        if (processed[modelId]) return
        if (!providerMap[modelId]) {
          // Not supported by backend; stop loading silently
          setSessionLoading(prev => ({ ...prev, [activeSessionId]: { ...(prev[activeSessionId] || {}), [modelId]: false } }))
          return
        }
        const assistantMessage: Message = {
          id: `${Date.now()}-${modelId}`,
          content: 'No response received for this model.',
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setSessionModelMessages(prev => {
          const sessionMsgs = { ...(prev[activeSessionId] || {}) }
          sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), assistantMessage]
          return { ...prev, [activeSessionId]: sessionMsgs }
        })
        setSessionLoading(prev => ({ ...prev, [activeSessionId]: { ...(prev[activeSessionId] || {}), [modelId]: false } }))
      })
    } catch (err: any) {
      // On error, append error message to all enabled and supported models
      Object.keys(enabledModels).forEach(modelId => {
        if (!enabledModels[modelId]) return
        if (!providerMap[modelId]) {
          setSessionLoading(prev => ({ ...prev, [activeSessionId]: { ...(prev[activeSessionId] || {}), [modelId]: false } }))
          return
        }
        const assistantMessage: Message = {
          id: `${Date.now()}-${modelId}`,
          content: `Error contacting backend: ${err?.message || String(err)}`,
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setSessionModelMessages(prev => {
          const sessionMsgs = { ...(prev[activeSessionId] || {}) }
          sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), assistantMessage]
          return { ...prev, [activeSessionId]: sessionMsgs }
        })
        setSessionLoading(prev => ({ ...prev, [activeSessionId]: { ...(prev[activeSessionId] || {}), [modelId]: false } }))
      })
    }
  }

  const enabledModelsList = MODELS.filter(model => enabledModels[model.id])
  const enabledCount = Object.values(enabledModels).filter(Boolean).length
  const isAnyLoading = Object.values(currentLoading).some(Boolean)

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id)
    // Update last_activity when user continues a session
    try {
      const nowLocal = new Date()
      const url = chatUrl(`/session/update/${encodeURIComponent(accountId)}/${encodeURIComponent(id)}?last_activity=${encodeURIComponent(toLocalIsoWithOffset(nowLocal))}`)
      void fetch(url, { method: 'PUT', headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).catch(() => {})
      // Do not reorder locally on selection; ordering will change only when last_activity changes take effect.
    } catch {}
    // Load history if we don't yet have messages for this session
    if (!sessionModelMessages[id]) {
      try {
        await fetchHistory(id)
      } catch (e) {
        console.error('Failed to fetch history for session', id, e)
      }
    }
  }

  // Rename a session via backend and update local state
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const url = chatUrl(`/session/update/${encodeURIComponent(accountId)}/${encodeURIComponent(id)}?session_name=${encodeURIComponent(newTitle)}`)
      const res = await fetch(url, {
        method: 'PUT',
        headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Failed to rename session: ${res.status}`)
      }
      // Update only the title; do not bump ordering here
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c))
    } catch (e) {
      console.error('Failed to rename session', e)
    }
  }

  // Delete a session via backend and update local state
  const handleDeleteConversation = async (id: string) => {
    try {
      const url = chatUrl(`/session/${encodeURIComponent(accountId)}/${encodeURIComponent(id)}`)
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Failed to delete session: ${res.status}`)
      }
      setConversations(prev => prev.filter(c => c.id !== id))
      setSessionModelMessages(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      setSessionLoading(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      if (activeConversationId === id) {
        // Pick next available session if current was deleted
        setTimeout(() => {
          setConversations(current => {
            const next = current[0]?.id || ''
            setActiveConversationId(next)
            return current
          })
        }, 0)
      }
    } catch (e) {
      console.error('Failed to delete session', e)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar 
          models={MODELS}
          enabledModels={enabledModels}
          onToggleModel={setEnabledModels}
          selectedVersions={selectedVersions}
          onVersionChange={setSelectedVersions}
          enabledCount={enabledCount}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>
      <div className="flex-1 ml-64 relative h-screen overflow-hidden">
        <MultiModelChat 
          models={enabledModelsList}
          modelMessages={currentModelMessages}
          isLoading={currentLoading}
          selectedVersions={selectedVersions}
          onVersionChange={(modelId, version) => setSelectedVersions(prev => ({ ...prev, [modelId]: version }))}
          enabledModels={enabledModels}
          onToggleModel={setEnabledModels}
        />
        {/* Bottom overlay to mask page edge when horizontally scrolled (exclude sidebar area) */}
        <div className="fixed left-64 right-0 bottom-0 h-24 z-10 pointer-events-none bg-gradient-to-t from-gray-900/95 to-transparent" />
        {/* Floating global input */}
        <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-20 w-[min(900px,calc(100%-7rem))] floating-input-safe-area">
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={isAnyLoading}
            enabledCount={enabledCount}
            variant="floating"
          />
        </div>
      </div>
    </div>
  )
}

export default App
