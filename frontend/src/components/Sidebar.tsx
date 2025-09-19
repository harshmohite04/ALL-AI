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

export default function Sidebar({ models, enabledModels, onToggleModel, selectedVersions, onVersionChange, enabledCount }: SidebarProps) {
  const [conversations] = useState<Conversation[]>([
    { id: '1', title: 'Multi-Model Chat', timestamp: new Date() },
    { id: '2', title: 'AI Comparison - React Help', timestamp: new Date(Date.now() - 86400000) },
    { id: '3', title: 'All Models - CSS Questions', timestamp: new Date(Date.now() - 172800000) },
  ])

  const [activeConversation, setActiveConversation] = useState('1')

  const handleToggleModel = (modelId: string) => {
    onToggleModel({
      ...enabledModels,
      [modelId]: !enabledModels[modelId]
    })
  }

  const handleVersionChange = (modelId: string, version: string) => {
    onVersionChange({
      ...selectedVersions,
      [modelId]: version
    })
  }

  const getModelColor = (color: string) => {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      pink: 'bg-pink-500'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Chat Hub
            </h1>
            <p className="text-xs text-gray-400">Multi-Model Interface</p>
          </div>
        </div>
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Model Controls */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Model Controls</h3>
          <div className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">
            {enabledCount} active
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto dark-scrollbar">
          {models.map((model) => (
            <div key={model.id} className="group">
              {/* Model Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 ${getModelColor(model.color)} rounded-full shadow-lg`}></div>
                  <div>
                    <span className="text-sm font-medium text-gray-200">{model.name}</span>
                    <div className="text-xs text-gray-400">{model.icon}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleModel(model.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                    enabledModels[model.id] 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-200 ${
                      enabledModels[model.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Version Dropdown */}
              {enabledModels[model.id] && (
                <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                  <select
                    value={selectedVersions[model.id]}
                    onChange={(e) => handleVersionChange(model.id, e.target.value)}
                    className="w-full text-xs bg-gray-800/80 text-gray-300 border border-gray-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:bg-gray-800"
                  >
                    {model.versions.map((version) => (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 dark-scrollbar">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Recent Chats</h3>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setActiveConversation(conversation.id)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                activeConversation === conversation.id
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  activeConversation === conversation.id
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gray-700 group-hover:bg-gray-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{conversation.title}</div>
                  <div className="text-xs text-gray-400">
                    {conversation.timestamp.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-200">User</div>
            <div className="text-xs text-gray-400">Premium Plan</div>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
