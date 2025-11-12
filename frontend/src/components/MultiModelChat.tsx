import AppleSelect from './AppleSelect'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { useEffect, useRef, useState } from 'react'
import type React from 'react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
  animate?: boolean;
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
  plan?: 'basic' | 'premium'
  sessionTitle: string
  enabledCount: number
}

export default function MultiModelChat({ models, modelMessages, isLoading, selectedVersions, onVersionChange, enabledModels, onToggleModel, plan = 'basic', sessionTitle, enabledCount }: MultiModelChatProps) {
  // Resizable columns state and logic

  // Refs to each model's scroll container
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollToBottom = (id: string, smooth = true) => {
    const el = listRefs.current[id]
    if (!el) return
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    } catch {
      el.scrollTop = el.scrollHeight
    }
  }

  // Auto-scroll when messages or loading state change
  useEffect(() => {
    Object.keys(modelMessages).forEach((id) => scrollToBottom(id))
  }, [modelMessages])
  useEffect(() => {
    Object.keys(isLoading).forEach((id) => isLoading[id] && scrollToBottom(id))
  }, [isLoading])

  // Re-scroll when the floating input's height changes (MessageInput dispatches a custom event)
  useEffect(() => {
    const handler = () => {
      // Allow layout to settle before scrolling
      requestAnimationFrame(() => {
        Object.keys(listRefs.current || {}).forEach((id) => scrollToBottom(id, false))
      })
    }
    document.addEventListener('input-height-change', handler as EventListener)
    return () => document.removeEventListener('input-height-change', handler as EventListener)
  }, [])

  // Typewriter component for the latest assistant message
  // Persist streaming progress per message to avoid restarts on re-render
  const streamProgressRef = useRef<Record<string, number>>({})
  const completedRef = useRef<Record<string, boolean>>({})

  // Reader/Font controls
  const [fontScale, setFontScale] = useState<number>(1)
  const [readerMode, setReaderMode] = useState<boolean>(false)

  const clamp = (n: number, min = 0.85, max = 1.4) => Math.max(min, Math.min(max, n))

  // Build shared Markdown components (self-contained, includes its own copy logic)
  const mdComponents = {
    p({ children }: any) {
      return <p className={`mb-3 ${readerMode ? 'leading-8' : 'leading-7'} text-gray-200 text-justify break-words`}>{children}</p>
    },
    h1({ children }: any) { return <h1 className="mt-4 mb-2 text-xl font-semibold text-white">{children}</h1> },
    h2({ children }: any) { return <h2 className="mt-4 mb-2 text-lg font-semibold text-white">{children}</h2> },
    h3({ children }: any) { return <h3 className="mt-3 mb-2 text-base font-semibold text-white">{children}</h3> },
    ul({ children }: any) { return <ul className="list-disc ml-5 my-3 space-y-1 text-gray-200">{children}</ul> },
    ol({ children }: any) { return <ol className="list-decimal ml-5 my-3 space-y-1 text-gray-200">{children}</ol> },
    li({ children }: any) { return <li className="marker:text-gray-400 text-justify break-words">{children}</li> },
    blockquote({ children }: any) { return <blockquote className="border-l-4 border-gray-600 pl-3 my-3 text-gray-300 italic text-justify break-words">{children}</blockquote> },
    hr() { return <hr className="my-4 border-gray-700" /> },
    code({ inline, className, children, ...props }: any) {
      if (!inline) {
        const codeText = String(children ?? '')
        const copyCode = async () => {
          try {
            await navigator.clipboard.writeText(codeText)
          } catch {
            const ta = document.createElement('textarea')
            ta.value = codeText
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            try { document.execCommand('copy') } catch {}
            document.body.removeChild(ta)
          }
        }
        return (
          <div className="my-2 overflow-x-auto relative group">
            <button
              onClick={copyCode}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-[11px] px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              title="Copy code"
            >Copy</button>
            <pre className="bg-gray-800 text-gray-200 rounded-lg p-4 whitespace-pre min-w-full">
              <code className={`${className ?? ''}`} {...props}>{children}</code>
            </pre>
          </div>
        )
      }
      return (
        <code className="bg-gray-800/80 text-gray-100 px-1.5 py-0.5 rounded" {...props}>{children}</code>
      )
    },
    img({ src, alt, ...props }: any) { return <img src={src as string} alt={alt as string} className="max-w-full h-auto rounded" {...props} /> },
    a({ children, ...props }: any) { return <a {...props} className="break-all text-blue-400 underline">{children}</a> },
    table({ children }: any) {
      return (
        <div className="w-full overflow-x-auto my-3">
          <table className="min-w-full table-auto border border-gray-700 text-sm">{children}</table>
        </div>
      )
    },
    thead({ children }: any) { return <thead className="bg-gray-800">{children}</thead> },
    th({ children }: any) { return <th className="border border-gray-700 bg-gray-800 px-3 py-2 text-left font-semibold">{children}</th> },
    td({ children }: any) { return <td className="border border-gray-700 px-3 py-2 align-top">{children}</td> },
  } as const


  const TypewriterMarkdown: React.FC<{ id: string; text: string; onTick?: () => void; onDone?: () => void; speed?: number }> = ({ id, text, onTick, onDone, speed = 18 }) => {
    const [len, setLen] = useState<number>(() => streamProgressRef.current[id] ?? 0)
    useEffect(() => {
      // If already completed, render full text without animating
      if (completedRef.current[id]) {
        if (len !== text.length) {
          setLen(text.length)
        }
        return
      }
      let raf: number
      let last = performance.now()
      const step = (now: number) => {
        const delta = now - last
        const inc = Math.max(1, Math.floor(delta / speed))
        setLen((l) => {
          const next = Math.min(text.length, l + inc)
          streamProgressRef.current[id] = next
          onTick?.()
          if (next >= text.length) {
            completedRef.current[id] = true
            onDone?.()
            return next
          }
          return next
        })
        last = now
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
      // Only restart if text actually changes or id changes
    }, [id, text, speed, onTick, onDone])
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
        {text.slice(0, len)}
      </ReactMarkdown>
    )
  }

  // No drag handlers; equal layout only
  
  // Copy to clipboard feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }

  // Resolve logo URLs from assets; fallback to emoji when not found
  const logoModules = import.meta.glob('../assets/logos/*.{svg,png,jpg,jpeg,webp}', { eager: true, as: 'url' }) as Record<string, string>
  const getLogoUrl = (modelId: string): string | null => {
    const entry = Object.entries(logoModules).find(([path]) => path.includes(`/logos/${modelId}.`))
    return entry ? entry[1] : null
  }

  // Removed unused getModelBorderColor function

  // Determine which models to display: if any are enabled, show only enabled; otherwise show all
  const visibleModels = (enabledCount && enabledCount > 0)
    ? models.filter(m => enabledModels[m.id])
    : models

  // Equal layout for up to 3 models; beyond that, horizontal scroll with equal fixed-width columns
  const equalMode = visibleModels.length <= 3
  const COLUMN_WIDTH = 384

  // Extract DeepSeek <think> blocks and fenced code ```think blocks; return visible text + thinks
  const parseDeepseek = (text: string): { visible: string; thinks: string[] } => {
    if (!text) return { visible: '', thinks: [] }
    let working = text
    const thinks: string[] = []
    // Capture HTML-like think tags (case-insensitive, tolerate spaces)
    working = working.replace(/<\s*think\s*>[\r\n]?([\s\S]*?)<\s*\/\s*think\s*>/gi, (_m, g1) => {
      const cleaned = String(g1 || '').trim()
      if (cleaned) thinks.push(cleaned)
      return ''
    })
    // Capture fenced blocks labelled think
    working = working.replace(/```\s*think\s*[\r\n]+([\s\S]*?)```/gi, (_m, g1) => {
      const cleaned = String(g1 || '').trim()
      if (cleaned) thinks.push(cleaned)
      return ''
    })
    const visible = working.trim()
    return { visible: visible.length ? visible : '', thinks }
  }

  // Per-message toggle for revealing hidden reasoning
  const [thinkOpen, setThinkOpen] = useState<Record<string, boolean>>({})
  const toggleThink = (id: string) => setThinkOpen(prev => ({ ...prev, [id]: !prev[id] }))

  // Top scrollbar synced with main horizontal scroller (when not equalMode)
  const hScrollRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const syncingRef = useRef(false)
  const [topWidth, setTopWidth] = useState(0)

  // Measure and update the width for the top scrollbar when layout/content changes
  useEffect(() => {
    const update = () => {
      if (hScrollRef.current) {
        setTopWidth(hScrollRef.current.scrollWidth)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [models, equalMode])

  // Column widths management
  const [colWidths, setColWidths] = useState<number[]>([])
  const MIN_PCT = 15 // percent per column for 1-3 models
  const MIN_PX = 240 // pixels per column for 4+ models

  // Initialize/reset widths when visible models or mode changes
  useEffect(() => {
    const n = visibleModels.length
    if (n <= 0) { setColWidths([]); return }
    if (equalMode) {
      const per = 100 / n
      setColWidths(Array.from({ length: n }, () => per))
    } else {
      setColWidths(Array.from({ length: n }, () => COLUMN_WIDTH))
    }
  }, [visibleModels, equalMode])

  // Drag interaction between adjacent columns
  const dragState = useRef<{
    index: number // handle between index and index+1
    startX: number
    start: number[]
  } | null>(null)

  const onDragMove = (e: MouseEvent) => {
    const st = dragState.current
    if (!st) return
    const dx = e.clientX - st.startX
    setColWidths(() => {
      const next = [...st.start]
      const i = st.index
      if (equalMode) {
        const containerW = Math.max(1, hScrollRef.current?.clientWidth || 1)
        const dPct = (dx / containerW) * 100
        let w1 = next[i] + dPct
        let w2 = next[i + 1] - dPct
        // Enforce min bounds
        w1 = Math.max(MIN_PCT, w1)
        w2 = Math.max(MIN_PCT, w2)
        // Adjust delta to maintain total if clamped
        const totalOthers = next.reduce((s, v, idx) => s + (idx === i || idx === i + 1 ? 0 : v), 0)
        const remaining = 100 - totalOthers
        const sumPair = w1 + w2
        if (sumPair !== remaining) {
          const scale = remaining / sumPair
          w1 *= scale
          w2 *= scale
        }
        next[i] = w1
        next[i + 1] = w2
      } else {
        let w1 = next[i] + dx
        let w2 = next[i + 1] - dx
        // Enforce min bounds
        if (w1 < MIN_PX) {
          const diff = MIN_PX - w1
          w1 = MIN_PX
          w2 -= diff
        }
        if (w2 < MIN_PX) {
          const diff = MIN_PX - w2
          w2 = MIN_PX
          w1 -= diff
        }
        next[i] = w1
        next[i + 1] = w2
      }
      return next
    })
  }

  const onDragUp = () => {
    if (dragState.current) {
      dragState.current = null
      document.removeEventListener('mousemove', onDragMove)
      document.removeEventListener('mouseup', onDragUp)
      // Restore document styles
      try {
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      } catch {}
      // After layout settles, sync the top scrollbar width
      requestAnimationFrame(() => {
        if (hScrollRef.current) setTopWidth(hScrollRef.current.scrollWidth)
      })
    }
  }

  const startDrag = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    dragState.current = { index, startX: e.clientX, start: [...colWidths] }
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragUp)
    // Prevent text selection and show resizing cursor globally
    try {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } catch {}
  }

  const onMainScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (syncingRef.current) return
    syncingRef.current = true
    if (topScrollRef.current) topScrollRef.current.scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft
    syncingRef.current = false
  }

  const onTopScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (syncingRef.current) return
    syncingRef.current = true
    if (hScrollRef.current) hScrollRef.current.scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft
    syncingRef.current = false
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-900 h-full">
      {/* Session header */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800">
        <div className="px-4 pt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-semibold text-base truncate" title={sessionTitle}>{sessionTitle}</div>
            <div className="text-xs text-gray-400 pb-2">{enabledCount} models active</div>
          </div>
          {/* Reader/Font controls */}
          <div className="pb-2 flex items-center gap-2 text-gray-300">
            <button
              className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700"
              onClick={() => setFontScale(s => clamp(s - 0.1))}
              title="Decrease font size"
              aria-label="Decrease font size"
            >A−</button>
            <button
              className="px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700"
              onClick={() => setFontScale(s => clamp(s + 0.1))}
              title="Increase font size"
              aria-label="Increase font size"
            >A+</button>
            <button
              className={`px-2 py-1 text-xs rounded ${readerMode ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
              onClick={() => setReaderMode(v => !v)}
              title="Toggle reader mode"
              aria-pressed={readerMode}
              aria-label="Toggle reader mode"
            >Reader</button>
          </div>
        </div>
      </div>
      {/* Top horizontal scrollbar (only when columns are resizable) */}
      {!equalMode && (
        <div className="sticky top-0 z-10 bg-gray-900">
          <div
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden"
            onScroll={onTopScroll}
          >
            {/* The inner spacer creates the scroll track; width synced to content below */}
            <div style={{ width: topWidth, height: 1 }} />
          </div>
        </div>
      )}
      <div
        ref={hScrollRef}
        onScroll={equalMode ? undefined : onMainScroll}
        className={`h-full flex ${equalMode ? 'overflow-x-auto' : 'overflow-x-auto horizontal-scroll'} min-h-0 items-stretch`}
      >
        {visibleModels.map((model, idx) => (
          <div
            key={model.id}
            className={`relative flex-none min-w-0 flex flex-col border-r border-gray-700/50 last:border-r-0 min-h-0`}
            style={equalMode ? (
              // For 1-3 models, use percentage-based width with flex-none
              { width: `${colWidths[idx] ?? (100 / Math.max(1, visibleModels.length))}%` }
            ) : (
              // For 4+, use pixel-based widths
              { width: (colWidths[idx] ?? COLUMN_WIDTH) + 'px' }
            )}
          >
            {/* Model Header */}
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                {getLogoUrl(model.id) ? (
                  <img src={getLogoUrl(model.id)!} alt={`${model.name} logo`} className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6  rounded-full flex items-center justify-center">
                    {/* <span className="text-sm">{model.icon}</span> */}
                    <img src={model.icon} alt={`${model.name} logo`} className="w-6 h-6 object-contain" />
                  </div>
                )}
                <div className="w-28 truncate"><h3 className="font-medium text-sm text-white">{model.name}</h3></div>
              </div>
              <div className="flex items-center gap-2">
                {/* Version selector in header (Apple-style) */}
                <AppleSelect
                  className="w-40"
                  options={((model as any).versions as string[] | undefined)?.map((v: string) => ({
                    label: v,
                    value: v,
                    disabled:
                      // Lock ChatGPT premium variants for basic
                      (model.id === 'chatgpt' && plan === 'basic' && !['openai/gpt-oss-120b','openai/gpt-oss-20b'].includes(v))
                      ||
                      // Lock DeepSeek premium endpoints for basic
                      (model.id === 'deepseek' && plan === 'basic' && ['deepseek-chat','deepseek-reasoner'].includes(v)),
                  })) ?? []}
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
            <div
              ref={(el) => { listRefs.current[model.id] = el; }}
              className="flex-1 overflow-y-auto overflow-x-auto p-4 bg-gray-900 min-h-0 overscroll-contain"
              style={{ paddingBottom: 'var(--input-height, 160px)', scrollPaddingBottom: 'var(--input-height, 160px)' as any }}
            >
              <div className="space-y-4">
                {modelMessages[model.id]?.map((message, idx, arr) => (
                  <div key={message.id} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    {message.role === 'user' && (
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-white bg-gray-800 rounded-lg p-3" style={{ fontSize: `${clamp(fontScale)}rem` }}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={mdComponents as any}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {(() => {
                              // Fallback: explicitly render any markdown images (e.g., blob: URLs) below the text
                              const matches = Array.from(String(message.content || '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g))
                              if (!matches.length) return null
                              return (
                                <div className="mt-2 space-y-2">
                                  {matches.map((m, i) => (
                                    <img key={i} src={m[1]} alt={`upload-${i}`} className="max-w-full h-auto rounded" />
                                  ))}
                                </div>
                              )
                            })()}
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
                          <div className={`w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0`}>
                            {/* <span className="text-white text-sm">{model.icon}</span> */}
                            <img src={model.icon} alt={`${model.name} logo`} className="w-6 h-6 object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm text-gray-300 leading-relaxed" style={{ fontSize: `${clamp(fontScale)}rem` }}>
                            {(idx === arr.length - 1 && message.animate) ? (
                              <TypewriterMarkdown
                                // Animate sanitized text without <think>
                                text={parseDeepseek(message.content).visible}
                                onTick={() => scrollToBottom(model.id, false)} id={''}                              />
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={mdComponents as any}
                              >
                                  {parseDeepseek(message.content).visible}
                                </ReactMarkdown>
                              )
                            }
                          </div>
                          {/* DeepSeek reasoning reveal */}
                          {(() => { const parsed = parseDeepseek(message.content); return parsed.thinks.length > 0 ? (
                            <div className="mt-2">
                              {/* Inline hint to make it discoverable */}
                              {!thinkOpen[message.id] && (
                                <div className="text-[11px] text-gray-400 mb-1">Reasoning hidden</div>
                              )}
                              <button
                                className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                                onClick={() => toggleThink(message.id)}
                                aria-expanded={!!thinkOpen[message.id]}
                                aria-controls={`think-${message.id}`}
                              >
                                {thinkOpen[message.id] ? 'Hide reasoning' : 'Show reasoning'}
                              </button>
                              {thinkOpen[message.id] && (
                                <div id={`think-${message.id}`} className="mt-2 space-y-2">
                                  {parsed.thinks.map((t, i) => (
                                    <pre key={i} className="bg-gray-800 text-gray-200 rounded-lg p-3 overflow-x-hidden whitespace-pre-wrap break-words text-xs border border-gray-700">
                                      {t}
                                    </pre>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null })()}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                              onClick={() => handleCopy(parseDeepseek(message.content).visible, message.id)}
                              aria-label="Copy response"
                              title={copiedId === message.id ? 'Copied!' : 'Copy'}
                            >
                              {copiedId === message.id ? (
                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs" aria-label="Thumbs down">
                              <svg className="w-3 h-3 transform -rotate-185" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
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
                    <div className={`w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0`}>
                      {/* <span className="text-white text-sm">{model.icon}</span> */}
                      <img src={model.icon} alt={`${model.name} logo`} className="w-6 h-6 object-contain" />
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

            {/* Drag handle between columns */}
            {idx < visibleModels.length - 1 && (
              <div
                onMouseDown={startDrag(idx)}
                className="absolute top-0 -right-1 h-full w-3 z-20 cursor-col-resize bg-transparent hover:bg-gray-600/40 select-none"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize column"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
