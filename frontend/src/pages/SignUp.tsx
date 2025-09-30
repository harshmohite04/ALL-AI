import type { FormEvent } from 'react'
import { useState, useMemo, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

import ChatGPTLogo from '../assets/logos/chatgpt.png'
import ClaudeLogo from '../assets/logos/claude.png'
import GroqLogo from '../assets/logos/groq.png'
import MistralLogo from '../assets/logos/mistral.png'
import GeminiLogo from '../assets/logos/gemini.png'
import MidjourneyLogo from '../assets/logos/Midjourney.png'
import DeepseekLogo from '../assets/logos/deepseek.png'
import PerplexityLogo from '../assets/logos/perplexity.jpg'
import MetaLogo from '../assets/logos/meta.jpg'
import RunwayLogo from '../assets/logos/runway.png'
import x1Logo from '../assets/logos/grok.png'
import DeepmindLogo from '../assets/logos/deepmind.png'
import HuggingfaceLogo from '../assets/logos/huggingface.png'
import PikalabsLogo from '../assets/logos/pikalabs.jpg'
import CohereLogo from '../assets/logos/cohere.png'

// Memoized, module-scoped LogoTicker to avoid remounting on parent re-renders
const LogoTicker = memo(function LogoTicker({ logos }: { logos: string[] }) {
  return (
    <div className="mt-3 mb-6">
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="ticker-mask">
          <div className="ticker-row">
            {logos.concat(logos).map((src, i) => (
              <img
                key={`a-${i}`}
                src={src}
                alt="model logo"
                className="h-8 w-8 rounded-full object-contain ring-1 ring-white/10 bg-white/80 shrink-0"
              />
            ))}
          </div>
          <div className="ticker-row ticker-row-delay" aria-hidden>
            {logos.concat(logos).map((src, i) => (
              <img
                key={`b-${i}`}
                src={src}
                alt="model logo duplicate"
                className="h-8 w-8 rounded-full object-contain ring-1 ring-white/10 bg-white/80 shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .ticker-mask{ mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent); -webkit-mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent); }
        .ticker-row{ position:relative; display:flex; gap:clamp(12px, 2vw, 24px); padding:8px 12px; width:max-content; animation:scroll-x 24s linear infinite; }
        .ticker-row-delay{ animation-delay:-12s; }
        @keyframes scroll-x{ from{ transform:translateX(0);} to{ transform:translateX(-50%);} }
      `}</style>
    </div>
  )
})

export default function SignUp() {
  const { signUp, isLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  // Logos reused from Landing for consistent visual language
  const logos: string[] = useMemo(() => [
    ChatGPTLogo as unknown as string,
    ClaudeLogo as unknown as string,
    GroqLogo as unknown as string,
    MistralLogo as unknown as string,
    GeminiLogo as unknown as string,
    MidjourneyLogo as unknown as string,
    DeepseekLogo as unknown as string,
    PerplexityLogo as unknown as string,
    MetaLogo as unknown as string,
    RunwayLogo as unknown as string,
    x1Logo as unknown as string,
    DeepmindLogo as unknown as string,
    HuggingfaceLogo as unknown as string,
    PikalabsLogo as unknown as string,
    CohereLogo as unknown as string,
  ], [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signUp(name, email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err?.message || 'Sign up failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.18),transparent_40%)]" />
      <div className="relative w-full max-w-md mx-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md">
          <h1 className="text-xl font-extrabold leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400">
              Create. Compare. Collaborate.
            </span>
          </h1>
          <p className="mt-1 text-xs text-gray-300/90">Your multi‑model workspace starts here.</p>
          <LogoTicker logos={logos} />
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Name</label>
              <input className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Email</label>
              <input className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500/40"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => password && setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={!password}
                  className={`absolute inset-y-0 right-2 my-auto p-1.5 rounded-md focus:outline-none ${password ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500/50 opacity-60 pointer-events-none'}`}
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.58 10.58a3 3 0 004.24 4.24" />
                      <path d="M9.88 5.09A9.77 9.77 0 0112 5c5.52 0 9.77 4.5 10.5 6-.26.48-1.2 2.02-2.96 3.46M6.18 6.18C3.97 7.61 2.54 9.49 2 11c.38.94 4.38 6 10 6 1.28 0 2.5-.2 3.61-.57" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="text-xs text-red-300" aria-live="polite">{error}</div>}
            <button disabled={isLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 shadow-lg shadow-blue-900/20">{isLoading? 'Creating…':'Create Account'}</button>
          </form>
          <div className="mt-4 text-xs text-gray-300">
            Already have an account? <Link to="/auth/signin" className="text-blue-400">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
