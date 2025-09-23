import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'insecure_dev_secret_change_me'
if (!process.env.JWT_SECRET) {
  console.warn('[auth] WARNING: JWT_SECRET is not set in environment. Using an insecure development secret. Set JWT_SECRET in your .env for security.')
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })

    const token = jwt.sign({ sub: user.email, email: user.email, account_id: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ sub: user.email, email: user.email, account_id: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router

