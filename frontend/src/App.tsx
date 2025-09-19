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
    versions: ['gpt-5', 'gpt-4o', 'gpt-4-turbo']
  },
  { 
    id: 'gemini', 
    name: 'Gemini 2.5 Pro', 
    color: 'blue', 
    icon: '💎',
    versions: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
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
    versions: ['deepseek-chat', 'deepseek-coder']
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
    chatgpt: true,
    gemini: true,
    deepseek: true
  })

  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: string}>({
    chatgpt: 'gpt-5',
    gemini: 'gemini-2.5-pro',
    deepseek: 'deepseek-chat'
  })

  const [modelMessages, setModelMessages] = useState<ModelMessages>({
    chatgpt: [{
      id: '1',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'chatgpt'
    }, {
      id: '2',
      content: 'I don\'t have a personal name or version number I can share. What I can tell you is that I\'m an AI assistant created by OpenAI to provide accurate, clear, and helpful responses across a wide range of topics.\n\nIf you\'d like, you can tell me more about what you want to do, and I can explain my capabilities in that context—for example: answering questions, helping with writing, reasoning through problems, or breaking down complex concepts.\n\n⚠️ Do you want to know more about what kinds of tasks I can handle?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'chatgpt'
    }, {
      id: '3',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'chatgpt'
    }],
    gemini: [{
      id: '1',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'gemini'
    }, {
      id: '2',
      content: 'I\'m an AI developed by OpenAI, here to assist you with your questions and tasks. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'gemini'
    }, {
      id: '3',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'gemini'
    }, {
      id: '4',
      content: 'I\'m an OpenAI language model designed to assist with information, problem-solving, and conversation. If you have any specific questions or need help with something, feel free to ask!',
      role: 'assistant',
      timestamp: new Date(),
      model: 'gemini'
    }],
    deepseek: [{
      id: '1',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'deepseek'
    }, {
      id: '2',
      content: 'I\'m an AI assistant designed to provide helpful, accurate, and engaging responses to your questions. My focus is on understanding your needs and delivering the best possible assistance, whether you\'re looking for information, creative ideas, or problem-solving support.\n\nIf you have any specific questions or tasks, feel free to ask—I\'m here to help!',
      role: 'assistant',
      timestamp: new Date(),
      model: 'deepseek'
    }, {
      id: '3',
      content: 'Which model are you?',
      role: 'user',
      timestamp: new Date(),
      model: 'deepseek'
    }, {
      id: '4',
      content: 'I\'m an AI language model designed to assist with a wide range of topics, from answering questions and brainstorming ideas to offering guidance on complex subjects. While I don\'t have a specific public model name or version number, you can think of me as a highly capable conversational assistant optimized for accuracy, clarity, and helpfulness.\n\nIf you\'re curious about my capabilities or how I can assist you, feel free to ask—I\'m happy to help!',
      role: 'assistant',
      timestamp: new Date(),
      model: 'deepseek'
    }]
  })
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})

  // Broadcast a user message to all enabled models
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

    // Simulated responses per model
    const responses: {[key: string]: string} = {
      chatgpt: `I'm ${selectedVersions.chatgpt}! I received your message: "${content}".`,
      gemini: `Hello! I'm ${selectedVersions.gemini}. Your message was: "${content}".`,
      deepseek: `Hi! I'm ${selectedVersions.deepseek}. I read: "${content}".`
    }

    let idx = 0
    Object.keys(responses).forEach(modelId => {
      if (!enabledModels[modelId]) return
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `${Date.now() + idx}-${modelId}`,
          content: responses[modelId],
          role: 'assistant',
          timestamp: new Date(),
          model: modelId
        }
        setModelMessages(prev => ({
          ...prev,
          [modelId]: [...(prev[modelId] || []), assistantMessage]
        }))
        setIsLoading(prev => ({ ...prev, [modelId]: false }))
      }, 700 + (idx * 400))
      idx++
    })
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
      <div className="flex-1 ml-64 relative">
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
