import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950 text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.14),transparent_40%)]" />
      <div className="relative">
        <header className="px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/allmodels.png" alt="All Models" className="w-9 h-9 rounded-lg" />
            <span className="font-semibold">ALL-AI</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {!user ? (
              <>
                <Link to="/auth/signin" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Sign In</Link>
                <Link to="/auth/signup" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">Create Account</Link>
              </>
            ) : (
              <Link to="/app" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Go to App</Link>
            )}
          </nav>
        </header>

        <main className="px-6 md:px-10 pt-20 pb-24">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Talk to every model.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Side-by-side. Instantly.</span>
            </h1>
            <p className="mt-5 text-gray-300 max-w-2xl">
              Compare responses from multiple AI models at once. Boost your productivity with a unified, sleek interface.
            </p>
            <div className="mt-8 flex gap-3">
              {!user ? (
                <>
                  <Link to="/auth/signup" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-medium shadow-lg shadow-blue-900/30">Get Started</Link>
                  <Link to="/auth/signin" className="px-6 py-3 rounded-xl border border-white/15 hover:bg-white/10">Sign In</Link>
                </>
              ) : (
                <Link to="/app" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15">Open Your Chats</Link>
              )}
            </div>
          </div>
        </main>

        <footer className="px-6 md:px-10 pb-8 text-xs text-gray-400">
          © {new Date().getFullYear()} ALL-AI. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
