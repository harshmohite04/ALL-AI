interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
}

interface Model {
  id: string
  name: string
  color: string
  icon: string
}

interface ModelMessages {
  [key: string]: Message[]
}

interface MultiModelChatProps {
  models: Model[]
  modelMessages: ModelMessages
  isLoading: {[key: string]: boolean}
}

export default function MultiModelChat({ models, modelMessages, isLoading }: MultiModelChatProps) {
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

  const getModelBorderColor = (color: string) => {
    const colors = {
      green: 'border-green-200',
      blue: 'border-blue-200',
      purple: 'border-purple-200',
      indigo: 'border-indigo-200',
      red: 'border-red-200',
      orange: 'border-orange-200',
      teal: 'border-teal-200',
      pink: 'border-pink-200'
    }
    return colors[color as keyof typeof colors] || 'border-gray-200'
  }

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <div className="h-full flex overflow-x-auto horizontal-scroll">
        {models.map((model) => (
          <div key={model.id} className={`w-80 flex-shrink-0 flex flex-col border-r border-gray-200/50 last:border-r-0 shadow-sm`}>
            {/* Model Header */}
            <div className={`${getModelColor(model.color)} text-white px-6 py-4 flex items-center gap-4 shadow-lg`}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl">{model.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{model.name}</h3>
                <p className="text-xs opacity-90">AI Assistant</p>
              </div>
              {isLoading[model.id] && (
                <div className="ml-auto">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-full space-y-4">
                {modelMessages[model.id]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    } animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                  >
                    {message.role === 'assistant' && (
                      <div className={`w-9 h-9 ${getModelColor(model.color)} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <span className="text-white text-sm">{model.icon}</span>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-900 shadow-md border border-gray-100'
                      } rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-lg`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading[model.id] && (
                  <div className="flex gap-3 justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className={`w-9 h-9 ${getModelColor(model.color)} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-white text-sm">{model.icon}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-500 text-sm font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
