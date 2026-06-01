import express from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import auth from '../middleware/auth.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

const router = express.Router()

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
}

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE) || 10

/**
 * PAYMENT FLOW:
 * 1. Customer pays FULL amount (subtotal + delivery + ₹10 platform fee) to platform
 * 2. Platform collects the ₹10 fee automatically (it's in the total)
 * 3. When order is DELIVERED → platform pays seller (totalAmount - platformFee)
 * 4. This is done via Razorpay Payout API (seller needs to add UPI/bank)
 *
 * Without Razorpay Payout API (simpler approach for now):
 * - Record sellerPayout amount in DB
 * - Admin manually pays seller OR use Razorpay Payouts
 */

// Create Razorpay order (customer pays full amount to platform)
router.post('/create-order', auth, async (req, res) => {
  try {
    const instance = getRazorpay()
    if (!instance) {
      return res.status(500).json({ message: 'Payment gateway not configured. Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to .env' })
    }

    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.customer.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' })

    // Calculate seller payout (total - platform fee)
    const sellerPayout = order.totalAmount - PLATFORM_FEE
    order.sellerPayout = sellerPayout

    const razorpayOrder = await instance.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: `pn_${order._id.toString().slice(-8)}`,
      payment_capture: 1,
      notes: {
        platform_fee: PLATFORM_FEE,
        seller_payout: sellerPayout,
        order_id: order._id.toString()
      }
    })

    order.razorpayOrderId = razorpayOrder.id
    await order.save()

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body

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
    order.razorpayPaymentId = razorpay_payment_id
    order.status = 'placed'
    order.sellerPayoutStatus = 'pending' // Will be paid after delivery
    await order.save()

    // Notify customer
    await Notification.create({
      recipient: req.user.id,
      type: 'payment_success',
      title: '💳 Payment Successful!',
      message: `Payment of ₹${order.totalAmount} received. ₹${PLATFORM_FEE} platform fee deducted. Seller will get ₹${order.sellerPayout} after delivery.`,
      orderId: order._id
    })

    res.json({ success: true, message: 'Payment verified!', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Trigger seller payout after delivery confirmed
// Called automatically when order status → delivered
router.post('/payout-seller/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('items.seller')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.status !== 'delivered') return res.status(400).json({ message: 'Order not delivered yet' })
    if (order.sellerPayoutStatus === 'paid') return res.status(400).json({ message: 'Payout already done' })

    const instance = getRazorpay()

    // Get unique sellers
    const sellerIds = [...new Set(order.items.map(i => (i.seller._id || i.seller).toString()))]

    for (const sellerId of sellerIds) {
      const seller = await User.findById(sellerId)
      if (!seller) continue

      // Calculate this seller's items total
      const sellerItems = order.items.filter(i => (i.seller._id || i.seller).toString() === sellerId)
      const sellerEarning = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const sellerShare = sellerEarning - (PLATFORM_FEE / sellerIds.length) // Split platform fee

      if (instance && seller.upiId) {
        try {
          // Razorpay Payout to seller UPI
          // Note: Requires Razorpay X (business account) for payouts
          // For now we record it and admin processes manually
          console.log(`Payout ₹${sellerShare} to seller ${seller.name} (${seller.upiId || seller.bankAccount})`)
        } catch (payoutErr) {
          console.error('Payout error:', payoutErr)
        }
      }

      // Notify seller about earnings
      await Notification.create({
        recipient: sellerId,
        type: 'payment_success',
        title: '💰 Payment Received!',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} delivered! ₹${sellerShare.toFixed(0)} will be transferred to your UPI/bank within 24-48 hours.`,
        orderId: order._id
      })
    }

    order.sellerPayoutStatus = 'processing'
    await order.save()

    res.json({ success: true, message: 'Seller payout initiated', sellerPayout: order.sellerPayout })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get payment info
router.get('/info', (req, res) => {
  res.json({
    platform_fee: PLATFORM_FEE,
    payment_flow: 'Customer pays full amount → Platform deducts ₹10 → Seller gets rest after delivery',
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  })
})

export default router