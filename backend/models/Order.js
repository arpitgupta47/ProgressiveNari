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
  deliveryCity: { type: String, default: '' },
  deliveryPincode: { type: String, default: '' },
  deliveryLat: { type: Number, default: null },
  deliveryLng: { type: Number, default: null },
  deliveryCharge: { type: Number, default: 0 },

  // Delivery boy assignment (for company_delivery)
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryBoyAssignedAt: { type: Date, default: null },
  deliveryBoyNote: { type: String, default: '' },
  deliveryOTP: { type: String, default: '' }, // OTP for delivery confirmation

  subtotal: { type: Number, required: true },
  platformFee: { type: Number, default: 10 },
  totalAmount: { type: Number, required: true },
  sellerPayout: { type: Number, default: 0 },
  sellerPayoutStatus: { type: String, enum: ['pending', 'processing', 'paid'], default: 'pending' },

  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['razorpay', 'cod', 'upi'], default: 'razorpay' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },

  status: {
    type: String,
    enum: ['placed', 'accepted', 'rejected', 'processing', 'packed', 'picked_up', 'out_for_delivery', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },

  sellerStatuses: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'processing', 'packed', 'ready_for_pickup'], default: 'pending' },
    note: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  }],

  customerNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Order = mongoose.model('Order', orderSchema)
export default Order
