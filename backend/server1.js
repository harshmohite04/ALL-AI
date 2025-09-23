import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './src/routes/auth.js'

dotenv.config()

const app = express()
app.use(cors({ origin: '*'}))
app.use(express.json())

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/allai'
console.log(MONGO_URI)
const PORT = process.env.PORT || 4000

// Connect to Mongo
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected')
}).catch((err) => {
  console.error('MongoDB connection error:', err)
  process.exit(1)
})

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Routes
app.use('/api/auth', authRoutes)

app.listen(PORT,'0.0.0.0' ,() => {
  console.log(`Backend listening on http://127.0.0.1:${PORT}`)
})
