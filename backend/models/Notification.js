import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_order', 'order_accepted', 'order_rejected', 'order_shipped', 'order_delivered', 'payment_success'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
