import { useState } from 'react'
import Sidebar from './components/Sidebar'
import MultiModelChat from './components/MultiModelChat'
import MessageInput from './components/MessageInput'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
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
    versions: ['openai/gpt-oss-20b', 'llama-3.1-70b-versatile', 'mixtral-8x7b'],
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

  const [modelMessages, setModelMessages] = useState<ModelMessages>({})
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})

  // Broadcast a user message to all enabled models and fetch backend responses
  const handleSendMessage = async (content: string) => {
    const timestamp = new Date()

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp
    }

    // Append user message to all enabled model threads
    setModelMessages(prev => {
      const updated = { ...prev }
      Object.keys(enabledModels).forEach(modelId => {
        if (enabledModels[modelId]) {
          const id = `${userMessage.id}-${modelId}`
          updated[modelId] = [...(updated[modelId] || []), { ...userMessage, id }]
        }
      })
      return updated
    })

    // Set loading only for enabled models
    const loadingState: {[key: string]: boolean} = {}
    Object.keys(enabledModels).forEach(modelId => {
      if (enabledModels[modelId]) loadingState[modelId] = true
    })
    setIsLoading(loadingState)

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
      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_query: content,
          selected_models,
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
        setModelMessages(prev => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), assistantMessage]
        }))
        processed[modelId] = true
        setIsLoading(prev => ({ ...prev, [modelId]: false }))
      })

      // For any enabled model that didn't receive a response, stop loading and show a generic message
      Object.keys(enabledModels).forEach(modelId => {
        if (!enabledModels[modelId]) return
        if (processed[modelId]) return
        if (!providerMap[modelId]) {
          // Not supported by backend; stop loading silently
          setIsLoading(prev => ({ ...prev, [modelId]: false }))
          return
        }
        const assistantMessage: Message = {
          id: `${Date.now()}-${modelId}`,
          content: 'No response received for this model.',
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setModelMessages(prev => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), assistantMessage]
        }))
        setIsLoading(prev => ({ ...prev, [modelId]: false }))
      })
    } catch (err: any) {
      // On error, append error message to all enabled and supported models
      Object.keys(enabledModels).forEach(modelId => {
        if (!enabledModels[modelId]) return
        if (!providerMap[modelId]) {
          setIsLoading(prev => ({ ...prev, [modelId]: false }))
          return
        }
        const assistantMessage: Message = {
          id: `${Date.now()}-${modelId}`,
          content: `Error contacting backend: ${err?.message || String(err)}`,
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setModelMessages(prev => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), assistantMessage]
        }))
        setIsLoading(prev => ({ ...prev, [modelId]: false }))
      })
    }
  }

  const enabledModelsList = MODELS.filter(model => enabledModels[model.id])
  const enabledCount = Object.values(enabledModels).filter(Boolean).length

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
        />
      </div>
      <div className="flex-1 ml-64 relative h-screen overflow-hidden">
        <MultiModelChat 
          models={enabledModelsList}
          modelMessages={modelMessages}
          isLoading={isLoading}
          selectedVersions={selectedVersions}
          onVersionChange={(modelId, version) => setSelectedVersions(prev => ({ ...prev, [modelId]: version }))}
          enabledModels={enabledModels}
          onToggleModel={setEnabledModels}
        />
        {/* Bottom overlay to mask page edge when horizontally scrolled */}
        <div className="fixed left-0 right-0 bottom-0 h-24 z-10 pointer-events-none bg-gradient-to-t from-gray-900/95 to-transparent" />
        {/* Floating global input */}
        <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-20 w-[min(900px,calc(100%-7rem))] floating-input-safe-area">
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={Object.values(isLoading).some(Boolean)}
            enabledCount={enabledCount}
            variant="floating"
          />
        </div>
      </div>
    </div>
  )
}

export default App
