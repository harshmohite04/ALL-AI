import React, { useEffect, useRef, useState } from 'react'

interface Option {
  label: string
  value: string
}

interface AppleSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  className?: string
}

export default function AppleSelect({ options, value, onChange, ariaLabel, className = '' }: AppleSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(() => Math.max(0, options.findIndex(o => o.value === value)))
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    setActiveIndex(Math.max(0, options.findIndex(o => o.value === value)))
  }, [value, options])

  // click outside to close
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-apple-select="true"]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const commit = (idx: number) => {
    const opt = options[idx]
    if (!opt) return
    onChange(opt.value)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(activeIndex)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(options.length - 1, i + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, i - 1))
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(options.length - 1)
      return
    }
  }

  return (
    <div className={`relative inline-block text-left select-none ${className}`} data-apple-select="true">
      {/* Control */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          // Ensure the selected item is highlighted when opening
          const idx = Math.max(0, options.findIndex(o => o.value === value))
          setActiveIndex(idx)
          setOpen(o => !o)
        }}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 bg-gradient-to-b from-gray-700/70 to-gray-800/80 text-gray-100 border border-white/10 shadow-sm hover:from-gray-600/70 hover:to-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/60 backdrop-blur-md transition-colors"
      >
        <span className="text-[11px] font-medium truncate">{selected?.label}</span>
        <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111 1.12l-4.21 3.64a.75.75 0 01-1 0L5.21 8.35a.75.75 0 01.02-1.14z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="absolute right-0 mt-1 min-w-[200px] rounded-xl border border-white/10 bg-gradient-to-b from-gray-800/95 to-gray-900/95 shadow-2xl backdrop-blur-md overflow-hidden z-30"
        >
          <div className="py-1">
            {options.map((opt, idx) => {
              const active = idx === activeIndex
              const selected = opt.value === value
              const bgClass = open
                ? selected
                  ? 'bg-white/12'
                  : active
                    ? 'bg-white/8'
                    : 'hover:bg-white/5'
                : 'hover:bg-white/5'
              const textClass = open && (active || selected) ? 'text-gray-100' : 'text-gray-200'
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(idx)}
                  className={`w-full text-left px-3 py-2 text-[11px] flex items-center justify-between transition-colors ${bgClass} ${textClass} ${selected ? 'font-semibold' : 'font-normal'}`}
                >
                  <span>{opt.label}</span>
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
