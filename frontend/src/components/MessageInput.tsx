import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  enabledCount?: number
  variant?: 'default' | 'floating'
  onEnhancePrompt?: (raw: string) => Promise<string>
  onUploadFiles?: (files: FileList) => void
}

  export default function MessageInput({ onSendMessage, disabled = false, enabledCount = 0, variant = 'default', onEnhancePrompt, onUploadFiles }: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [showPopup, setShowPopup] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [enhancing, setEnhancing] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)

  // Keep focus on the textarea when enabled
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  // Collapse back to single-line when message is cleared
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    if (message === '') {
      setExpanded(false)
      ta.style.height = 'auto'
      ta.style.height = '56px'
    }
  }, [message])

  // Initialize and persist image model preferences
  // Removed image/video model preference effects since image/video generation UI was removed

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPopup && !(event.target as Element).closest('.popup-container')) {
        setShowPopup(false)
      }
    }

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopup])

  // Expose input container height via CSS var --input-height (with a small safety margin)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => {
      const h = el.offsetHeight || 0
      const margin = 16 // extra padding so content never touches
      document.documentElement.style.setProperty('--input-height', `${h + margin}px`)
      // Notify listeners (e.g., chat columns) that the input height changed
      try {
        document.dispatchEvent(new Event('input-height-change'))
      } catch {}
    }
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      // After sending, keep the cursor in the textarea
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleMenuClick = (option: string) => {
    console.log('Selected option:', option)
    setShowPopup(false)
    // Here you can add specific functionality for each option
  }

  // Uploads handling
  const handleUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (onUploadFiles) {
        onUploadFiles(files)
      } else {
        console.log('Files selected:', Array.from(files).map(f => `${f.name} (${f.type || 'unknown'})`))
      }
      // reset input to allow re-selecting the same files
      e.target.value = ''
      // keep focus on textarea
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }

  const handleEnhance = async () => {
    if (disabled) return
    const raw = message.trim()
    if (!raw) {
      // brief shake effect
      const el = textareaRef.current
      if (el) {
        el.classList.add('ring-2','ring-red-500')
        setTimeout(() => el.classList.remove('ring-2','ring-red-500'), 500)
      }
      return
    }
    if (!onEnhancePrompt) return
    try {
      setEnhancing(true)
      const improved = await onEnhancePrompt(raw)
      setMessage(improved)
      // focus back
      setTimeout(() => textareaRef.current?.focus(), 0)
      // success glow
      const el = textareaRef.current
      if (el) {
        el.classList.add('ring-2','ring-emerald-500')
        setTimeout(() => el.classList.remove('ring-2','ring-emerald-500'), 700)
      }
    } catch (e) {
       console.error('Enhance failed:', e)
    } finally {
      setEnhancing(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`max-w-4xl mx-auto bg-[#0b101b] shadow-lg px-3 py-1 border border-gray-700 ${expanded ? 'rounded-2xl' : 'rounded-full'}`}
    >
      <div className="relative">
        <button
          type="button"
          className={`popup-container ${
            variant === 'floating'
              ? `absolute left-2 ${expanded ? 'bottom-4' : 'top-1/2 -translate-y-1/2'} w-8 h-8 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white transition-all duration-200 flex items-center justify-center`
              : `absolute left-3 ${expanded ? 'bottom-5' : 'top-1/2 -translate-y-1/2'} w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center`
          }`}
          onClick={() => setShowPopup(!showPopup)}
          onMouseDown={(e) => {
            // Prevent button from taking focus away from the textarea
            e.preventDefault()
          }}
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
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
        
        {/* Popup Menu */}
        {showPopup && (
          <div className="absolute left-3 top-0 transform -translate-y-full mb-2 bg-[#0b101b] rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
            <button
              onClick={() => handleMenuClick('upload-files')}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
            </button>
            <button
              onClick={() => handleMenuClick('documents-pdfs')}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents & PDFs
            </button>
            <button
              onClick={() => handleMenuClick('think-longer')}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Think Longer
            </button>
            <button
              onClick={() => handleMenuClick('deep-research')}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Deep Research
            </button>
            <button
              onClick={() => handleMenuClick('web-search')}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              Web Search
            </button>
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Ask me anything`}
          disabled={disabled}
          autoFocus
          className={
            variant === 'floating'
              ? `w-full px-12 py-3 ${expanded ? 'pb-12' : ''} pr-20 rounded-xl resize-none focus:outline-none  bg-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`
              : `w-full px-16 py-4 ${expanded ? 'pb-12' : ''} pr-20  rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white`
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
            const min = 56
            setExpanded(target.scrollHeight > min + 1)
          }}
        />
        <button
          type="button"
          className={
            variant === 'floating'
              ? `absolute right-12 ${expanded ? 'bottom-4' : 'top-1/2 -translate-y-1/2'} w-8 h-8 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white transition-all duration-200 flex items-center justify-center`
              : `absolute right-12 ${expanded ? 'bottom-5' : 'top-1/2 -translate-y-1/2'} w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center`
          }
          onMouseDown={(e) => {
            // Prevent button from taking focus away from the textarea
            e.preventDefault()
          }}
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        </button>
        {/* Uploads Button (beside Enhance) */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled}
          className={
            variant === 'floating'
              ? `absolute right-28 ${expanded ? 'bottom-4' : 'top-1/2 -translate-y-1/2'} w-8 h-8 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white transition-all duration-200 flex items-center justify-center`
              : `absolute right-32 ${expanded ? 'bottom-5' : 'top-1/2 -translate-y-1/2'} w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center`
          }
          onMouseDown={(e) => e.preventDefault()}
          title="Upload files"
          aria-label="Upload files"
        >
          {/* Upload icon */}
          <svg className={variant === 'floating' ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Enhance Button (magic) */}
        <button
          type="button"
          onClick={handleEnhance}
          disabled={disabled || enhancing}
          className={
            variant === 'floating'
              ? `absolute right-20 ${expanded ? 'bottom-4' : 'top-1/2 -translate-y-1/2'} w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${enhancing ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`
              : `absolute right-24 ${expanded ? 'bottom-5' : 'top-1/2 -translate-y-1/2'} w-10 h-10 rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center ${enhancing ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`
          }
          onMouseDown={(e) => e.preventDefault()}
          title="Enhance prompt"
          aria-label="Enhance prompt"
        >
          {/* Magic wand icon */}
          <svg className={variant === 'floating' ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7l-7 7m8-3l3 3m-1-8l2-2m-6 0l1-3m-9 9l-3 1m6 5l-2 2" />
          </svg>
          {enhancing && (
            <span className="absolute inset-0 rounded-full ring-2 ring-pink-400/60 animate-ping" />
          )}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          type="button"
          onMouseDown={(e) => {
            // Prevent button from taking focus away from the textarea
            e.preventDefault()
          }}
          className={
            variant === 'floating'
              ? `absolute right-2 ${expanded ? 'bottom-4' : 'top-1/2 -translate-y-1/2'} w-8 h-8 bg-white text-blue-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg`
              : `absolute right-3 ${expanded ? 'bottom-5' : 'top-1/2 -translate-y-1/2'} w-10 h-10 bg-white text-blue-600 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center justify-center`
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
              d="M13 7l5 5m0 0l-5 5m5-5H6" 
            />
          </svg>
        </button>
        
      </div>

      {/* Removed Generate Image/Video buttons */}

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
          <div className="text-xs text-gray-500 mt-4 text-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="font-medium text-blue-700">{enabledCount}</span> models will respond to your message
          </div>
        </>
      )}
    </div>
  )
}
