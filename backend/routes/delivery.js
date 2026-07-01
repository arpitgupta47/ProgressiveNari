import express from 'express'
import auth from '../middleware/auth.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// Get delivery person's assigned orders (orders with company_delivery)
router.get('/my-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const orders = await Order.find({ deliveryType: 'company_delivery' })
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone address')
      .populate('items.product', 'title imageUrl')
      .populate('items.seller', 'name')
    
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get assigned delivery (personal assignment - if implemented)
router.get('/assigned/:orderId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'title imageUrl price')
      .populate('items.seller', 'name')
    
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryType !== 'company_delivery') return res.status(400).json({ message: 'Not a delivery order' })
    
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update delivery status (picked up, in transit, delivered)
router.put('/:orderId/update-status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const { status, location, notes } = req.body
    if (!['picked_up', 'in_transit', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryType !== 'company_delivery') return res.status(400).json({ message: 'Not a delivery order' })
    
    // Update delivery status (could be in a separate deliveryStatus field)
    if (status === 'picked_up') {
      order.status = 'shipped'
    } else if (status === 'delivered') {
      order.status = 'delivered'
      // Trigger seller payout notification
      for (const item of order.items) {
        await Notification.create({
          recipient: item.seller,
          type: 'order_delivered',
          title: '✅ Order Delivered!',
          message: `Order #${order._id.toString().slice(-6).toUpperCase()} has been delivered by our delivery partner.`,
          orderId: order._id
        })
      }
    } else if (status === 'failed') {
      order.status = 'processing' // back to processing
    }
    
    // Store delivery tracking info
    order.deliveryTrackingStatus = status
    order.deliveryPersonId = req.user.id
    order.deliveryNotes = notes || ''
    order.updatedAt = new Date()
    
    await order.save()
    
    // Notify customer about status update
    await Notification.create({
      recipient: order.customer,
      type: 'order_shipped',
      title: status === 'picked_up' ? '📦 Order Picked Up!' : 
             status === 'in_transit' ? '🚚 On The Way!' :
             status === 'delivered' ? '✅ Delivered!' : '❌ Delivery Failed',
      message: status === 'picked_up' ? 'Your order has been picked up by our delivery partner.' :
               status === 'in_transit' ? 'Your order is on the way.' :
               status === 'delivered' ? 'Your order has been delivered successfully!' :
               'Delivery attempt failed. Please contact support.',
      orderId: order._id
    })
    
    res.json({ message: `Order marked as ${status}`, order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get delivery person stats
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const user = await User.findById(req.user.id)
    const totalOrders = await Order.countDocuments({ deliveryPersonId: req.user.id })
    const todayOrders = await Order.countDocuments({
      deliveryPersonId: req.user.id,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    })
    const completedOrders = await Order.countDocuments({
      deliveryPersonId: req.user.id,
      status: 'delivered'
    })
    
    res.json({
      totalOrders,
      todayOrders,
      completedOrders,
      rating: user?.deliveryPersonRating || 0,
      vehicle: user?.deliveryPersonVehicle || 'Not specified',
      zones: user?.deliveryPersonZones || []
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get available orders (not yet assigned to any delivery person)
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const user = await User.findById(req.user.id)
    const userZones = user?.deliveryPersonZones || []
    
    const availableOrders = await Order.find({
      deliveryType: 'company_delivery',
      status: 'accepted',
      deliveryPersonId: { $exists: false }
    })
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone address')
      .populate('items.product', 'title imageUrl')
      .limit(20)
    
    res.json(availableOrders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Accept/Claim an order
router.post('/:orderId/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_person') return res.status(403).json({ message: 'Access denied' })
    
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.deliveryType !== 'company_delivery') return res.status(400).json({ message: 'Not a delivery order' })
    if (order.deliveryPersonId) return res.status(400).json({ message: 'Order already assigned' })
    
    order.deliveryPersonId = req.user.id
    order.deliveryTrackingStatus = 'assigned'
    await order.save()
    
    // Notify customer
    await Notification.create({
      recipient: order.customer,
      type: 'order_shipped',
      title: '🚚 Delivery Partner Assigned!',
      message: `A delivery partner has been assigned to your order. Tracking will begin soon.`,
      orderId: order._id
    })
    
    res.json({ message: 'Order accepted', order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
