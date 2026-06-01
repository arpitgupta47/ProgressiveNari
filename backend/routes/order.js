import express from 'express'
import auth from '../middleware/auth.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Notification from '../models/Notification.js'

const router = express.Router()

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE) || 10
const DELIVERY_CHARGES = { self_pickup: 0, seller_delivery: 50, company_delivery: 200 }

// Place order
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ message: 'Only customers can place orders.' })
    const { items, deliveryType, deliveryAddress, customerNote } = req.body
    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' })
    if (!['self_pickup', 'seller_delivery', 'company_delivery'].includes(deliveryType)) {
      return res.status(400).json({ message: 'Invalid delivery type' })
    }

    const orderItems = []
    let subtotal = 0
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive) return res.status(400).json({ message: `Product not available` })
      const qty = item.quantity || 1
      orderItems.push({ product: product._id, title: product.title, price: product.price, quantity: qty, imageUrl: product.imageUrl || '', seller: product.seller })
      subtotal += product.price * qty
    }

    const deliveryCharge = DELIVERY_CHARGES[deliveryType]
    const totalAmount = subtotal + deliveryCharge + PLATFORM_FEE
    const sellerPayout = totalAmount - PLATFORM_FEE

    const sellerIds = [...new Set(orderItems.map(i => i.seller.toString()))]
    const sellerStatuses = sellerIds.map(seller => ({ seller, status: 'pending' }))

    const order = await Order.create({
      customer: req.user.id, items: orderItems, deliveryType,
      deliveryAddress: deliveryAddress || '', deliveryCharge, subtotal,
      platformFee: PLATFORM_FEE, totalAmount, sellerPayout,
      customerNote: customerNote || '', sellerStatuses
    })

    // Notify sellers
    for (const sellerId of sellerIds) {
      await Notification.create({
        recipient: sellerId, type: 'new_order',
        title: '🛒 New Order Received!',
        message: `New order from ${req.user.name}! Total: ₹${totalAmount}. Your earning: ₹${sellerPayout} (after ₹${PLATFORM_FEE} platform fee).`,
        orderId: order._id
      })
      if (req.app.get('io')) {
        req.app.get('io').to(`seller_${sellerId}`).emit('new_order', { orderId: order._id, message: `New order from ${req.user.name}!`, amount: totalAmount })
      }
    }

    const populated = await Order.findById(order._id).populate('customer', 'name email phone').populate('items.product', 'title imageUrl')
    res.status(201).json({ message: 'Order placed successfully!', order: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Customer's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ message: 'Access denied' })
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 })
      .populate('items.product', 'title imageUrl').populate('items.seller', 'name')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Seller's orders
router.get('/seller-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' })
    const orders = await Order.find({ 'items.seller': req.user.id }).sort({ createdAt: -1 })
      .populate('customer', 'name email phone address').populate('items.product', 'title imageUrl price')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Seller accept/reject
router.put('/:orderId/seller-action', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers can accept/reject.' })
    const { action, note } = req.body
    if (!['accepted', 'rejected'].includes(action)) return res.status(400).json({ message: 'Invalid action' })

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const sellerStatus = order.sellerStatuses.find(s => s.seller.toString() === req.user.id)
    if (!sellerStatus) return res.status(403).json({ message: 'This order does not belong to you' })

    sellerStatus.status = action
    sellerStatus.note = note || ''
    sellerStatus.updatedAt = new Date()
    order.updatedAt = new Date()

    const allAccepted = order.sellerStatuses.every(s => s.status === 'accepted')
    if (allAccepted) order.status = 'accepted'
    else if (action === 'rejected') order.status = 'processing'

    await order.save()

    await Notification.create({
      recipient: order.customer,
      type: action === 'accepted' ? 'order_accepted' : 'order_rejected',
      title: action === 'accepted' ? 'Order Accepted! ✅' : 'Order Update ❌',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} was ${action}.${note ? ' Note: ' + note : ''}`,
      orderId: order._id
    })

    if (req.app.get('io')) {
      req.app.get('io').to(`customer_${order.customer}`).emit('order_update', { orderId: order._id, status: action })
    }

    res.json({ message: `Order ${action}`, order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update order status (shipped/delivered)
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' })
    const { status } = req.body
    if (!['processing', 'shipped', 'delivered'].includes(status)) return res.status(400).json({ message: 'Invalid status' })

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const sellerStatus = order.sellerStatuses.find(s => s.seller.toString() === req.user.id)
    if (!sellerStatus) return res.status(403).json({ message: 'Unauthorized' })

    sellerStatus.status = status
    sellerStatus.updatedAt = new Date()
    order.status = status
    order.updatedAt = new Date()

    // Trigger seller payout when delivered
    if (status === 'delivered' && order.paymentStatus === 'paid') {
      order.sellerPayoutStatus = 'processing'
      // Auto-notify seller about earnings
      await Notification.create({
        recipient: req.user.id,
        type: 'payment_success',
        title: '💰 Payment Being Processed!',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} delivered! ₹${order.sellerPayout} will be transferred to your UPI/bank within 24-48 hours.`,
        orderId: order._id
      })
    }

    await order.save()

    await Notification.create({
      recipient: order.customer,
      type: status === 'shipped' ? 'order_shipped' : 'order_delivered',
      title: status === 'shipped' ? '📦 Order Shipped!' : '✅ Order Delivered!',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been ${status}!`,
      orderId: order._id
    })

    res.json({ message: `Order marked as ${status}`, order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router