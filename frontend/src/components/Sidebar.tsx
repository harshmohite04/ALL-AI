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
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center gap-3 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Multi-Model Chat
        </button>
      </div>

      {/* Model Controls */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Model Controls ({enabledCount} active)</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto dark-scrollbar">
          {models.map((model) => (
            <div key={model.id} className="space-y-2">
              {/* Model Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 ${getModelColor(model.color)} rounded-full`}></span>
                  <span className="text-sm text-gray-300">{model.name}</span>
                </div>
                <button
                  onClick={() => handleToggleModel(model.id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    enabledModels[model.id] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      enabledModels[model.id] ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Version Dropdown */}
              {enabledModels[model.id] && (
                <div className="ml-6">
                  <select
                    value={selectedVersions[model.id]}
                    onChange={(e) => handleVersionChange(model.id, e.target.value)}
                    className="w-full text-xs bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="flex-1 overflow-y-auto p-2 dark-scrollbar">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setActiveConversation(conversation.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeConversation === conversation.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate text-sm">{conversation.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span>User</span>
        </div>
      </div>
    </div>
  )
}
