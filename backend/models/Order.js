import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: '' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
})

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],

  deliveryType: {
    type: String,
    enum: ['self_pickup', 'seller_delivery', 'company_delivery'],
    required: true
  },
  deliveryAddress: { type: String, default: '' },
  deliveryCharge: { type: Number, default: 0 },

  subtotal: { type: Number, required: true },
  platformFee: { type: Number, default: 10 },
  totalAmount: { type: Number, required: true },

  // Platform fee escrow model:
  // Customer pays full amount → Platform receives it
  // Platform pays seller (totalAmount - platformFee) after delivery confirmed
  sellerPayout: { type: Number, default: 0 }, // totalAmount - platformFee
  sellerPayoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid'],
    default: 'pending'
  },
  sellerPayoutId: { type: String, default: '' }, // Razorpay payout ID

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'razorpay' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },

  status: {
    type: String,
    enum: ['placed', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },

  sellerStatuses: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered'],
      default: 'pending'
    },
    note: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  }],

  customerNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Order = mongoose.model('Order', orderSchema)
export default Order