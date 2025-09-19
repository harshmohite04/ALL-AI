import { useState } from 'react'

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
}

export default function Sidebar({ models, enabledModels, onToggleModel, selectedVersions: _selectedVersions, onVersionChange: _onVersionChange, enabledCount }: SidebarProps) {
  const [conversations] = useState<Conversation[]>([
    { id: '1', title: 'Multi-Model Chat', timestamp: new Date() },
    { id: '2', title: 'AI Comparison - React Help', timestamp: new Date(Date.now() - 86400000) },
    { id: '3', title: 'All Models - CSS Questions', timestamp: new Date(Date.now() - 172800000) },
  ])

  const [activeConversation, setActiveConversation] = useState('1')

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

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🎉</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              All Models
            </h1>
          </div>
        </div>
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-all duration-200">
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
            <div className="text-xs text-gray-400 mb-2">Today</div>
            {conversations.slice(0, 2).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`w-full text-left p-2 rounded-lg transition-all duration-200 text-sm ${
                  activeConversation === conversation.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className="truncate">{conversation.title}</div>
              </button>
            ))}
            <div className="pt-3">
              <div className="text-xs text-gray-400 mb-2">Yesterday</div>
              {conversations.slice(2).map((conversation) => (
                <button key={conversation.id} className="w-full text-left p-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-200">
                  <div className="truncate">{conversation.title}</div>
                </button>
              ))}
            </div>
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
        <div className="text-xs text-gray-400 mb-2">Free Plan</div>
        <div className="text-xs text-gray-500">Message limit reached</div>
        <button className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs transition-all duration-200">
          Upgrade plan
        </button>
      </div>
    </div>
  )
}
