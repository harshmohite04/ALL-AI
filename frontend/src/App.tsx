import { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MultiModelChat from './components/MultiModelChat'
import MessageInput from './components/MessageInput'
import { useAuth } from './auth/AuthContext'
import { generateTitleFromMessage, generateTitleFromMessages, setChatUrlFunction } from './utils/titleGenerator'

import OpenAI from './assets/logos/chatgpt.png'
import Google from './assets/logos/gemini.png'
import Meta from './assets/logos/meta.jpg'
import Groq from './assets/logos/groq.png'
import Grok from './assets/logos/grok.svg'
import Claude from './assets/logos/claude.png'
import Perplexity from './assets/logos/perplexity.jpg'
import Cohere from './assets/logos/cohere.png'
import Deepseek from './assets/logos/deepseek.png'
import Mistral from './assets/logos/mistral.png'
import Alibaba from './assets/logos/alibaba.png'

// Base URL for FastAPI chat/session service.
// In dev, leave empty so Vite proxy handles relative paths like '/chat', '/session', '/history'.
// In production, set VITE_CHAT_BASE_URL to your backend URL (e.g., https://your-host or http://35.238.224.160:8000).
const CHAT_BASE = ((import.meta as any)?.env?.VITE_CHAT_BASE_URL?.replace(/\/$/, '')) || ''
const chatUrl = (path: string) => `${CHAT_BASE}${path.startsWith('/') ? path : `/${path}`}`
console.log("chatbase :" +CHAT_BASE)
console.log("VITE_CHAT_BASE_URL:" + import.meta.env.VITE_CHAT_BASE_URL)

console.log("chat "+{chatUrl})
// Example defaults
const imageGenEnabled = true;   // or false
const videoGenEnabled = true;   // or false
const imageProvider = "stable-diffusion"; // pick your provider name
const videoProvider = "runway";           // pick your provider name


// Initialize the chat URL function for the title generator
setChatUrlFunction(chatUrl);

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
  animate?: boolean
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
    name: 'ChatGPT', 
    color: 'green', 
    icon: OpenAI,
    versions: ['gpt-4o', 'gpt-4-turbo', 'gpt-5', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    // Used to map to backend provider keys
    providerKey: 'OpenAI'
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    color: 'blue', 
    icon: Google,
    versions: ['gemini-2.0-flash', 'gemini-2.5-pro'],
    providerKey: 'Google'
  },

  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    color: 'indigo', 
    icon: Deepseek,
    versions: ['deepseek-r1-distill-llama-70b','deepseek-chat','deepseek-reasoner'],
    providerKey: 'Deepseek'
  },

  { 
    id: 'groq', 
    name: 'Groq', 
    color: 'indigo', 
    icon: Groq,
    versions: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'mixtral-8x7b','llama-3.3-70b-versatile'],
    providerKey: 'Groq'
  }
  ,
  { 
    id: 'grok', 
    name: 'Grok', 
    color: 'indigo', 
    icon: Grok,
    versions: ['deepseek-chat', 'deepseek-coder']
  }
  ,
  { 
    id: 'claude', 
    name: 'Claude', 
    color: 'indigo', 
    icon: Claude,
    versions: ['claude-sonnet-4-5-20250929','claude-sonnet-4-20250514','claude-3-7-sonnet-latest','claude-opus-4-1-20250805','claude-opus-4-20250514','claude-3-5-haiku-latest','claude-3-haiku-20240307'],
    providerKey: 'Anthropic'
  }
  ,
  { 
    id: 'perplexity', 
    name: 'Perplexity', 
    color: 'orange', 
    icon: Perplexity,
    versions: ['sonar-small-online', 'sonar-large-online']
  }
  ,
  { 
    id: 'cohere', 
    name: 'Cohere', 
    color: 'teal', 
    icon: Cohere,
    versions: ['command-r', 'command-r-plus']
  }
  ,
  { 
    id: 'meta', 
    name: 'Meta', 
    color: 'pink', 
    icon: Meta,
    versions: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
    providerKey: 'Meta'
  }
  ,
  { 
    id: 'mistral', 
    name: 'Mistral', 
    color: 'purple', 
    icon: Mistral,
    versions: ['mistral-small', 'mistral-large']
  }
  ,
  { 
    id: 'alibaba', 
    name: 'Alibaba', 
    color: 'red', 
    icon: Alibaba,
    versions: ['qwen/qwen3-32b'],
    providerKey: 'Alibaba'
  }
]

function App() {
  const { token, user, openAuth } = useAuth()
  const accountId = (user?.email || user?.id || '').trim()
  const plan: 'basic' | 'premium' = ((user as any)?.userclass === 'premium') ? 'premium' : 'basic'

  // Locked models for basic plan (cannot be enabled). Do not lock llama (meta), mistral, or deepseek.
  const BASIC_LOCKED = new Set(['claude', 'perplexity', 'cohere', 'grok'])

  // Compute user-facing model catalog based on plan (no plan-based overrides for ChatGPT)
  const DISPLAY_MODELS = MODELS

  const [enabledModels, setEnabledModels] = useState<{[key: string]: boolean}>({
    chatgpt: false,
    gemini: true,
    deepseek: true,
    groq: true,
    grok: false,
    claude: false,
    perplexity: false,
    cohere: false,
    meta: true,
    mistral: false,
    alibaba: false
  })

  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: string}>({
    // Single ChatGPT across plans
    chatgpt: 'openai/gpt-oss-20b',
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-r1-distill-llama-70b',
    groq: 'openai/gpt-oss-20b',
    perplexity: 'sonar-small-online',
    cohere: 'command-r',
    meta: 'llama-3.1-8b-instant',
    mistral: 'mistral-small',
    alibaba: 'qwen/qwen3-32b',
    claude: 'claude-3-haiku-20240307'
  })

  // Role and media generation selections
  const [activeRole, setActiveRole] = useState<string>('General')
  const [selectedImageProviders, setSelectedImageProviders] = useState<Array<'Midjourney' | 'DALL·E 3' | 'Stable Diffusion'>>([])
  const [selectedVideoProviders, setSelectedVideoProviders] = useState<Array<'Runway Gen-2' | 'Nano Banana' | 'Google Veo'>>([])

  // Overlay when applying role recommendations
  const [roleOverlay, setRoleOverlay] = useState<null | { role: string; ids: string[] }>(null)

  // UI: Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Show reopen button only after transition completes to avoid double-click flicker
  const [showReopenBtn, setShowReopenBtn] = useState(false)
  useEffect(() => {
    let t: number | undefined
    if (sidebarCollapsed) {
      // match transition duration (300ms)
      t = window.setTimeout(() => setShowReopenBtn(true), 320)
    } else {
      setShowReopenBtn(false)
    }
    return () => { if (t) window.clearTimeout(t) }
  }, [sidebarCollapsed])

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
      meta_messages: 'Meta',
      deepseek_messages: 'Deepseek',
      alibaba_messages: 'Alibaba',
      anthropic_messages: 'Anthropic',
    }

    // Initialize empty per-model messages and only take the first history step (index 0)
    const perModel: ModelMessages = {}
    let idx = 0
    const baseTime = Date.now()
    const turns = history.length > 0 ? [history[0]] : []
    turns.forEach((turn: any, turnIndex: number) => {
      Object.keys(keyToProvider).forEach(k => {
        const provider = keyToProvider[k]
        const modelId = providerToModelId[provider]
        if (!modelId) return
        const msgs = Array.isArray(turn[k]) ? turn[k] : []
        msgs.forEach((m: any) => {
          const role = String(m.role || '').toLowerCase() === 'user' ? 'user' : 'assistant'
          const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          const message: Message = {
            id: `${sessionId}-${modelId}-${turnIndex}-${idx}-${role}`,
            content,
            role: role as 'user' | 'assistant',
            timestamp: new Date(baseTime + idx),
            model: modelId,
            animate: false,
          }
          perModel[modelId] = [...(perModel[modelId] || []), message]
          idx += 1
        })
      })
    })

    setSessionModelMessages(prev => ({ ...prev, [sessionId]: perModel }))
    setSessionLoading(prev => ({ ...prev, [sessionId]: {} }))

    // Auto-set enabled models to exactly those that appear in this session's history
    if (Object.keys(perModel).length > 0) {
      setEnabledModels(buildEnabledFromMessages(perModel))
    }
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

  // Build enabled map from per-session messages: only show models that have history in this session
  const buildEnabledFromMessages = useCallback((perModel: ModelMessages) => {
    const next: { [key: string]: boolean } = {}
    MODELS.forEach(m => { next[m.id] = false })
    if (perModel) {
      Object.keys(perModel).forEach(id => { next[id] = (perModel[id]?.length || 0) > 0 })
    }
    return next
  }, [])

  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      // Use query param style to match backend expectation (same as handleRenameConversation)
      const url = chatUrl(`/session/update/${encodeURIComponent(accountId)}/${encodeURIComponent(conversationId)}?session_name=${encodeURIComponent(newTitle)}`)
      const res = await fetch(url, {
        method: 'PUT',
        headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Failed to update title: ${res.status}`)
      }

      // Update the conversation title in the UI
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: newTitle } 
            : conv
        )
      )
    } catch (error) {
      console.error('Failed to update conversation title:', error)
    }
  }, [accountId, token]);

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

    // If this is the first message in a new conversation, generate a title
    const isNewConversation = !sessionModelMessages[activeSessionId] || 
      Object.values(sessionModelMessages[activeSessionId] || {}).every(msgs => msgs.length === 0);
    
    if (isNewConversation && token) {
      try {
        // Get all messages for the current conversation
        const allMessages = Object.values(sessionModelMessages[activeSessionId] || {})
          .flat()
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        
        // Add the current message
        allMessages.push({
          role: 'user',
          content
        });
        
        // Generate title using LLM
        const title = await generateTitleFromMessages(allMessages, token);
        if (title && title !== 'New Chat') {
          await updateConversationTitle(activeSessionId, title);
        }
      } catch (error) {
        console.error('Error generating title with LLM, using fallback:', error);
        const fallbackTitle = await generateTitleFromMessage(content);
        if (fallbackTitle && fallbackTitle !== 'New Chat') {
          await updateConversationTitle(activeSessionId, fallbackTitle);
        }
      }
    }

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

    // If role is Image/Video Generation and feature is enabled, route accordingly
    const isImageGenFlow = activeRole === 'Image Generation' && imageGenEnabled
    const isVideoGenFlow = activeRole === 'Video Generation' && videoGenEnabled

    if (isImageGenFlow || isVideoGenFlow) {
      try {
        const endpoint = isImageGenFlow ? '/image' : '/video'
        const res = await fetch(chatUrl(endpoint), {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            prompt: content,
            provider: isImageGenFlow ? imageProvider : videoProvider,
            session_id: activeSessionId,
            client_time: toLocalIsoWithOffset(timestamp),
          })
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `Request failed with status ${res.status}`)
        }
        const data = await res.json().catch(() => ({}))
        const mediaUrl = data?.url || ''
        const providerUsed = data?.provider || (isImageGenFlow ? imageProvider : videoProvider)

        const markdown = isImageGenFlow
          ? `Generated by ${providerUsed}\n\n![](${mediaUrl})`
          : `Generated by ${providerUsed}\n\n[▶ Download/Play Video](${mediaUrl})`

        // Append assistant message with media to all enabled models
        Object.keys(enabledModels).forEach(modelId => {
          if (!enabledModels[modelId]) return
          const assistantMessage: Message = {
            id: `${Date.now()}-${modelId}`,
            content: markdown,
            role: 'assistant',
            timestamp: new Date(),
            model: modelId,
            animate: true,
          }
          setSessionModelMessages(prev => {
            const sessionMsgs = { ...(prev[activeSessionId] || {}) }
            sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), assistantMessage]
            return { ...prev, [activeSessionId]: sessionMsgs }
          })
        })
      } catch (err: any) {
        // On error, append error message to all enabled
        Object.keys(enabledModels).forEach(modelId => {
          if (!enabledModels[modelId]) return
          const assistantMessage: Message = {
            id: `${Date.now()}-${modelId}`,
            content: `Error generating ${isImageGenFlow ? 'image' : 'video'}: ${err?.message || String(err)}`,
            role: 'assistant',
            timestamp: new Date(),
            model: modelId,
            animate: true,
          }
          setSessionModelMessages(prev => {
            const sessionMsgs = { ...(prev[activeSessionId] || {}) }
            sessionMsgs[modelId] = [...(sessionMsgs[modelId] || []), assistantMessage]
            return { ...prev, [activeSessionId]: sessionMsgs }
          })
        })
      } finally {
        // Clear loading for all enabled models
        setSessionLoading(prev => ({ ...prev, [activeSessionId]: Object.fromEntries(Object.keys(enabledModels).map(id => [id, false])) }))
      }
      return
    }

    // Build selected_models payload from enabled models that have providerKey mapping
    const providerMap: {[key: string]: string} = {}
    MODELS.forEach(m => { if ((m as any).providerKey) providerMap[m.id] = (m as any).providerKey })

    const selected_models: {[key: string]: string} = {}
    Object.keys(enabledModels).forEach(modelId => {
      if (!enabledModels[modelId]) return
      // Enforce basic plan locks
      if (plan === 'basic' && BASIC_LOCKED.has(modelId)) return

      // Determine provider key (no remap by plan)
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
          model: modelId,
          animate: true,
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
          model: modelId,
          animate: true,
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
          model: modelId,
          animate: true,
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

  // Enhance a prompt using ChatGPT OSS only (OpenAI OSS model via backend /chat)
  const handleEnhancePrompt = useCallback(async (raw: string): Promise<string> => {
    try {
      const timestamp = new Date()
      const openaiModel = MODELS.find(m => m.id === 'chatgpt')
      const version = selectedVersions['chatgpt'] || 'openai/gpt-oss-20b'
      if (!openaiModel) return raw

      const selected_models: { [key: string]: string } = { OpenAI: version }
      const instruction = `You are a prompt enhancer. Rewrite the user's prompt to be clear, specific, and goal-oriented; preserve intent, add necessary constraints (format, tone, audience). Output only the improved prompt without extra commentary.`
      const composed = `${instruction}\n\nUser prompt:\n${raw.trim()}`

      const res = await fetch(chatUrl('/chat'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_query: composed,
          selected_models,
          session_id: activeSessionId,
          client_time: toLocalIsoWithOffset(timestamp),
        })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json().catch(() => ({}))
      const text = (data?.responses?.OpenAI ?? data?.OpenAI ?? '').toString()
      return (text || '').trim() || raw
    } catch (e) {
      console.error('Enhance failed', e)
      return raw
    }
  }, [activeSessionId, selectedVersions, token])

  const enabledModelsList = DISPLAY_MODELS.filter(model => enabledModels[model.id])
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
    else {
      // If messages already exist, set enabled models from that history
      const perModel = sessionModelMessages[id]
      if (perModel && Object.keys(perModel).length > 0) {
        setEnabledModels(buildEnabledFromMessages(perModel))
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
            return [...current.filter(c => c.id !== id)]
          })
        }, 0)
      }
    } catch (e) {
      console.error('Failed to delete session', e)
    }
  }

  // Small inline overlay component for role loading UX
  const ModelLoadingOverlay: React.FC<{ role: string; logos: Array<{ src: string; alt: string }>; onDone?: () => void; durationMs?: number }>
    = ({ role, logos, onDone, durationMs = 5000 }) => {
    const [reveal, setReveal] = useState(0)
    const [progress, setProgress] = useState(0)
    useEffect(() => {
      // Reveal all logos quickly (within ~1.2s), regardless of total duration
      const quickWindow = 1200
      const step = Math.max(100, Math.floor(quickWindow / Math.max(1, logos.length)))
      const logoTimer = window.setInterval(() => {
        setReveal((r) => (r < logos.length ? r + 1 : r))
      }, step)
      // Progress bar smoother tick
      const progTimer = window.setInterval(() => {
        setProgress((p) => Math.min(100, p + 100 * 200 / durationMs))
      }, 200)
      const doneTimer = window.setTimeout(() => {
        onDone?.()
      }, durationMs)
      return () => {
        window.clearInterval(logoTimer)
        window.clearInterval(progTimer)
        window.clearTimeout(doneTimer)
      }
    }, [logos.length, durationMs, onDone])

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        {/* Center card */}
        <div className="relative z-50 w-[420px] max-w-[90vw]">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-tr from-blue-400/40 via-cyan-300/30 to-emerald-300/30 opacity-60 blur-md" />
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/95 to-gray-950/95 shadow-[0_0_80px_-20px_rgba(59,130,246,0.6)] p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white">Optimizing your workspace</h3>
            </div>
            <div className="text-[13px] text-gray-300 leading-5">
              <div className="font-medium text-white mb-1">Loading the best models for “{role}”.</div>
              <div className="opacity-90">Trusted, production-grade providers—curated for accuracy, speed, and reliability so you can focus on outcomes.</div>
            </div>
            {/* Progress */}
            <div className="mt-4">
              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden border border-gray-700/60">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400" style={{ width: `${progress}%`, transition: 'width 180ms ease' }} />
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 text-emerald-300">✓</span>
                Trustworthy defaults, adjustable anytime
              </div>
            </div>
            {/* Logos */}
            <div className="mt-4 grid grid-cols-5 gap-3 justify-items-center">
              {logos.slice(0, reveal).map((l, i) => (
                <div key={i} className="w-12 h-12 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center shadow transition transform animate-in fade-in-0 zoom-in-95" style={{ animationDelay: `${i * 60}ms` }}>
                  <img src={l.src} alt={l.alt} className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(59,130,246,0.35)]" />
                </div>
              ))}
            </div>
            {/* Floating accents */}
            <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-cyan-400/10 blur-xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-10 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
              <span>Secured by design</span>
              <span>Optimized for best performance</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Map roles to recommended models and preferred versions
  type RoleCandidate = { modelId: string; versionPrefs?: string[] }
  const ROLE_FALLBACKS: Record<string, RoleCandidate[]> = {
    // User-specified chains:
    // Finance: GPT-5 → Claude Opus 4.1 → Claude Sonnet 4.5
    Finance: [
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      // Both Opus/Sonnet map to provider 'claude'; prefer our best available
      { modelId: 'claude', versionPrefs: ['claude-3-opus', 'claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
    ],
    // Coding: Claude Sonnet 4.5 → GPT-5 → o4-mini (map o4-mini to gpt-4o family)
    Coding: [
      { modelId: 'claude', versionPrefs: ['claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      // Also consider Meta Llama as a strong coding option in our catalog
      { modelId: 'meta', versionPrefs: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
    ],
    // Legal: GPT-5 → Claude Opus 4.1 → o3 (map o3 to OpenAI best available 4o)
    Legal: [
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      { modelId: 'claude', versionPrefs: ['claude-3-opus', 'claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
    ],
    // Doctor: MedGemma 27B → GPT-5 → MedGemma 4B (MedGemma not present, will fallback to GPT if available)
    Doctor: [
      // No MedGemma provider in catalog — skip to GPT-5
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      // As an additional strong general option, consider Gemini
      { modelId: 'gemini', versionPrefs: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'] },
    ],
    // Marketing: GPT-5 → GPT-4o → Claude Sonnet 4.5
    Marketing: [
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      { modelId: 'claude', versionPrefs: ['claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
    ],
    // Learning: prefer a balanced trio
    Learning: [
      { modelId: 'claude', versionPrefs: ['claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
      { modelId: 'chatgpt', versionPrefs: ['gpt-4o', 'gpt-5', 'gpt-4-turbo'] },
      { modelId: 'gemini', versionPrefs: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.0-flash'] },
    ],
    // Keep existing alias role for users who pick "Coder" in the sidebar
    Coder: [
      { modelId: 'claude', versionPrefs: ['claude-3-5-sonnet', 'claude-3-haiku-20240307'] },
      { modelId: 'chatgpt', versionPrefs: ['gpt-5', 'gpt-4o', 'gpt-4-turbo'] },
      { modelId: 'meta', versionPrefs: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
    ],
    // General: keep current selection as-is (no-op)
    General: [],
  }

  // Resolve role fallbacks against our catalog and plan
  const resolveRoleConfig = useCallback((role: string) => {
    const candidates = ROLE_FALLBACKS[role] || []
    const ids: string[] = []
    const versions: Partial<{ [k: string]: string }> = {}
    const modelIndex = new Map(MODELS.map(m => [m.id, m]))

    for (const c of candidates) {
      const m = modelIndex.get(c.modelId)
      if (!m) continue
      // Respect plan locks
      if (plan === 'basic' && BASIC_LOCKED.has(m.id)) continue
      // Avoid duplicates while preserving order
      if (ids.includes(m.id)) continue
      ids.push(m.id)
      // Pick the first preferred version that exists in our catalog
      if (Array.isArray(m.versions) && m.versions.length > 0) {
        const pref = (c.versionPrefs || [])
        const found = pref.find(v => m.versions.includes(v))
        if (found) versions[m.id] = found
      }
    }

    return { ids, versions }
  }, [BASIC_LOCKED, MODELS, plan])

  // Apply role: show popup and enable only recommended models (respect plan locks)
  const handleRoleChange = useCallback((role: string) => {
    setActiveRole(role)

    const resolved = resolveRoleConfig(role)
    if (!resolved) return

    // Show overlay with whatever providers were requested for that role (even if some are locked/unavailable)
    const overlayIds: string[] = (ROLE_FALLBACKS[role] || []).map(c => c.modelId).filter(id => !!MODELS.find(m => m.id === id))
    setRoleOverlay({ role, ids: overlayIds })
    window.setTimeout(() => setRoleOverlay(null), 5000)

    // Enable exactly the resolved ids; disable others
    const nextEnabled: { [key: string]: boolean } = {}
    MODELS.forEach(m => { nextEnabled[m.id] = false })
    resolved.ids.forEach(id => { nextEnabled[id] = true })
    setEnabledModels(nextEnabled)

    // Apply selected versions where suggested (filter out undefined to satisfy typing)
    setSelectedVersions(prev => {
      const next = { ...prev }
      Object.entries(resolved.versions || {}).forEach(([k, v]) => {
        if (typeof v === 'string') next[k] = v
      })
      return next
    })
  }, [MODELS, resolveRoleConfig])

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar 
          models={DISPLAY_MODELS}
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
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          selectedImageProviders={selectedImageProviders}
          onToggleImageProvider={(p, enabled) => setSelectedImageProviders(prev => enabled ? Array.from(new Set([...prev, p])) : prev.filter(x => x !== p))}
          selectedVideoProviders={selectedVideoProviders}
          onToggleVideoProvider={(p, enabled) => setSelectedVideoProviders(prev => enabled ? Array.from(new Set([...prev, p])) : prev.filter(x => x !== p))}
          plan={plan}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(v => !v)}
        />
      </div>
      {/* Reopen toggle when sidebar is collapsed */}
      {sidebarCollapsed && showReopenBtn && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-2 top-2 z-20 p-2 rounded-md bg-gray-800/90 text-white border border-gray-700 hover:bg-gray-700"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-0' : 'ml-64'} relative h-screen overflow-hidden transition-all duration-300 ease-in-out`}>
        <MultiModelChat 
          models={enabledModelsList}
          modelMessages={currentModelMessages}
          isLoading={currentLoading}
          selectedVersions={selectedVersions}
          onVersionChange={(modelId, version) => {
            // Prevent basic users from selecting deepseek-chat or deepseek-reasoner
            if (plan === 'basic' && modelId === 'deepseek' && ['deepseek-chat','deepseek-reasoner'].includes(version)) {
              return
            }
            setSelectedVersions(prev => ({ ...prev, [modelId]: version }))
          }}
          enabledModels={enabledModels}
          onToggleModel={setEnabledModels}
          plan={plan}
        />
        {/* Bottom overlay to mask page edge when horizontally scrolled (exclude sidebar area) */}
        <div className={`fixed ${sidebarCollapsed ? 'left-0' : 'left-64'} right-0 bottom-0 h-24 z-10 pointer-events-none bg-gradient-to-t from-gray-900/95 to-transparent transition-all duration-300 ease-in-out`} />
        {/* Floating global input - anchored within the main content area (avoids overlapping sidebar footer) */}
        <div className={`fixed ${sidebarCollapsed ? 'left-0' : 'left-64'} right-4 bottom-5 z-20 max-w-[1100px] mx-auto floating-input-safe-area transition-all duration-300 ease-in-out`}>
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={isAnyLoading}
            enabledCount={enabledCount}
            variant="floating"
            onEnhancePrompt={handleEnhancePrompt}
          />
        </div>
        {/* Role recommendation overlay */}
        {roleOverlay && (
          <ModelLoadingOverlay
            role={roleOverlay.role}
            logos={roleOverlay.ids.map(id => {
              const m = MODELS.find(x => x.id === id)
              return { src: (m as any)?.icon as string, alt: m?.name || id }
            })}
            durationMs={5000}
            onDone={() => setRoleOverlay(null)}
          />
        )}
      </div>
    </div>
  )

}

export default App
