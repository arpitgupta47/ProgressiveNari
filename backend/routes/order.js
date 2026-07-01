import express from 'express'
import auth from '../middleware/auth.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

const router = express.Router()
const PLATFORM_FEE = Number(process.env.PLATFORM_FEE) || 10
const DELIVERY_CHARGES = { self_pickup: 0, seller_delivery: 50, company_delivery: 200 }

// Generate 4-digit OTP for delivery confirmation
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString()

// PLACE ORDER (customer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ message: 'Only customers can place orders.' })
    const { items, deliveryType, deliveryAddress, deliveryCity, deliveryPincode, deliveryLat, deliveryLng, customerNote, paymentMethod } = req.body

    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' })
    if (!['self_pickup', 'seller_delivery', 'company_delivery'].includes(deliveryType)) return res.status(400).json({ message: 'Invalid delivery type' })

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
    const deliveryOTP = generateOTP()

    const order = await Order.create({
      customer: req.user.id, items: orderItems, deliveryType,
      deliveryAddress: deliveryAddress || '', deliveryCity: deliveryCity || '',
      deliveryPincode: deliveryPincode || '',
      deliveryLat: deliveryLat || null, deliveryLng: deliveryLng || null,
      deliveryCharge, subtotal, platformFee: PLATFORM_FEE, totalAmount, sellerPayout,
      customerNote: customerNote || '', sellerStatuses, deliveryOTP,
      paymentMethod: paymentMethod || 'razorpay',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
    })

    // Notify sellers
    for (const sellerId of sellerIds) {
      await Notification.create({
        recipient: sellerId, type: 'new_order',
        title: '🛒 New Order!',
        message: `New order from ${req.user.name}. Total: ₹${totalAmount}. Your earning: ₹${sellerPayout} (after ₹${PLATFORM_FEE} platform fee).`,
        orderId: order._id
      })
      if (req.app.get('io')) req.app.get('io').to(`seller_${sellerId}`).emit('new_order', { orderId: order._id, amount: totalAmount })
    }

    const populated = await Order.findById(order._id).populate('customer', 'name email phone')
    res.status(201).json({ message: 'Order placed!', order: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// CUSTOMER ORDERS
router.get('/my-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ message: 'Access denied' })
    const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 })
      .populate('items.product', 'title imageUrl')
      .populate('items.seller', 'name')
      .populate('deliveryBoy', 'name phone vehicleType vehicleNumber currentLatitude currentLongitude')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// SELLER ORDERS
router.get('/seller-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' })
    const orders = await Order.find({ 'items.seller': req.user.id }).sort({ createdAt: -1 })
      .populate('customer', 'name email phone address')
      .populate('deliveryBoy', 'name phone')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ===================================================
// DELIVERY BOY ROUTES
// ===================================================

// Get orders assigned to delivery boy
router.get('/delivery-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Access denied' })
    const orders = await Order.find({ deliveryBoy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('customer', 'name phone address')
      .populate('items.seller', 'name phone address city')
      .populate('items.product', 'title imageUrl')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get available orders for pickup (packed, company_delivery, no delivery boy)
router.get('/available-for-pickup', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Access denied' })

    const deliveryPerson = await User.findById(req.user.id)

    const filter = {
      deliveryType: 'company_delivery',
      deliveryBoy: null,
      status: { $in: ['accepted', 'processing', 'packed'] },
      paymentStatus: { $in: ['paid', 'pending'] }
    }

    // Filter by delivery zone if set
    if (deliveryPerson?.deliveryZone) {
      filter.$or = [
        { deliveryCity: { $regex: deliveryPerson.deliveryZone, $options: 'i' } },
        { deliveryPincode: deliveryPerson.deliveryZone }
      ]
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 })
      .populate('customer', 'name phone address')
      .populate('items.seller', 'name phone address city')
      .populate('items.product', 'title imageUrl')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delivery boy accepts/picks up order
router.put('/:orderId/delivery-accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Only delivery persons can accept orders' })

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryBoy) return res.status(400).json({ message: 'Order already assigned to another delivery person' })

    order.deliveryBoy = req.user.id
    order.deliveryBoyAssignedAt = new Date()
    order.status = 'picked_up'
    order.updatedAt = new Date()
    await order.save()

    // Notify customer
    await Notification.create({
      recipient: order.customer, type: 'delivery_assigned',
      title: '🏍️ Delivery Person Assigned!',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been picked up by a delivery person and is on the way!`,
      orderId: order._id
    })

    // Notify sellers
    const sellerIds = [...new Set(order.items.map(i => i.seller.toString()))]
    for (const sellerId of sellerIds) {
      await Notification.create({
        recipient: sellerId, type: 'delivery_picked',
        title: '📦 Order Picked Up',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} has been picked up by delivery person.`,
        orderId: order._id
      })
    }

    if (req.app.get('io')) {
      req.app.get('io').to(`customer_${order.customer}`).emit('order_update', { orderId: order._id, status: 'picked_up' })
    }

    res.json({ message: 'Order accepted for delivery!', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delivery boy marks out for delivery
router.put('/:orderId/out-for-delivery', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Access denied' })
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryBoy?.toString() !== req.user.id) return res.status(403).json({ message: 'Not your order' })

    order.status = 'out_for_delivery'
    order.updatedAt = new Date()
    await order.save()

    await Notification.create({
      recipient: order.customer, type: 'delivery_assigned',
      title: '🚀 Out for Delivery!',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is out for delivery! OTP: ${order.deliveryOTP}`,
      orderId: order._id
    })

    if (req.app.get('io')) {
      req.app.get('io').to(`customer_${order.customer}`).emit('order_update', { orderId: order._id, status: 'out_for_delivery', otp: order.deliveryOTP })
    }

    res.json({ message: 'Marked as out for delivery', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delivery boy marks delivered (requires OTP from customer)
router.put('/:orderId/delivery-complete', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Access denied' })
    const { otp } = req.body

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryBoy?.toString() !== req.user.id) return res.status(403).json({ message: 'Not your order' })
    if (order.deliveryOTP !== otp) return res.status(400).json({ message: 'Invalid OTP. Please ask customer for the correct OTP.' })

    order.status = 'delivered'
    order.sellerPayoutStatus = 'processing'
    order.updatedAt = new Date()
    await order.save()

    // Update delivery person stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalDeliveries: 1 } })

    // Notify customer
    await Notification.create({
      recipient: order.customer, type: 'order_delivered',
      title: '✅ Order Delivered!',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered successfully!`,
      orderId: order._id
    })

    // Notify seller - payout initiated
    const sellerIds = [...new Set(order.items.map(i => i.seller.toString()))]
    for (const sellerId of sellerIds) {
      await Notification.create({
        recipient: sellerId, type: 'payment_success',
        title: '💰 Payment Processing!',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} delivered! ₹${order.sellerPayout} will be sent to your UPI/bank within 24-48 hours.`,
        orderId: order._id
      })
    }

    res.json({ message: 'Order delivered successfully! 🎉', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// SELLER — accept/reject order
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
    order.status = order.sellerStatuses.every(s => s.status === 'accepted') ? 'accepted' : action === 'rejected' ? 'rejected' : order.status
    order.updatedAt = new Date()
    await order.save()

    await Notification.create({
      recipient: order.customer,
      type: action === 'accepted' ? 'order_accepted' : 'order_rejected',
      title: action === 'accepted' ? '✅ Order Accepted!' : '❌ Order Rejected',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} was ${action}.${note ? ' Note: ' + note : ''}`,
      orderId: order._id
    })

    if (req.app.get('io')) req.app.get('io').to(`customer_${order.customer}`).emit('order_update', { orderId: order._id, status: action })
    res.json({ message: `Order ${action}`, order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// SELLER — update status (processing/packed)
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Access denied' })
    const { status } = req.body
    if (!['processing', 'packed', 'shipped', 'delivered'].includes(status)) return res.status(400).json({ message: 'Invalid status' })

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.status = status
    order.updatedAt = new Date()

    if (status === 'delivered') {
      order.sellerPayoutStatus = 'processing'
      await Notification.create({
        recipient: req.user.id, type: 'payment_success',
        title: '💰 Payment Processing!',
        message: `₹${order.sellerPayout} will be sent to your account within 24-48 hours.`,
        orderId: order._id
      })
    }

    if (status === 'packed') {
      await Notification.create({
        recipient: order.customer, type: 'order_packed',
        title: '📦 Order Packed!',
        message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is packed and ready${order.deliveryType === 'company_delivery' ? ' for pickup by delivery person' : ''}!`,
        orderId: order._id
      })
    }

    await order.save()
    res.json({ message: `Order marked as ${status}`, order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
