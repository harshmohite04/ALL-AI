import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  enabledCount?: number
  variant?: 'default' | 'floating'
}

export default function MessageInput({ onSendMessage, disabled = false, enabledCount = 0, variant = 'default' }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showImageFilter, setShowImageFilter] = useState(false)
  const [showVideoFilter, setShowVideoFilter] = useState(false)
  const [selectedGen, setSelectedGen] = useState<null | 'image' | 'video'>(null)
  const [selectedImageModels, setSelectedImageModels] = useState<Array<'Midjourney' | 'DALL·E 3' | 'Stable Diffusion'>>([])
  const [selectedVideoModels, setSelectedVideoModels] = useState<Array<'Text-to-Video' | 'Runway Gen-2' | 'Nano Banana' | 'Google Veo'>>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
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
  useEffect(() => {
    try {
      const raw = localStorage.getItem('selectedImageModels')
      if (raw) {
        const parsed = JSON.parse(raw) as Array<'Midjourney' | 'DALL·E 3' | 'Stable Diffusion'>
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedImageModels(parsed)
          return
        }
      }
      // Default selection if nothing stored
      setSelectedImageModels(['DALL·E 3'])
    } catch {
      setSelectedImageModels(['DALL·E 3'])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('selectedImageModels', JSON.stringify(selectedImageModels))
    } catch {}
  }, [selectedImageModels])

  // Initialize and persist video model preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem('selectedVideoModels')
      if (raw) {
        const parsed = JSON.parse(raw) as Array<'Text-to-Video' | 'Runway Gen-2' | 'Nano Banana' | 'Google Veo'>
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedVideoModels(parsed)
          return
        }
      }
      // Default selection if nothing stored
      setSelectedVideoModels(['Runway Gen-2'])
    } catch {
      setSelectedVideoModels(['Runway Gen-2'])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('selectedVideoModels', JSON.stringify(selectedVideoModels))
    } catch {}
  }, [selectedVideoModels])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPopup && !(event.target as Element).closest('.popup-container')) {
        setShowPopup(false)
      }
      if (showImageFilter && !(event.target as Element).closest('.image-filter-container')) {
        setShowImageFilter(false)
      }
      if (showVideoFilter && !(event.target as Element).closest('.video-filter-container')) {
        setShowVideoFilter(false)
      }
    }

    if (showPopup || showImageFilter || showVideoFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopup, showImageFilter, showVideoFilter])

  // Expose input container height via CSS var --input-height (with a small safety margin)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => {
      const h = el.offsetHeight || 0
      const margin = 16 // extra padding so content never touches
      document.documentElement.style.setProperty('--input-height', `${h + margin}px`)
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

  return (
    <div ref={rootRef} className="max-w-4xl mx-auto bg-[#0b101b] rounded-2xl shadow-lg border border-gray-200 p-4">
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
          placeholder={`Message ${enabledCount} AI models...`}
          disabled={disabled}
          autoFocus
          className={
            variant === 'floating'
              ? `w-full px-12 py-3 ${expanded ? 'pb-12' : ''} pr-20 rounded-xl resize-none focus:outline-none border border-gray-700 bg-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`
              : `w-full px-16 py-4 ${expanded ? 'pb-12' : ''} pr-20 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg bg-white`
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
      
      {/* Buttons below the input */}
      <div className="flex items-center justify-start gap-3 mt-4">
        {/* Generate Image with filter */}
        <div className="relative image-filter-container flex items-center">
          <button
            type="button"
            onClick={() => {
              setSelectedGen(prev => {
                const next = prev === 'image' ? null : 'image'
                if (next === null) setShowImageFilter(false)
                if (next === 'image') setShowVideoFilter(false)
                return next
              })
            }}
            aria-pressed={selectedGen === 'image'}
            className={
              variant === 'floating'
                ? `${selectedGen === 'image' 
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 hover:bg-blue-600 hover:text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'} px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium`
                : `${selectedGen === 'image' 
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 hover:bg-blue-100 hover:text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'} px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md`
            }
            onMouseDown={(e) => {
              e.preventDefault()
            }}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Generate Image
          </button>
          <button
            type="button"
            aria-label="Image filter"
            onClick={() => setShowImageFilter((v) => !v)}
            onMouseDown={(e) => e.preventDefault()}
            className="ml-2 w-8 h-8 rounded-full border border-gray-300/60 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center shadow-sm"
          >
            {/* Slider icon matching provided sketch */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 8H4" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="8" r="2" fill="currentColor" />
              <path d="M20 16H10" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="16" r="2" fill="currentColor" />
            </svg>
          </button>
          {showImageFilter && (
            <div className="absolute left-0 bottom-full mb-2 z-50 min-w-[240px] rounded-lg border border-gray-200 bg-[#0b101b] shadow-xl">
              <div className="py-2">
                <div className="px-3 pb-2 text-xs uppercase tracking-wide text-gray-400">Image Models</div>
                {(['Midjourney','DALL·E 3','Stable Diffusion'] as const).map(opt => (
                  <button
                    key={opt}
                    className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center justify-between ${selectedImageModels.includes(opt) ? 'bg-gray-800/60' : ''}`}
                    onClick={() => {
                      setSelectedImageModels(prev => {
                        const exists = prev.includes(opt)
                        if (exists) {
                          const next = prev.filter(x => x !== opt)
                          // Prevent deselecting the last remaining option
                          return next.length ? next : prev
                        } else {
                          return [...prev, opt]
                        }
                      })
                    }}
                  >
                    <span>{opt}</span>
                    {selectedImageModels.includes(opt) && (
                      <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate Video with filter */}
        <div className="relative video-filter-container flex items-center">
          <button
            type="button"
            onClick={() => {
              setSelectedGen(prev => {
                const next = prev === 'video' ? null : 'video'
                if (next === null) setShowVideoFilter(false)
                if (next === 'video') setShowImageFilter(false)
                return next
              })
            }}
            aria-pressed={selectedGen === 'video'}
            className={
              variant === 'floating'
                ? `${selectedGen === 'video' 
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 hover:bg-blue-600 hover:text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'} px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium`
                : `${selectedGen === 'video' 
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 hover:bg-blue-100 hover:text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'} px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md`
            }
            onMouseDown={(e) => {
              e.preventDefault()
            }}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Generate Video
          </button>
          <button
            type="button"
            aria-label="Video filter"
            onClick={() => setShowVideoFilter((v) => !v)}
            onMouseDown={(e) => e.preventDefault()}
            className="ml-2 w-8 h-8 rounded-full border border-gray-300/60 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center shadow-sm"
          >
            {/* Slider icon matching provided sketch */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 8H4" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="8" r="2" fill="currentColor" />
              <path d="M20 16H10" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="16" r="2" fill="currentColor" />
            </svg>
          </button>
          {showVideoFilter && (
            <div className="absolute left-0 bottom-full mb-2 z-50 min-w-[280px] rounded-lg border border-gray-200 bg-[#0b101b] shadow-xl">
              <div className="py-2">
                <div className="px-3 pb-2 text-xs uppercase tracking-wide text-gray-400">Video Models</div>
                {(['Text-to-Video','Runway Gen-2','Nano Banana','Google Veo'] as const).map(opt => (
                  <button
                    key={opt}
                    className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center justify-between ${selectedVideoModels.includes(opt) ? 'bg-gray-800/60' : ''}`}
                    onClick={() => {
                      setSelectedVideoModels(prev => {
                        const exists = prev.includes(opt)
                        if (exists) {
                          const next = prev.filter(x => x !== opt)
                          // Prevent deselecting the last remaining option
                          return next.length ? next : prev
                        } else {
                          return [...prev, opt]
                        }
                      })
                    }}
                  >
                    <span>{opt}</span>
                    {selectedVideoModels.includes(opt) && (
                      <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
          <div className="text-xs text-gray-500 mt-4 text-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="font-medium text-blue-700">{enabledCount}</span> models will respond to your message
          </div>
        </>
      )}
    </div>
  )
}
