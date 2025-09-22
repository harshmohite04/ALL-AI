import React, { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthModal() {
  const { isAuthModalOpen, closeAuth, activeTab, signIn, signUp, isLoading } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>(activeTab)

  React.useEffect(() => {
    setTab(activeTab)
  }, [activeTab])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(name, email, password)
      }
      setName('')
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    }
  }

  if (!isAuthModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Animated gradient grid backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.15),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.12),transparent_40%)]" />
      <div className="absolute inset-0 backdrop-blur-[6px] bg-black/50" onClick={closeAuth} />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4">
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.06] shadow-2xl overflow-hidden">
          {/* Shine line */}
          <div className="absolute -top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* Header tabs */}
          <div className="flex p-2 gap-2 bg-black/20">
            <button
              className={`flex-1 py-2.5 text-sm rounded-xl transition ${tab==='signin'?'bg-white/15 text-white shadow-inner':'text-gray-300 hover:bg-white/10'}`}
              onClick={() => setTab('signin')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 text-sm rounded-xl transition ${tab==='signup'?'bg-white/15 text-white shadow-inner':'text-gray-300 hover:bg-white/10'}`}
              onClick={() => setTab('signup')}
            >
              Create Account
            </button>
          </div>

          {/* Content */}
          <form onSubmit={onSubmit} className="p-6">
            {tab === 'signup' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-300 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e)=>setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="mb-1">
              <label className="block text-xs text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {error && <div className="text-red-300 text-xs mt-2">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
            >
              {isLoading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <button type="button" onClick={closeAuth} className="mt-3 w-full text-xs text-gray-300 hover:text-white">
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
