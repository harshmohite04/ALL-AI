import AppleSelect from './AppleSelect'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  selectedVersions: {[key: string]: string}
  onVersionChange: (modelId: string, version: string) => void
  enabledModels: {[key: string]: boolean}
  onToggleModel: (models: {[key: string]: boolean}) => void
}

export default function MultiModelChat({ models, modelMessages, isLoading, selectedVersions, onVersionChange, enabledModels, onToggleModel }: MultiModelChatProps) {
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

  // Resolve logo URLs from assets; fallback to emoji when not found
  const logoModules = import.meta.glob('../assets/logos/*.{svg,png,jpg,jpeg,webp}', { eager: true, as: 'url' }) as Record<string, string>
  const getLogoUrl = (modelId: string): string | null => {
    const entry = Object.entries(logoModules).find(([path]) => path.includes(`/logos/${modelId}.`))
    return entry ? entry[1] : null
  }

  // Removed unused getModelBorderColor function

  return (
    <div className="flex-1 overflow-hidden bg-gray-900 h-full">
      <div className="h-full flex overflow-x-auto horizontal-scroll min-h-0 items-stretch">
        {models.map((model) => (
          <div key={model.id} className={`w-96 flex-shrink-0 flex flex-col border-r border-gray-700/50 last:border-r-0 min-h-0`}>
            {/* Model Header */}
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                {getLogoUrl(model.id) ? (
                  <img src={getLogoUrl(model.id)!} alt={`${model.name} logo`} className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm">{model.icon}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-sm text-white">{model.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Version selector in header (Apple-style) */}
                <AppleSelect
                  options={(model as any).versions?.map((v: string) => ({ label: v, value: v })) ?? []}
                  value={selectedVersions[model.id]}
                  onChange={(val) => onVersionChange(model.id, val)}
                  ariaLabel={`Select version for ${model.name}`}
                />
                {/* Enable/Disable toggle */}
                <button
                  onClick={() => onToggleModel({ ...enabledModels, [model.id]: !enabledModels[model.id] })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${enabledModels[model.id] ? 'bg-blue-600' : 'bg-gray-600'}`}
                  aria-label={`Toggle ${model.name}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${enabledModels[model.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-28 bg-gray-900 min-h-0 overscroll-contain">
              <div className="space-y-4">
                {modelMessages[model.id]?.map((message) => (
                  <div key={message.id} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    {message.role === 'user' && (
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-white bg-gray-800 rounded-lg p-3 break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ inline, className, children, ...props }: any) {
                                  if (!inline) {
                                    return (
                                      <pre className="bg-black text-gray-100 rounded-lg p-4 overflow-x-auto my-2">
                                        <code className={className} {...props}>{children}</code>
                                      </pre>
                                    )
                                  }
                                  return (
                                    <code className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded" {...props}>{children}</code>
                                  )
                                },
                                table({ children }: any) {
                                  return (
                                    <div className="w-full overflow-x-auto my-3">
                                      <table className="min-w-full border border-gray-700 text-sm">{children}</table>
                                    </div>
                                  )
                                },
                                thead({ children }: any) {
                                  return <thead className="bg-gray-800">{children}</thead>
                                },
                                th({ children }: any) {
                                  return <th className="border border-gray-700 bg-gray-800 px-3 py-2 text-left font-semibold">{children}</th>
                                },
                                td({ children }: any) {
                                  return <td className="border border-gray-700 px-3 py-2 align-top">{children}</td>
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-start gap-3 mb-4">
                        {getLogoUrl(model.id) ? (
                          <img src={getLogoUrl(model.id)!} alt={`${model.name} logo`} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className={`w-8 h-8 ${getModelColor(model.color)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-sm">{model.icon}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm text-gray-300 leading-relaxed break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ inline, className, children, ...props }: any) {
                                  if (!inline) {
                                    return (
                                      <pre className="bg-[#151515] text-gray-100 rounded-lg p-4 overflow-x-auto my-2">
                                        <code className={className} {...props}>{children}</code>
                                      </pre>
                                    )
                                  }
                                  return (
                                    <code className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded" {...props}>{children}</code>
                                  )
                                },
                                table({ children }: any) {
                                  return (
                                    <div className="w-full overflow-x-auto my-3">
                                      <table className="min-w-full border border-gray-700 text-sm">{children}</table>
                                    </div>
                                  )
                                },
                                thead({ children }: any) {
                                  return <thead className="bg-gray-800">{children}</thead>
                                },
                                th({ children }: any) {
                                  return <th className="border border-gray-700 bg-gray-800 px-3 py-2 text-left font-semibold">{children}</th>
                                },
                                td({ children }: any) {
                                  return <td className="border border-gray-700 px-3 py-2 align-top">{children}</td>
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
                              </svg>
                            </button>
                            <button className="text-gray-400 hover:text-white transition-colors text-xs">Share feedback</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading[model.id] && (
                  <div className="flex items-start gap-3 mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className={`w-8 h-8 ${getModelColor(model.color)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm">{model.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-400 text-sm">Thinking...</span>
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
