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
    id: 'openai', 
    name: 'OpenAI', 
    color: 'green', 
    icon: '🤖',
    versions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    color: 'blue', 
    icon: '💎',
    versions: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
  },
  { 
    id: 'claude', 
    name: 'Claude', 
    color: 'purple', 
    icon: '🧠',
    versions: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku']
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    color: 'indigo', 
    icon: '🔍',
    versions: ['deepseek-chat', 'deepseek-coder']
  },
  { 
    id: 'grok', 
    name: 'Grok', 
    color: 'red', 
    icon: '⚡',
    versions: ['grok-2', 'grok-1']
  },
  { 
    id: 'groq', 
    name: 'Groq', 
    color: 'orange', 
    icon: '🚀',
    versions: ['llama-3.1-70b', 'llama-3.1-8b', 'mixtral-8x7b']
  },
  { 
    id: 'llama', 
    name: 'Llama', 
    color: 'teal', 
    icon: '🦙',
    versions: ['llama-3.1-70b', 'llama-3.1-8b', 'llama-2-70b']
  },
  { 
    id: 'mistral', 
    name: 'Mistral', 
    color: 'pink', 
    icon: '🌪️',
    versions: ['mistral-large', 'mistral-medium', 'mistral-small']
  }
]

function App() {
  const [enabledModels, setEnabledModels] = useState<{[key: string]: boolean}>({
    openai: true,
    gemini: true,
    claude: true,
    deepseek: false,
    grok: false,
    groq: false,
    llama: false,
    mistral: false
  })

  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: string}>({
    openai: 'gpt-4o',
    gemini: 'gemini-1.5-pro',
    claude: 'claude-3.5-sonnet',
    deepseek: 'deepseek-chat',
    grok: 'grok-2',
    groq: 'llama-3.1-70b',
    llama: 'llama-3.1-70b',
    mistral: 'mistral-large'
  })

  const [modelMessages, setModelMessages] = useState<ModelMessages>({
    openai: [{
      id: '1',
      content: 'Hello! I\'m GPT-4o. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'openai'
    }],
    gemini: [{
      id: '2',
      content: 'Hi there! I\'m Gemini 1.5 Pro. What would you like to know?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'gemini'
    }],
    claude: [{
      id: '3',
      content: 'Greetings! I\'m Claude 3.5 Sonnet. How may I assist you?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'claude'
    }],
    deepseek: [{
      id: '4',
      content: 'Hello! I\'m DeepSeek Chat. I specialize in coding and reasoning tasks.',
      role: 'assistant',
      timestamp: new Date(),
      model: 'deepseek'
    }],
    grok: [{
      id: '5',
      content: 'Hey! I\'m Grok 2. I bring humor and wit to our conversations!',
      role: 'assistant',
      timestamp: new Date(),
      model: 'grok'
    }],
    groq: [{
      id: '6',
      content: 'Hi! I\'m Groq Llama 3.1 70B. I provide fast and efficient AI responses.',
      role: 'assistant',
      timestamp: new Date(),
      model: 'groq'
    }],
    llama: [{
      id: '7',
      content: 'Hello! I\'m Llama 3.1 70B. I\'m great at open-source AI assistance.',
      role: 'assistant',
      timestamp: new Date(),
      model: 'llama'
    }],
    mistral: [{
      id: '8',
      content: 'Bonjour! I\'m Mistral Large. I excel at multilingual conversations.',
      role: 'assistant',
      timestamp: new Date(),
      model: 'mistral'
    }]
  })
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})

  const handleSendMessage = async (content: string) => {
    const timestamp = new Date()
    
    // Add user message to all models
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp
    }

    // Update enabled model messages with user message
    setModelMessages(prev => {
      const updated = { ...prev }
      Object.keys(enabledModels).forEach(modelId => {
        if (enabledModels[modelId]) {
          updated[modelId] = [...updated[modelId], { ...userMessage, id: `${userMessage.id}-${modelId}` }]
        }
      })
      return updated
    })

    // Set loading state for enabled models only
    const loadingState: {[key: string]: boolean} = {}
    Object.keys(enabledModels).forEach(modelId => {
      if (enabledModels[modelId]) {
        loadingState[modelId] = true
      }
    })
    setIsLoading(loadingState)

    // Simulate different AI responses with different delays
    const responses = {
      openai: `I'm ${selectedVersions.openai}! I received your message: "${content}". I can help you with a wide range of topics including coding, writing, analysis, and creative tasks.`,
      gemini: `Hello! I'm ${selectedVersions.gemini}. Your message "${content}" is interesting. I'm particularly good at multimodal tasks, reasoning, and providing comprehensive answers.`,
      claude: `Greetings! I'm ${selectedVersions.claude}. I understand you said: "${content}". I excel at nuanced conversations, analysis, and helping with complex reasoning tasks.`,
      deepseek: `Hi! I'm ${selectedVersions.deepseek}. Your message "${content}" caught my attention. I specialize in coding, mathematics, and logical reasoning.`,
      grok: `Hey there! I'm ${selectedVersions.grok}. "${content}" - that's interesting! I like to add humor and wit to my responses while being helpful.`,
      groq: `Hello! I'm ${selectedVersions.groq}. I received: "${content}". I'm designed for speed and efficiency in AI responses.`,
      llama: `Hi! I'm ${selectedVersions.llama}. You said "${content}". As an open-source model, I'm great at various tasks and conversations.`,
      mistral: `Bonjour! I'm ${selectedVersions.mistral}. Your message "${content}" is noted. I excel at multilingual conversations and reasoning.`
    }

    // Simulate different response times for enabled models only
    let enabledIndex = 0
    Object.keys(responses).forEach((modelId) => {
      if (enabledModels[modelId]) {
        setTimeout(() => {
          const assistantMessage: Message = {
            id: `${Date.now() + enabledIndex}-${modelId}`,
            content: responses[modelId as keyof typeof responses],
            role: 'assistant',
            timestamp: new Date(),
            model: modelId
          }
          
          setModelMessages(prev => ({
            ...prev,
            [modelId]: [...prev[modelId], assistantMessage]
          }))
          
          setIsLoading(prev => ({
            ...prev,
            [modelId]: false
          }))
        }, 800 + (enabledIndex * 500)) // Staggered responses
        enabledIndex++
      }
    })
  }

  const enabledModelsList = MODELS.filter(model => enabledModels[model.id])
  const enabledCount = Object.values(enabledModels).filter(Boolean).length

  return (
    <div className="flex h-screen bg-gray-50">
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
      <div className="flex-1 flex flex-col ml-64">
        <MultiModelChat 
          models={enabledModelsList}
          modelMessages={modelMessages}
          isLoading={isLoading}
        />
        <MessageInput 
          onSendMessage={handleSendMessage} 
          disabled={Object.values(isLoading).some(loading => loading)}
          enabledCount={enabledCount}
        />
      </div>
    </div>
  )
}

export default App
