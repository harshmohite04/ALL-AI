import { useState, type KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  enabledCount?: number
  variant?: 'default' | 'floating'
}

export default function MessageInput({ onSendMessage, disabled = false, enabledCount = 0, variant = 'default' }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={
      variant === 'floating'
        ? 'bg-gray-800/90 border border-gray-700 rounded-2xl p-3 shadow-2xl backdrop-blur '
        : 'bg-gradient-to-r from-white to-gray-50 border-t border-gray-200/50 p-6 shadow-lg'
    }>
      <div className="max-w-full mx-auto ">
        <div className="relative ">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${enabledCount} AI models...`}
            disabled={disabled}
            className={
              variant === 'floating'
                ? 'w-full px-4 py-3 pr-12 rounded-xl resize-none focus:outline-none border border-gray-700 bg-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'w-full px-6 py-4 pr-16 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white'
            }
            rows={1}
            style={{
              minHeight: '56px',
              maxHeight: '200px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 200) + 'px'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className={
              variant === 'floating'
                ? 'absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100'
            }
          >
            <svg 
              className={variant === 'floating' ? 'w-4 h-4' : 'w-5 h-5'}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </div>
        {variant !== 'floating' && (
          <>
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></span>
                <span className="font-medium">OpenAI</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Gemini</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-purple-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Claude</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm"></span>
                <span className="font-medium">DeepSeek</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Grok</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Groq</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-teal-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Llama</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-pink-500 rounded-full shadow-sm"></span>
                <span className="font-medium">Mistral</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-3 text-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <span className="font-medium text-blue-700">{enabledCount}</span> models will respond to your message
            </div>
          </>
        )}
      </div>
    </div>
  )
}
