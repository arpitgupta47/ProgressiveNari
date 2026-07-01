import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import validate from '../middleware/validate.js'
import auth from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

const makeToken = (user) => jwt.sign(
  { id: user._id, email: user.email, name: user.name, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('seller', 'customer', 'delivery').required(),
  gender: Joi.string().valid('female', 'male', 'other').optional(),
  phone: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  state: Joi.string().allow('').optional(),
  pincode: Joi.string().allow('').optional(),
  vehicleType: Joi.string().valid('bike', 'cycle', 'scooter', 'van', '').optional(),
  vehicleNumber: Joi.string().allow('').optional(),
  deliveryZone: Joi.string().allow('').optional(),
})

// REGISTER
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role, gender, phone, address, city, state, pincode, vehicleType, vehicleNumber, deliveryZone } = req.body

    // Women-only seller restriction
    if (role === 'seller') {
      if (!gender) return res.status(400).json({ message: 'Gender is required for seller registration.' })
      if (gender !== 'female') return res.status(403).json({ message: 'Progressive Naari is exclusively for women entrepreneurs.', code: 'WOMEN_ONLY' })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered. Please login.' })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name, email, password: hashedPassword, role,
      gender: gender || '', phone: phone || '', address: address || '',
      city: city || '', state: state || '', pincode: pincode || '',
      vehicleType: vehicleType || '', vehicleNumber: vehicleNumber || '',
      deliveryZone: deliveryZone || '', authProvider: 'local'
    })

    const token = makeToken(user)
    res.status(201).json({ message: 'Registration successful!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid email or password' })
    if (user.authProvider === 'google' && !user.password) return res.status(400).json({ message: 'Use Google login for this account.' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' })
    const token = makeToken(user)
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET ME
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// UPDATE PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, latitude, longitude, bankAccount, ifscCode, upiId, vehicleType, vehicleNumber, deliveryZone, isAvailable } = req.body
    const updateData = { name, phone, address, city, state, pincode }
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (req.user.role === 'seller') Object.assign(updateData, { bankAccount, ifscCode, upiId })
    if (req.user.role === 'delivery') Object.assign(updateData, { vehicleType, vehicleNumber, deliveryZone, isAvailable })
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, select: '-password' })
    res.json({ message: 'Profile updated', user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// UPDATE DELIVERY BOY LIVE LOCATION
router.put('/delivery/location', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Only delivery persons can update location' })
    const { latitude, longitude } = req.body
    await User.findByIdAndUpdate(req.user.id, { currentLatitude: latitude, currentLongitude: longitude })
    res.json({ message: 'Location updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
