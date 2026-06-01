import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/product.js'
import orderRoutes from './routes/order.js'
import paymentRoutes from './routes/payment.js'
import notificationRoutes from './routes/notification.js'

dotenv.config()
connectDB()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const httpServer = createServer(app)

const PORT = process.env.PORT || 5000

// Allowed Frontend Origins
const ALLOWED_ORIGINS = [
  'https://progressivenaari.onrender.com',
  'http://localhost:5173'
]

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

app.set('io', io)

io.use((socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error('Authentication required'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = decoded
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const { id, role } = socket.user

  socket.join(`${role}_${id}`)

  console.log(`✅ Connected: ${socket.user.name} (${role})`)

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.user.name}`)
  })
})

// Security Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }))

// CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('CORS not allowed'))
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(morgan('tiny'))

app.use('/uploads', express.static('uploads'))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/notifications', notificationRoutes)

const frontendDistPath = path.resolve(__dirname, '../frontend/dist')
app.use(express.static(frontendDistPath))

app.get('/api', (req, res) => {
  res.json({
    message: 'Progressive Naari API v3.0 ✅',
    platform_fee: `₹${process.env.PLATFORM_FEE || 10}`,
    payment_flow: 'Customer → Platform → Seller',
    google_auth: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured',
    razorpay: process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not configured'
  })
})

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) next(err)
  })
})

app.use((err, req, res, next) => {
  console.error(err)

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  })
})

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
