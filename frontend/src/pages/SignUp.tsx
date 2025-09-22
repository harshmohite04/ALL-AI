import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function SignUp() {
  const { signUp, isLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <h1 className="text-xl font-semibold mb-5">Create your account</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Name</label>
              <input className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Email</label>
              <input className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Password</label>
              <input className="w-full rounded-lg bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <div className="text-xs text-red-300">{error}</div>}
            <button disabled={isLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60">{isLoading? 'Creating…':'Create Account'}</button>
          </form>
          <div className="mt-4 text-xs text-gray-300">
            Already have an account? <Link to="/auth/signin" className="text-blue-400">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
