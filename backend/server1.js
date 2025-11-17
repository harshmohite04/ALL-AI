import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './src/routes/auth.js'

dotenv.config()

const app = express()
app.use(cors({ origin: '*'}))
app.use(express.json())

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = 'LangGraphDB'
console.log('Using Mongo URI:', MONGO_URI, 'DB:', DB_NAME)
const PORT = process.env.JS_PORT || 4000
// app.use(express.static(path.join(process.cwd(), 'dist'))) 
// Connect to Mongo
mongoose.connect(MONGO_URI, { dbName: DB_NAME }).then(() => {
  console.log('MongoDB connected')
}).catch((err) => {
  console.error('MongoDB connection error:', err)
  process.exit(1)
})

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Note: /preprocess is handled by the FastAPI service (CHAT_BASE). Ensure VITE_CHAT_BASE_URL points to it.

// Routes
app.use('/api/auth', authRoutes)

// Enhance prompt using a simple LLM call (OpenAI if OPENAI_API_KEY is set)
app.post('/api/enhance', async (req, res) => {
  try {
    const prompt = (req.body?.prompt || '').toString().trim()
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' })
    }

    const system = 'You are a prompt enhancer. Rewrite the user\'s prompt to be clear, specific, and goal-oriented. Preserve intent, add necessary constraints (format, tone, audience), and remove ambiguity. Reply with only the improved prompt.'

    const apiKey = process.env.OPENAI_API_KEY || ''
    if (!apiKey) {
      // Fallback: return original prompt unchanged to avoid blocking UI
      return res.json({ improved: prompt })
    }

    // Use OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('OpenAI error:', response.status, text)
      return res.status(502).json({ error: 'LLM service unavailable' })
    }

    const data = await response.json().catch(() => ({}))
    const improved = (data?.choices?.[0]?.message?.content || '').toString().trim()
    return res.json({ improved: improved || prompt })
  } catch (err) {
    console.error('Enhance endpoint failed:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
})

app.listen(PORT,'0.0.0.0' ,() => {
  console.log(`Backend listening on http://127.0.0.1:${PORT}`)
})
