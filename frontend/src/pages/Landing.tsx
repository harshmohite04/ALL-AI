import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import HeroImg from '../assets/dr_strange.png'
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

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950 text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.14),transparent_40%)]" />
      {/* Subtle futuristic grid overlay */}
      <svg className="pointer-events-none absolute inset-0 opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
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

        <main className="px-6 md:px-10 pt-10 pb-24">
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div className="max-w-2xl -mt-40">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-xs uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                I’m <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400">1000x</span>
              </div>
              <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
                Talk to every model.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400">Side-by-side. Instantly.</span>
              </h1>
              <p className="mt-5 text-gray-300/90 max-w-xl">
                Compare and orchestrate responses from multiple AI models in one clean, unified workspace. Designed for speed, clarity, and creative flow.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {!user ? (
                  <>
                    <Link to="/auth/signup" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-medium shadow-lg shadow-blue-900/30">Get Started</Link>
                    <Link to="/auth/signin" className="px-6 py-3 rounded-xl border border-white/15 hover:bg-white/10">Sign In</Link>
                  </>
                ) : (
                  <Link to="/app" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15">Open Your Chats</Link>
                )}
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-gray-400">
                <div className="flex -space-x-2">
                  {[ChatGPTLogo, ClaudeLogo, GroqLogo, MistralLogo, GeminiLogo,DeepseekLogo,PerplexityLogo,MetaLogo,RunwayLogo,x1Logo,DeepmindLogo,HuggingfaceLogo,PikalabsLogo,CohereLogo].map((src, i) => (
                    <img key={i} src={src as unknown as string} className="w-7 h-7 rounded-full ring-2 ring-gray-900 object-contain bg-white/80" alt="model avatar" />
                  ))}
                </div>
                <span>ChatGPT • Claude • Llama • Mistral • Gemini</span>
              </div>
            </div>

            {/* Right: Hero with animated badges */}
            <div className="relative mx-auto w-full max-w-xl aspect-[6/8] rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-blue-900/20">
              {/* Central image (replace later) */}
              <img
                src={HeroImg}
                alt="Hero"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-gray-950/30" />

              {/* Floating model badges (dummy images) */}
              {[
                { src: ChatGPTLogo, className: 'hero-badge chat-gpt w-15 h-15 ' },
                { src: ClaudeLogo, className: 'hero-badge claude w-15 h-15' },
                { src: GroqLogo, className: 'hero-badge groq w-15 h-15' },
                { src: GeminiLogo, className: 'hero-badge gemini w-15 h-15' },
                { src: MistralLogo, className: 'hero-badge mistral w-15 h-15 p-1 bg-white rounded-full' },
                { src: MidjourneyLogo, className: 'hero-badge midjourney w-15 h-15' },
                { src: DeepseekLogo, className: 'hero-badge deepseek w-15 h-15' },
                { src: PerplexityLogo, className: 'hero-badge perplexity w-15 h-15' },
                { src: MetaLogo, className: 'hero-badge meta w-15 h-15' },
                { src: RunwayLogo, className: 'hero-badge runway w-15 h-15' },
                { src: x1Logo, className: 'hero-badge x1 w-15 h-15' },
                // { src: DeepmindLogo, className: 'hero-badge deepmind w-15 h-15' },
                { src: HuggingfaceLogo, className: 'hero-badge huggingface w-15 h-15' },
                { src: PikalabsLogo, className: 'hero-badge pikalabs w-15 h-15' },
                { src: CohereLogo, className: 'hero-badge cohere w-15 h-15  ' },
              ].map((b, i) => (
                <img key={i} src={b.src as unknown as string} alt="model badge" className={`${b.className} rounded-full shadow-lg object-contain`} />
              ))}
            </div>
          </div>
        </main>

        <footer className="px-6 md:px-10 pb-8 text-xs text-gray-400">
          © {new Date().getFullYear()} ALL-AI. All rights reserved.
        </footer>
      </div>
      {/* Component-scoped styles for badge motion */}
      <style>
        {`
        .hero-badge {
          position: absolute;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset;
          backdrop-filter: blur(2px);
          animation: float 6s ease-in-out infinite;
        }
        .chat-gpt { top: 0.1%; left: 37%; animation-delay: 0s; }
        .claude { top: 6%; left: 65%; animation-delay: 0.6s; }
        .groq { top: 12%; left: 11%; animation-delay: 1.1s; }
        .mistral { top: 13%; left: 72%; animation-delay: 1.7s; }
        .gemini { top: 0.1%; left: 50%; animation-delay: 2.2s; }
        .midjourney { top: 5%; left: 20%; animation-delay: 2.7s; }
        .deepseek { top: 20%; left: 7%; animation-delay: 3.5s; }
        .perplexity { top: 30%; left: 5%; animation-delay: 4.0s; }
        .meta { top: 20%; left: 80%; animation-delay: 3.6s; }
        .runway { top: 29%; left: 83%; animation-delay: 3.2s; }
        .deepmind { top: 40%; left: 70%; animation-delay: 2.7s; }
        .x1 { top: 40%; left: 15%; animation-delay: 2.4s; }
        .huggingface { top: 40%; left: 70%; animation-delay: 1.3s; }
        .pikalabs { top: 50%; left: 25%; animation-delay: 3.2s; }
        .cohere { top: 48%; left: 62%; animation-delay: 2.0s; }
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-8px) translateX(6px) rotate(2deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(-2deg); }
          75% { transform: translateY(-10px) translateX(-6px) rotate(1deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        `}
      </style>
    </div>
  )
}
