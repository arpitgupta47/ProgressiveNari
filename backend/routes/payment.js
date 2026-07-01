import express from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import auth from '../middleware/auth.js'
import Order from '../models/Order.js'
import Notification from '../models/Notification.js'

const router = express.Router()
const PLATFORM_FEE = Number(process.env.PLATFORM_FEE) || 10

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
}

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const instance = getRazorpay()
    if (!instance) return res.status(500).json({ message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' })

    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.customer.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' })

    const razorpayOrder = await instance.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: `pn_${order._id.toString().slice(-8)}`,
      payment_capture: 1,
      notes: {
        platform_fee: PLATFORM_FEE,
        seller_payout: order.sellerPayout,
        order_id: order._id.toString(),
        customer_name: req.user.name
      }
    })

    order.razorpayOrderId = razorpayOrder.id
    await order.save()

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderDetails: {
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        platformFee: PLATFORM_FEE,
        total: order.totalAmount
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Verify payment signature (called after successful payment)
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' })
    }

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.paymentStatus = 'paid'
    order.paymentMethod = 'razorpay'
    order.razorpayPaymentId = razorpay_payment_id
    order.status = 'placed'
    await order.save()

    await Notification.create({
      recipient: req.user.id, type: 'payment_success',
      title: '💳 Payment Successful!',
      message: `₹${order.totalAmount} paid for order #${order._id.toString().slice(-6).toUpperCase()}. Platform fee ₹${PLATFORM_FEE} deducted. Seller gets ₹${order.sellerPayout} after delivery.`,
      orderId: order._id
    })

    res.json({ success: true, message: 'Payment verified!', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// COD order confirmation
router.post('/cod-confirm', auth, async (req, res) => {
  try {
    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.customer.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' })

    order.paymentMethod = 'cod'
    order.paymentStatus = 'pending' // Will be collected on delivery
    order.status = 'placed'
    await order.save()

    await Notification.create({
      recipient: req.user.id, type: 'payment_success',
      title: '📦 Cash on Delivery Confirmed!',
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} placed. Pay ₹${order.totalAmount} at delivery.`,
      orderId: order._id
    })

    res.json({ success: true, message: 'COD order confirmed!', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Razorpay webhook (optional — for server-side payment confirmation)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const body = req.body.toString()
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) return res.status(400).json({ message: 'Invalid webhook signature' })

    const event = JSON.parse(body)
    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id
      const notes = event.payload.payment.entity.notes
      if (notes?.order_id) {
        await Order.findByIdAndUpdate(notes.order_id, { paymentStatus: 'paid', razorpayPaymentId: paymentId })
      }
    }

    res.json({ status: 'ok' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get Razorpay public key (for frontend)
router.get('/key', (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || null,
    configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    platformFee: PLATFORM_FEE
  })
})

export default router
