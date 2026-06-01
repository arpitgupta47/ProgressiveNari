import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { OAuth2Client } from 'google-auth-library'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const makeToken = (user) => jwt.sign(
  { id: user._id, email: user.email, name: user.name, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('seller', 'customer').required(),
  gender: Joi.string().valid('female', 'male', 'other').optional(),
  phone: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role, gender, phone, address } = req.body

    if (role === 'seller') {
      if (!gender) {
        return res.status(400).json({ message: 'Gender is required for seller registration.' })
      }
      if (gender !== 'female') {
        return res.status(403).json({
          message: 'Progressive Naari is exclusively for women entrepreneurs. Only women can register as sellers.',
          code: 'WOMEN_ONLY'
        })
      }
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered. Please login.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      gender: gender || '',
      phone: phone || '',
      address: address || '',
      authProvider: 'local'
    })

    const token = makeToken(user)
    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid email or password' })

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google login. Please use "Login with Google".' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' })

    const token = makeToken(user)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential, role, gender } = req.body

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    if (role === 'seller' && gender !== 'female') {
      return res.status(403).json({
        message: 'Progressive Naari is exclusively for women entrepreneurs.',
        code: 'WOMEN_ONLY'
      })
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        user.authProvider = 'google'
        user.avatar = picture
        await user.save()
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: role || 'customer',
        gender: gender || '',
        authProvider: 'google',
        password: ''
      })
    }

    const token = makeToken(user)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(401).json({ message: 'Google authentication failed. Please try again.' })
  }
})

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update profile (with bank details for sellers)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, bankAccount, ifscCode, upiId } = req.body
    const updateData = { name, phone, address }
    if (req.user.role === 'seller') {
      Object.assign(updateData, { bankAccount, ifscCode, upiId })
    }
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, select: '-password' })
    res.json({ message: 'Profile updated', user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
